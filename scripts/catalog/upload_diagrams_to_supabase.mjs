import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DIAGRAMS_DIR = path.join(ROOT, "public/diagrams");
const DEFAULT_BUCKET = "diagram-assets";
const DEFAULT_PREFIX = "diagrams";
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_RETRIES = 4;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    values[key] = value;
  }
  return values;
}

function readConfig() {
  const merged = {
    ...loadEnvFile(path.join(ROOT, ".env")),
    ...loadEnvFile(path.join(ROOT, ".env.production.local")),
    ...process.env,
  };
  const url = merged.SUPABASE_URL || merged.VITE_SUPABASE_URL;
  const serviceRoleKey = merged.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = merged.SUPABASE_DIAGRAMS_BUCKET || DEFAULT_BUCKET;
  const prefix = String(merged.SUPABASE_DIAGRAMS_PREFIX || DEFAULT_PREFIX).replace(/^\/+|\/+$/g, "");

  if (!url) throw new Error("SUPABASE_URL or VITE_SUPABASE_URL is required");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  return { url, serviceRoleKey, bucket, prefix };
}

function walkFiles(rootDir) {
  const files = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }
      files.push(entryPath);
    }
  }
  return files.sort();
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".webp": return "image/webp";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".json": return "application/json";
    default: return "application/octet-stream";
  }
}

async function ensureBucket(storage, bucket) {
  const { data, error } = await storage.listBuckets();
  if (error) throw error;
  if (data.some((item) => item.name === bucket)) return;
  const created = await storage.createBucket(bucket, { public: true });
  if (created.error && !/already exists/i.test(created.error.message || "")) {
    throw created.error;
  }
}

async function runPool(items, concurrency, worker) {
  let index = 0;
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current, index, items.length);
    }
  });
  await Promise.all(runners);
}

function isTransientStorageError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("bad gateway")
    || message.includes("gateway timeout")
    || message.includes("timed out")
    || message.includes("fetch failed")
    || message.includes("econnreset")
    || message.includes("etimedout")
    || message.includes("socket hang up")
    || message.includes("503")
    || message.includes("504");
}

async function uploadWithRetry(storage, bucket, bucketPath, body, options, retries) {
  let attempt = 0;
  while (true) {
    const { error } = await storage.from(bucket).upload(bucketPath, body, options);
    if (!error) return;
    attempt += 1;
    if (attempt > retries || !isTransientStorageError(error)) throw error;
    const delayMs = 500 * (2 ** (attempt - 1));
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

async function main() {
  if (!fs.existsSync(DIAGRAMS_DIR)) {
    throw new Error(`Diagram directory is missing: ${path.relative(ROOT, DIAGRAMS_DIR)}`);
  }

  const { url, serviceRoleKey, bucket, prefix } = readConfig();
  const concurrency = Number(process.env.DIAGRAM_UPLOAD_CONCURRENCY || DEFAULT_CONCURRENCY);
  const retries = Number(process.env.DIAGRAM_UPLOAD_RETRIES || DEFAULT_RETRIES);
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  await ensureBucket(supabase.storage, bucket);

  const files = walkFiles(DIAGRAMS_DIR);
  let uploaded = 0;
  let bytesUploaded = 0;

  await runPool(files, concurrency, async (filePath, position, total) => {
    const relative = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const bucketPath = path.posix.join(prefix, path.relative(DIAGRAMS_DIR, filePath).replace(/\\/g, "/"));
    const body = fs.readFileSync(filePath);
    await uploadWithRetry(supabase.storage, bucket, bucketPath, body, {
      upsert: true,
      contentType: contentTypeFor(filePath),
      cacheControl: "31536000",
    }, retries).catch((error) => {
      throw new Error(`${relative}: ${error.message}`);
    });
    uploaded += 1;
    bytesUploaded += body.byteLength;
    if (uploaded === 1 || uploaded === total || uploaded % 200 === 0) {
      console.log(`uploaded ${uploaded}/${total} files`);
    }
  });

  const origin = `${url.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}`;
  console.log(JSON.stringify({
    bucket,
    prefix,
    filesUploaded: uploaded,
    bytesUploaded,
    diagramsOrigin: origin,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

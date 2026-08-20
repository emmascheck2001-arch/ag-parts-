import { execFileSync } from "node:child_process";
import fs from "node:fs";

function readEnv(filePath) {
  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    values[line.slice(0, index)] = line.slice(index + 1);
  }
  return values;
}

function runPsql(connectionString, sql) {
  return execFileSync("psql", [connectionString, "-P", "pager=off", "-F", "\t", "-Atqc", sql], {
    encoding: "utf8",
  }).trim();
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { response, json };
}

const browserEnv = readEnv(new URL("../../.env", import.meta.url));
const prodEnv = readEnv(new URL("../../.env.production.local", import.meta.url));
const prodDbUrl = prodEnv.EZPARTS_PRODUCTION_DATABASE_URL;
const supabaseUrl = browserEnv.VITE_SUPABASE_URL;
const anonKey = browserEnv.VITE_SUPABASE_ANON_KEY;

if (!prodDbUrl || !supabaseUrl || !anonKey) {
  console.error("Missing EZPARTS_PRODUCTION_DATABASE_URL, VITE_SUPABASE_URL, or VITE_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const rlsRows = runPsql(
  prodDbUrl,
  `
    select c.relname, c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in ('searches', 'ingestion_sources', 'fitment')
    order by c.relname;
  `,
).split("\n").filter(Boolean);

const rlsFailures = rlsRows.filter((row) => !row.endsWith("\tt"));
if (rlsFailures.length) {
  console.error(`RLS is not enabled on: ${rlsFailures.join(", ")}`);
  process.exit(1);
}

const publicPolicies = runPsql(
  prodDbUrl,
  `
    select tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('searches', 'ingestion_sources', 'fitment')
    order by tablename;
  `,
).split("\n").filter(Boolean);

if (publicPolicies.length) {
  console.error(`Public policies unexpectedly exist on locked-down tables: ${publicPolicies.join(", ")}`);
  process.exit(1);
}

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
};

const publicChecks = await Promise.all([
  "searches",
  "ingestion_sources",
  "fitment",
].map((table) => fetchJson(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, { headers })));

for (const [index, table] of ["searches", "ingestion_sources", "fitment"].entries()) {
  const { response, json } = publicChecks[index];
  if (!response.ok) {
    console.error(`${table} probe failed with HTTP ${response.status}`);
    process.exit(1);
  }
  if (!Array.isArray(json)) {
    console.error(`${table} probe returned a non-array payload`);
    process.exit(1);
  }
}

const catalogProbe = await fetchJson(`${supabaseUrl}/rest/v1/parts?select=id&limit=1`, {
  headers: {
    ...headers,
    "Accept-Profile": "catalog",
  },
});

if (catalogProbe.response.status !== 406 || catalogProbe.json?.code !== "PGRST106") {
  console.error("catalog schema appears to be exposed to anon REST access.");
  process.exit(1);
}

console.log("Supabase security checks passed.");

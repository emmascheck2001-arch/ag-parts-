import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const MACHINE_INDEX_PATH = path.join(ROOT, "public/catalog/verified-machine-index.json");
const SERIAL_INDEX_PATH = path.join(ROOT, "public/catalog/verified-serial-index.json");
const MACHINE_DIR = path.join(ROOT, "public/catalog/verified-machines");

function fail(message) {
  console.error(`verified-catalog check failed: ${message}`);
  process.exit(1);
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label} is missing at ${path.relative(ROOT, filePath)}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${label} could not be parsed: ${error.message}`);
  }
}

const machineIndex = readJson(MACHINE_INDEX_PATH, "verified machine index");
const serialIndex = readJson(SERIAL_INDEX_PATH, "verified serial index");

if (!Array.isArray(machineIndex.machines) || machineIndex.machines.length === 0) {
  fail("verified machine index has no machines");
}

if (!fs.existsSync(MACHINE_DIR) || !fs.statSync(MACHINE_DIR).isDirectory()) {
  fail(`verified machine directory is missing at ${path.relative(ROOT, MACHINE_DIR)}`);
}

const machineFiles = fs.readdirSync(MACHINE_DIR).filter((name) => name.endsWith(".json"));
if (machineFiles.length === 0) fail("verified machine directory has no machine catalogs");

const machineFileSet = new Set(machineFiles);
const missingMachineFiles = machineIndex.machines
  .map((machine) => `${machine.id}.json`)
  .filter((name) => !machineFileSet.has(name));
if (missingMachineFiles.length > 0) {
  fail(`verified machine catalogs are missing files for: ${missingMachineFiles.slice(0, 10).join(", ")}${missingMachineFiles.length > 10 ? " ..." : ""}`);
}

for (const fileName of machineFiles) {
  const raw = readJson(path.join(MACHINE_DIR, fileName), `verified machine catalog ${fileName}`);
  const requiredArrays = [
    "manufacturers",
    "machineTypes",
    "models",
    "modelVariants",
    "systems",
    "subsystems",
    "assemblies",
    "catalogSections",
    "parts",
    "partNumbers",
    "partNameAliases",
    "partOccurrences",
    "sourceLocations",
  ];
  const missing = requiredArrays.filter((field) => !Array.isArray(raw[field]));
  if (missing.length > 0) {
    fail(`${fileName} is missing required arrays: ${missing.join(", ")}`);
  }
}

if (!serialIndex || typeof serialIndex !== "object") {
  fail("verified serial index is not a JSON object");
}

console.log(`verified-catalog check passed: ${machineIndex.machines.length} machines, ${machineFiles.length} machine catalogs`);

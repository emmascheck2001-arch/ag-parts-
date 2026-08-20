import fs from "node:fs";
import path from "node:path";

function readLocalEnvValue(name) {
  for (const fileName of [".env.production.local", ".env.local", ".env"]) {
    const filePath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.startsWith(`${name}=`)) continue;
      return line.slice(name.length + 1).trim();
    }
  }
  return "";
}

const diagramsOrigin = String(process.env.VITE_DIAGRAMS_ORIGIN || readLocalEnvValue("VITE_DIAGRAMS_ORIGIN")).trim();
const targets = process.argv.slice(2);

if (!diagramsOrigin) {
  console.log("Skipping bundled-diagram pruning because VITE_DIAGRAMS_ORIGIN is not set.");
  process.exit(0);
}

if (targets.length === 0) {
  console.error("Usage: node scripts/catalog/prune_bundled_diagrams.mjs <build-dir> [more-build-dirs]");
  process.exit(1);
}

for (const target of targets) {
  const diagramsDir = path.resolve(target, "diagrams");
  if (!fs.existsSync(diagramsDir)) {
    console.log(`No bundled diagrams found in ${diagramsDir}`);
    continue;
  }
  fs.rmSync(diagramsDir, { recursive: true, force: true });
  console.log(`Removed bundled diagrams from ${diagramsDir}`);
}

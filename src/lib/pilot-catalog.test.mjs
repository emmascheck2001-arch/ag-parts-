import test from "node:test";
import assert from "node:assert/strict";

const modulePath = new URL("./pilot-catalog.js", import.meta.url).href;

async function importFreshPilotCatalog() {
  return import(`${modulePath}?t=${Date.now()}-${Math.random()}`);
}

function okJson(json) {
  return {
    ok: true,
    async json() {
      return json;
    },
  };
}

test("loadPilotMachineIndex clears a rejected cache entry and retries", async () => {
  const pilotCatalog = await importFreshPilotCatalog();
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    if (calls === 1) return { ok: false, status: 503 };
    return okJson({ machines: [{ id: "m-1", displayName: "Machine" }] });
  };

  await assert.rejects(() => pilotCatalog.loadPilotMachineIndex(), /503/);
  const value = await pilotCatalog.loadPilotMachineIndex();

  assert.equal(calls, 2);
  assert.equal(value.machines.length, 1);
});

test("loadPilotCatalog clears a rejected per-machine cache entry and retries", async () => {
  const pilotCatalog = await importFreshPilotCatalog();
  let calls = 0;
  const validCatalog = {
    manufacturers: [],
    machineTypes: [],
    modelVariants: [],
    systems: [],
    subsystems: [],
    assemblies: [],
    catalogSections: [],
    parts: [],
    partNumbers: [],
    sourceLocations: [],
    partNameAliases: [],
    partOccurrences: [],
    models: [],
    machineEntries: [],
  };
  global.fetch = async () => {
    calls += 1;
    if (calls === 1) return { ok: false, status: 504 };
    return okJson(validCatalog);
  };

  await assert.rejects(() => pilotCatalog.loadPilotCatalog("machine-1"), /504/);
  const value = await pilotCatalog.loadPilotCatalog("machine-1");

  assert.equal(calls, 2);
  assert.deepEqual(value.machines, []);
});

test("loadPilotSerialIndex clears a rejected cache entry and retries", async () => {
  const pilotCatalog = await importFreshPilotCatalog();
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    if (calls === 1) return { ok: false, status: 502 };
    return okJson({ rows: [{ id: "serial-1" }] });
  };

  await assert.rejects(() => pilotCatalog.loadPilotSerialIndex(), /502/);
  const value = await pilotCatalog.loadPilotSerialIndex();

  assert.equal(calls, 2);
  assert.deepEqual(value, { rows: [{ id: "serial-1" }] });
});

test("loadPilotCatalog names missing required arrays explicitly", async () => {
  const pilotCatalog = await importFreshPilotCatalog();
  global.fetch = async () => okJson({
    manufacturers: [],
    machineTypes: [],
    modelVariants: [],
    systems: [],
    subsystems: [],
    assemblies: [],
    catalogSections: [],
    parts: [],
    sourceLocations: [],
    partNameAliases: [],
    partOccurrences: [],
    models: [],
  });

  await assert.rejects(
    () => pilotCatalog.loadPilotCatalog("machine-2"),
    /partNumbers/,
  );
});

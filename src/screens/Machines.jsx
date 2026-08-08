import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { machinesWithParts } from "../lib/db";
import { loadPilotCatalog } from "../lib/pilot-catalog";

// Browse every machine in the fitment index (seed + ingested). This is the
// screen that makes ingested machines discoverable — the storefront's full
// machine list, searchable by make/model. Machines with nothing catalogued yet
// are hidden so the storefront never shows a dead-end "0 parts" page.
export function Machines({ onBack, onSelect }) {
  const [q, setQ] = useState("");
  const [pilotMachines, setPilotMachines] = useState([]);
  useEffect(() => {
    let live = true;
    loadPilotCatalog().then((catalog) => { if (live) setPilotMachines(catalog.machines); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const all = machinesWithParts();
  const query = q.trim().toLowerCase();
  const pilots = query
    ? pilotMachines.filter((machine) => `${machine.displayName} ${machine.manufacturer} ${machine.machineType}`.toLowerCase().includes(query))
    : pilotMachines;
  const machines = query
    ? all.filter((m) => m.nm.toLowerCase().includes(query) || (m.ty || "").toLowerCase().includes(query))
    : all;

  return (
    <div className="screen active">
      <TopBar title="All Machines" onBack={onBack} />
      <div className="scroll">
        <div className="home" style={{ paddingTop: 12 }}>
          <div className="searchbar">
            <input
              type="text"
              placeholder="Search make or model — e.g. 9620R, S780, sprayer"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="section-head">
            <h3>Verified pilot catalogs</h3>
          </div>

          <div className="pilot-machine-grid">
            {pilots.map((machine) => (
              <button key={machine.id} className="pilot-machine-card" onClick={() => onSelect("pilot-machine", machine.id)}>
                <span className="pilot-machine-check">✓ Source verified</span>
                <strong>{machine.displayName}</strong>
                <small>{machine.machineType}</small>
                <span>{machine.partCount.toLocaleString()} unique parts · {machine.assemblyCount} assemblies</span>
              </button>
            ))}
          </div>

          <div className="section-head pilot-legacy-head">
            <h3>Legacy browse index</h3>
            <span>{machines.length}</span>
          </div>

          <div className="recent-list">
            {machines.map((m) => {
              const count = m.count || 0;
              return (
                <button
                  key={m.nm}
                  className="recent-row"
                  onClick={() => onSelect("machines", m.nm)}
                  style={{ alignItems: "center", gap: 12 }}
                >
                  {m.img ? (
                    <img src={m.img} alt={m.nm} loading="lazy"
                      style={{ width: 52, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <span style={{ fontSize: 28, width: 52, textAlign: "center", flexShrink: 0 }}>{m.ic || "🚜"}</span>
                  )}
                  <span style={{ flex: 1, textAlign: "left" }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{m.nm}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--muted, #888)" }}>
                      {m.ty}{count ? ` · ${count} part${count === 1 ? "" : "s"}` : ""}
                    </span>
                  </span>
                  <span className="recent-chev">›</span>
                </button>
              );
            })}
            {machines.length === 0 && pilots.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--muted, #888)" }}>
                No machines match “{q}”.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

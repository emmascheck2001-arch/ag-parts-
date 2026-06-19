import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { getMachines, partsForMachine } from "../lib/catalog";

// Browse every machine in the fitment index (seed + ingested). This is the
// screen that makes ingested machines discoverable — the storefront's full
// machine list, searchable by make/model.
export function Machines({ onBack, onSelect }) {
  const [q, setQ] = useState("");
  const all = getMachines();
  const query = q.trim().toLowerCase();
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
            <h3>{machines.length} machine{machines.length === 1 ? "" : "s"}</h3>
          </div>

          <div className="recent-list">
            {machines.map((m) => {
              const count = partsForMachine(m.nm).length;
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
            {machines.length === 0 && (
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

import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { loadMachines, machinesWithParts, preloadLegacyMachineCounts } from "../lib/db";

// After a home search, ask which machine the part is for — so results are scoped
// to parts that actually FIT that machine (never the wrong part). "All machines"
// is offered as an escape for cross-reference / general lookups.
export function PickMachine({ query, onPick, onBack }) {
  const [q, setQ] = useState("");
  const [, setRefreshTick] = useState(0);
  useEffect(() => {
    let live = true;
    loadMachines({ includeCounts: false })
      .then(() => { if (live) setRefreshTick((tick) => tick + 1); })
      .catch(() => {});
    preloadLegacyMachineCounts()
      .then(() => { if (live) setRefreshTick((tick) => tick + 1); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  const all = machinesWithParts();
  const query2 = q.trim().toLowerCase();
  const machines = query2
    ? all.filter((m) => m.nm.toLowerCase().includes(query2) || (m.ty || "").toLowerCase().includes(query2))
    : all;

  return (
    <div className="screen active">
      <TopBar title={`Search "${query}"`} onBack={onBack} />
      <div className="scroll">
        <div className="home" style={{ paddingTop: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Which machine is this for?</h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.4 }}>
            Pick your machine and we'll show only “{query}” parts confirmed to fit it.
          </div>

          <div className="searchbar">
            <input type="text" placeholder="Filter machines — e.g. Hagie, Country Clipper" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="recent-list" style={{ marginTop: 10 }}>
            {machines.map((m) => (
              <button
                key={m.nm}
                className="recent-row"
                onClick={() => onPick(m.nm)}
                style={{ alignItems: "center", gap: 12 }}
              >
                {m.img
                  ? <img src={m.img} alt={m.nm} loading="lazy" style={{ width: 52, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  : <span style={{ fontSize: 26, width: 52, textAlign: "center", flexShrink: 0 }}>{m.ic || "🚜"}</span>}
                <span style={{ flex: 1, textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{m.nm}</span>
                  <span className="row-subtle">
                    {m.ty} · {m.count} part{m.count === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="recent-chev">›</span>
              </button>
            ))}
            {machines.length === 0 && (
              <div className="empty-note">No machines match “{q}”.</div>
            )}
          </div>

          <div style={{ marginTop: 14, textAlign: "center" }}>
            <button
              onClick={() => onPick(null)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Not sure yet? Search all machines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

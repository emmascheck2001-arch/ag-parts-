import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { getPartByNumber, machineNames as getMachineNames } from "../lib/db";
import { TIER, partTier } from "../lib/fit-confidence";
import { diagramsForPart } from "../lib/diagrams";

// Search-engine view of a part: what it is, which machines it fits, the diagram,
// and any cross-reference numbers. No sellers, no prices (no dealers yet).
export function PartDetails({ partNum, onBack, onMachineSelect }) {
  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    getPartByNumber(partNum).then((p) => { if (live) { setPart(p); setLoading(false); } });
    return () => { live = false; };
  }, [partNum]);

  if (loading || !part) {
    return (
      <div className="screen active">
        <TopBar title="Part Details" onBack={onBack} />
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          {loading ? "Loading…" : "Part not found"}
        </div>
      </div>
    );
  }

  const machineNames = getMachineNames();
  const fitment = part.fitment || [];
  const overall = TIER[partTier(fitment)];
  const diagrams = diagramsForPart(partNum, fitment.map((item) => item.machine)) || [];
  const fitDetail = (f) =>
    `${f.position || ""}${f.qty ? ` · Qty ${f.qty}` : ""}${f.years ? ` · ${f.years}` : ""}`;
  const sameDetail = fitment.length > 1 && fitment.every((f) => fitDetail(f) === fitDetail(fitment[0]));

  return (
    <div className="screen active">
      <TopBar title={part.name} onBack={onBack} right={part.ic} />

      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Part Info */}
          <div className="card" style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
              {part.ic} {part.name}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
              Part #: <strong>{partNum}</strong>
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
              Category: <strong>{part.cat}</strong>
            </div>
            <div style={{
              marginBottom: "8px", fontSize: "11.5px", fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "4px 9px", borderRadius: "999px",
              color: overall.color, background: overall.soft,
            }}>
              {overall.badge}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              <strong>Fits:</strong> {part.fits}
            </div>
          </div>

          {/* Used On — where this part fits */}
          {fitment.length > 0 && (
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                Used On {fitment.length} Machine{fitment.length > 1 ? "s" : ""}
              </h3>
              {sameDetail && (
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "10px", lineHeight: 1.4 }}>
                  {fitDetail(fitment[0])} — same on all
                </div>
              )}
              {fitment.map((f, i) => {
                const tappable = machineNames.has(f.machine);
                const t = TIER[f.tier || (f.verified ? "oem" : "review")];
                return (
                  <div
                    key={i}
                    onClick={tappable ? () => onMachineSelect(f.machine) : undefined}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px",
                      borderTop: i ? "1px solid var(--border)" : "none",
                      padding: sameDetail ? "8px 0" : "10px 0 8px",
                      cursor: tappable ? "pointer" : "default",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: tappable ? "var(--ag-green)" : "var(--text)" }}>
                        {f.machine}{tappable ? " ›" : ""}
                      </div>
                      {!sameDetail && (
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "3px" }}>
                          {fitDetail(f)}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: "9.5px", fontWeight: 700, whiteSpace: "nowrap", color: t.color }} title={t.badge}>
                      {t.row}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Parts diagram — the exploded assembly this part appears on */}
          {diagrams.map((diagram) => (
            <div className="card" style={{ marginBottom: "16px" }} key={`${diagram.slug}-${diagram.page}`}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Parts Diagram</h3>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", lineHeight: 1.4 }}>
                Find <strong>#{partNum}</strong> on manual page {diagram.page}
                {diagram.machine ? ` for ${diagram.machine}` : ""}. Tap the diagram for the full-size page.
              </div>
              <a href={diagram.img} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                <img src={diagram.img} alt={`${diagram.machine || "Machine"} parts diagram, manual page ${diagram.page}`} loading="lazy"
                  style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--border)", background: "#fff" }} />
              </a>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "7px" }}>
                Source: {diagram.title}
              </div>
            </div>
          ))}

          {/* Cross-references — equivalent part numbers */}
          {part.cross?.length > 0 && (
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                Cross-References ({part.cross.length})
              </h3>
              {part.cross.map((c) => (
                <div key={c.brand + c.pn} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{c.brand}</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{c.pn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

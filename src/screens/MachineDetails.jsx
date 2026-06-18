import { TopBar } from "../components/TopBar";
import { MACHINES, partsForMachine } from "../data/demo";
import { UIIcon } from "../components/icons";

const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

export function MachineDetails({ machine, onBack, onPartSelect }) {
  const machineData = MACHINES.find((m) => m.nm === machine);
  const manuals = machineData?.manuals || [];
  const parts = partsForMachine(machine);

  return (
    <div className="screen active">
      <TopBar title={machine} onBack={onBack} right={machineData?.ic} />

      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Manuals & Guides */}
          {manuals.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px", color: "var(--text-muted)" }}>
                Manuals & Guides
              </h3>
              {manuals.map((man) => (
                <a
                  key={man.title}
                  href={man.url}
                  target="_blank"
                  rel="noreferrer"
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                    textDecoration: "none",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: "var(--ag-green)", flexShrink: 0, lineHeight: 0 }}>
                    <UIIcon.doc width="22" height="22" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{man.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{man.type}</div>
                  </div>
                  <span style={{ color: "var(--text-muted)", flexShrink: 0, lineHeight: 0 }}>
                    <UIIcon.external width="16" height="16" />
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Every part that fits this machine (from fitment data) */}
          <h3 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px", color: "var(--text-muted)" }}>
            Parts For This Machine ({parts.length})
          </h3>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>
            Every part that fits {machine}, and where it goes.
          </div>

          {parts.length === 0 ? (
            <div className="card" style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
              No parts catalogued for this machine yet.
            </div>
          ) : (
            parts.map((p) => (
              <div
                key={p.pn}
                className="card"
                onClick={() => onPartSelect(p.pn)}
                style={{ cursor: "pointer", marginBottom: "10px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 600 }}>{p.ic} {p.name}</div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "3px" }}>
                      {p.position}{p.qty ? ` · Qty ${p.qty}` : ""}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Part #{p.pn} · {p.cat}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--price)" }}>from {money(p.from)}</div>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "6px",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: p.verified ? "var(--ag-green-soft)" : "rgba(245, 166, 35, 0.15)",
                        color: p.verified ? "var(--ag-green)" : "var(--star)",
                      }}
                    >
                      {p.verified ? "✓ VERIFIED" : "⚠ UNVERIFIED"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

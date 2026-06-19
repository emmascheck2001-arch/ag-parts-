import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { resolveExactParts, hasSerialBreaks } from "../data/demo";
import { partsForMachine, getMachines } from "../lib/catalog";
import { UIIcon } from "../components/icons";

const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

export function MachineDetails({ machine, onBack, onPartSelect }) {
  const machineData = getMachines().find((m) => m.nm === machine);
  const manuals = machineData?.manuals || [];
  const parts = partsForMachine(machine);

  const [serial, setSerial] = useState("");
  const [result, setResult] = useState(null);
  const runSerial = () => setResult(resolveExactParts(machine, serial));

  return (
    <div className="screen active">
      <TopBar title={machine} onBack={onBack} right={machineData?.ic} />

      <div className="scroll">
        {/* Machine photo */}
        {machineData?.img && (
          <img
            src={machineData.img}
            alt={machine}
            style={{ width: "100%", height: "170px", objectFit: "cover", display: "block" }}
          />
        )}

        <div style={{ padding: "16px" }}>
          {/* Year / Make / Model */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>Machine Details</h3>
            {[
              ["Make", machineData?.make],
              ["Model", machineData?.model],
              ["Year", machineData?.year],
              ["Type", machineData?.ty],
              ["Engine", machineData?.hp],
            ]
              .filter(([, v]) => v)
              .map(([label, value], i, arr) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    padding: "7px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
          </div>

          {/* Exact part by serial number — "never the wrong part" */}
          {hasSerialBreaks(machine) && (
            <div className="card" style={{ marginBottom: "20px", borderColor: "var(--ag-green)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
                Find Your Exact Part by Serial
              </h3>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "10px" }}>
                Some parts change at a serial break — same model, different correct part. Enter your
                serial / PIN and we'll give you the exact one, so you never order the wrong part.
              </div>
              <input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSerial()}
                placeholder="Serial / PIN (e.g. 1RW8320R___111200)"
                style={{
                  width: "100%", padding: "10px", borderRadius: "6px",
                  border: "1px solid var(--border)", background: "var(--surface)",
                  color: "var(--text)", fontSize: "13px", marginBottom: "8px",
                }}
              />
              <button className="btn-primary" onClick={runSerial} style={{ width: "100%", padding: "12px" }}>
                Find exact parts
              </button>

              {result?.error && (
                <div style={{ color: "var(--danger)", fontSize: "12px", marginTop: "10px" }}>{result.error}</div>
              )}

              {result?.parts && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
                    Matched to production #{result.seq}
                  </div>
                  {result.parts.map((p) => (
                    <button
                      key={p.role}
                      onClick={() => onPartSelect(p.pn)}
                      style={{
                        width: "100%", textAlign: "left", display: "block",
                        background: "var(--ag-green-soft)", border: "1px solid var(--ag-green)",
                        borderRadius: "10px", padding: "12px", marginBottom: "8px", cursor: "pointer", color: "var(--text)",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "var(--ag-green)", fontWeight: 700 }}>
                        ✅ Correct {p.role}
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>{p.pn}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {p.name} · {p.range} · tap for suppliers ›
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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

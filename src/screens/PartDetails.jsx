import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { SupplierCard } from "../components/SupplierCard";
import { FitGuarantee } from "../components/FitGuarantee";
import { SUPPLIERS_MAP, calculateDistance, USER_LOCATION } from "../data/demo";
import { getParts, getMachines, serviceKit } from "../lib/catalog";
import { rankSuppliers, lowestTotal, supplierDistance } from "../lib/ranking";
import { TIER, partTier } from "../lib/fit-confidence";
import { diagramForPart } from "../lib/diagrams";

export function PartDetails({ partNum, onBack, onBuy, onViewMap, onMachineSelect }) {
  const part = getParts()[partNum];
  const machineNames = new Set(getMachines().map((m) => m.nm));
  const [added, setAdded] = useState({}); // pn -> true, for cross-sell "Added ✓" state

  if (!part) {
    return (
      <div className="screen active">
        <TopBar title="Part Details" onBack={onBack} />
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          Part not found
        </div>
      </div>
    );
  }

  const sorted = rankSuppliers(part.suppliers);
  const lowest = lowestTotal(part.suppliers);

  // "Used On" detail (position · qty · years). When it's identical across every
  // machine, show it once instead of repeating it on all 8 rows.
  const fitment = part.fitment || [];
  const overall = TIER[partTier(fitment)];
  const diagram = diagramForPart(partNum);
  const fitDetail = (f) =>
    `${f.position || ""}${f.qty ? ` · Qty ${f.qty}` : ""}${f.years ? ` · ${f.years}` : ""}`;
  const sameDetail = fitment.length > 1 && fitment.every((f) => fitDetail(f) === fitDetail(fitment[0]));

  const handleBuyClick = (pn, supplier, total) => {
    onBuy({ pn, supplier, total, partName: part.name });
  };

  // "In stock near you today" — the harvest-clock hero. Closest in-stock dealer
  // within driving range that can hand it over today (real distance from the
  // device's location). Only surfaces when there genuinely is one.
  const NEARBY_MILES = 75;
  const nearbyPickup = sorted
    .map((s) => ({ ...s, distance: s.distance ?? supplierDistance(s) }))
    .filter((s) => (s.stock || 0) > 0 && s.distance != null && s.distance <= NEARBY_MILES)
    .sort((a, b) => a.distance - b.distance)[0] || null;

  // "While you're at it" — other routine parts that fit the same machine, so a
  // farmer doing one job grabs the rest of the service in the same order (AOV).
  const relMachine = (fitment.find((f) => machineNames.has(f.machine)) || {}).machine;
  const related = (relMachine ? serviceKit(relMachine) : [])
    .filter((p) => p.pn !== partNum && p.bestSupplier)
    .slice(0, 4);
  const addRelated = (p) => {
    // Add from the SAME dealer as the part being viewed when possible, so the
    // one-order-one-dealer cart doesn't silently drop the cross-sell add.
    const sameDealer = (p.suppliers || []).find((s) => s.s === sorted[0]?.s);
    const sup = sameDealer || p.bestSupplier;
    onBuy({ pn: p.pn, supplier: sup, total: (sup.price || 0) + (sup.ship || 0), partName: p.name, silent: true });
    setAdded((a) => ({ ...a, [p.pn]: true }));
  };

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
              {" "}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(partNum + " " + (part.brand ? part.brand + " " : "") + part.name + " part")}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--ag-green)", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
              >
                🔎 find #{partNum} online ›
              </a>
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

          {/* In stock near you today — the harvest-clock hero */}
          {nearbyPickup && (
            <div
              className="card"
              onClick={onViewMap}
              style={{ marginBottom: "16px", borderColor: "var(--ag-green)", background: "var(--ag-green-soft)", cursor: onViewMap ? "pointer" : "default" }}
            >
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ag-green)" }}>
                🏁 In stock near you — pick up today
              </div>
              <div style={{ fontSize: "12px", color: "var(--text)", marginTop: "6px", lineHeight: 1.45 }}>
                <strong>{nearbyPickup.s}</strong> has it in stock, {nearbyPickup.distance} mi away.
                Skip shipping — grab it and get back to the field.
              </div>
            </div>
          )}

          {/* Fit guarantee — only where it's OEM-verified (our moat) */}
          <FitGuarantee ok={overall.ok} />

          {/* Used On — where this part fits */}
          {fitment.length > 0 && (
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                Used On {fitment.length} Machine{fitment.length > 1 ? "s" : ""}
              </h3>

              {/* When every machine shares the same fitment detail, show it once. */}
              {sameDetail && (
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "10px", lineHeight: 1.4 }}>
                  {fitDetail(fitment[0])} — same on all
                </div>
              )}

              {fitment.map((f, i) => {
                const tappable = machineNames.has(f.machine);
                return (
                  <div
                    key={i}
                    onClick={tappable ? () => onMachineSelect(f.machine) : undefined}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      borderTop: i ? "1px solid var(--border)" : "none",
                      padding: sameDetail ? "8px 0" : "10px 0 8px",
                      cursor: tappable ? "pointer" : "default",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: tappable ? "var(--ag-green)" : "var(--text)" }}>
                        {f.machine}{tappable ? " ›" : ""}
                      </div>
                      {/* Per-row detail only when it differs between machines */}
                      {!sameDetail && (
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "3px" }}>
                          {fitDetail(f)}
                        </div>
                      )}
                    </div>
                    {(() => {
                      const t = TIER[f.tier || (f.verified ? "oem" : "review")];
                      return (
                        <span
                          style={{ fontSize: "9.5px", fontWeight: 700, whiteSpace: "nowrap", color: t.color }}
                          title={t.badge}
                        >
                          {t.row}
                        </span>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}

          {/* Parts diagram — the exploded assembly this part appears on */}
          {diagram && (
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Parts Diagram</h3>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", lineHeight: 1.4 }}>
                Find <strong>#{partNum}</strong> on this assembly — from the {diagram.title} (p.{diagram.page}).
              </div>
              <a href={diagram.img} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                <img
                  src={diagram.img}
                  alt={`Parts diagram p.${diagram.page}`}
                  loading="lazy"
                  style={{ width: "100%", borderRadius: "8px", border: "1px solid var(--border)", background: "#fff" }}
                />
              </a>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "6px" }}>
                Tap to open full size · part numbers are called out on the diagram.
              </div>
            </div>
          )}

          {/* Best match summary */}
          <div className="card" style={{ marginBottom: "16px", background: "rgba(36, 179, 63, 0.08)", borderColor: "var(--ag-green)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
              BEST MATCH · {sorted[0].s}
            </div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--price)" }}>
              ${(sorted[0].price + sorted[0].ship).toFixed(2)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              Incl. ${sorted[0].ship.toFixed(2)} shipping · ships in {sorted[0].days} day{sorted[0].days > 1 ? "s" : ""}
              {sorted[0].distance != null ? ` · ${sorted[0].distance} mi away` : ""}
            </div>
            {lowest < sorted[0].price + sorted[0].ship && (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Lowest available: ${lowest.toFixed(2)}
              </div>
            )}
          </div>

          {/* Available from Suppliers */}
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "var(--text-muted)" }}>
              Available from {sorted.length} Supplier{sorted.length > 1 ? "s" : ""}
            </h3>
            {onViewMap && (
              <button
                onClick={onViewMap}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "transparent",
                  border: "1px solid var(--ag-green)",
                  color: "var(--ag-green)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                📍 View Suppliers Near Me
              </button>
            )}
            {sorted.map((supplier, i) => {
              const distance = SUPPLIERS_MAP[supplier.s]
                ? calculateDistance(USER_LOCATION.lat, USER_LOCATION.lng, SUPPLIERS_MAP[supplier.s].lat, SUPPLIERS_MAP[supplier.s].lng)
                : null;
              return (
                <SupplierCard
                  key={i}
                  supplier={supplier}
                  partNum={partNum}
                  best={i === 0}
                  onBuy={handleBuyClick}
                  distance={distance}
                />
              );
            })}
          </div>

          {/* While you're at it — other service parts for the same machine */}
          {related.length > 0 && (
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                While you're at it
              </h3>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px", lineHeight: 1.4 }}>
                Other routine parts that fit your {relMachine} — add them to this order and do the whole service at once.
              </div>
              {related.map((p) => (
                <div key={p.pn} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "8px 0", borderTop: "1px solid var(--border)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {p.pn}{p.from != null ? ` · from $${Number(p.from).toFixed(2)}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => addRelated(p)}
                    disabled={added[p.pn]}
                    style={{
                      flexShrink: 0, fontSize: "12px", fontWeight: 700, padding: "7px 12px", borderRadius: "8px", cursor: added[p.pn] ? "default" : "pointer",
                      border: "1px solid var(--ag-green)",
                      background: added[p.pn] ? "var(--ag-green-soft)" : "transparent",
                      color: "var(--ag-green)",
                    }}
                  >
                    {added[p.pn] ? "✓ Added" : "+ Add"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Cross-references — equivalent aftermarket part numbers */}
          {part.cross?.length > 0 && (
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                Cross-References ({part.cross.length})
              </h3>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
                Equivalent aftermarket part numbers for #{partNum} — give any of these to a supplier.
              </div>
              {part.cross.map((c) => (
                <div
                  key={c.brand + c.pn}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "8px 0",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{c.brand}</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{c.pn}</span>
                </div>
              ))}
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.4 }}>
                Cross-references are for guidance — confirm specs/dimensions for your application.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

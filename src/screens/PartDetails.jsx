import { TopBar } from "../components/TopBar";
import { SupplierCard } from "../components/SupplierCard";
import { VerifiedFit } from "../components/Badge";
import { PARTS, MACHINES, SUPPLIERS_MAP, calculateDistance, USER_LOCATION } from "../data/demo";
import { rankSuppliers, lowestTotal } from "../lib/ranking";

const MACHINE_NAMES = new Set(MACHINES.map((m) => m.nm));

export function PartDetails({ partNum, onBack, onBuy, onViewMap, onMachineSelect }) {
  const part = PARTS[partNum];

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

  const handleBuyClick = (pn, supplier, total) => {
    onBuy({ pn, supplier, total, partName: part.name });
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
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
              Category: <strong>{part.cat}</strong>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <VerifiedFit />
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              <strong>Fits:</strong> {part.fits}
            </div>
          </div>

          {/* Used On — where this part fits, and how */}
          {part.fitment?.length > 0 && (
            <div className="card" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                Used On {part.fitment.length} Machine{part.fitment.length > 1 ? "s" : ""}
              </h3>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                Every machine that uses part #{partNum}, and how it's fitted.
              </div>
              {part.fitment.map((f, i) => {
                const tappable = MACHINE_NAMES.has(f.machine);
                return (
                <div
                  key={i}
                  onClick={tappable ? () => onMachineSelect(f.machine) : undefined}
                  style={{ borderTop: i ? "1px solid var(--border)" : "none", padding: "10px 0 8px", cursor: tappable ? "pointer" : "default" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: tappable ? "var(--ag-green)" : "var(--text)" }}>
                      {f.machine}{tappable ? " ›" : ""}
                    </div>
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        background: f.verified ? "var(--ag-green-soft)" : "rgba(245, 166, 35, 0.15)",
                        color: f.verified ? "var(--ag-green)" : "var(--star)",
                      }}
                    >
                      {f.verified ? "✓ VERIFIED" : "⚠ UNVERIFIED"}
                    </span>
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "3px" }}>
                    {f.position}
                    {f.qty ? ` · Qty ${f.qty}` : ""}
                    {f.years ? ` · ${f.years}` : ""}
                  </div>
                </div>
                );
              })}
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

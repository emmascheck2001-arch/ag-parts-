import { TIER } from "../lib/fit-confidence";
import { CatIcon } from "./icons";

const money = (n) => (n == null ? "—" : "$" + (Number.isInteger(n) ? n : n.toFixed(2)));

// Rich part card used on the machine parts pages. Every field the spec calls
// for: name, part #, OEM #, the machine it's confirmed to fit, picture/icon,
// price, supplier, stock, shipping, and an Order button — plus a fitment
// confidence badge so the buyer sees how the fit is known before purchase.
export function PartCard({ part, machineName, onSelect, onOrder }) {
  const sup = part.bestSupplier;
  const tier = TIER[part.fit?.tier || (part.fit?.verified ? "oem" : "review")];
  const Ic = CatIcon[part.cat] || CatIcon.Other;

  const order = (e) => {
    e.stopPropagation();
    if (!sup) return;
    onOrder?.({ pn: part.pn, supplier: sup, total: (sup.price || 0) + (sup.ship || 0), partName: part.name });
  };

  return (
    <div className="card" onClick={() => onSelect?.(part.pn)} style={{ cursor: "pointer", marginBottom: "10px", padding: "12px" }}>
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Picture / category-icon placeholder */}
        <div style={{
          width: 60, height: 60, flexShrink: 0, borderRadius: 10, overflow: "hidden",
          background: "var(--surface)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {part.image
            ? <img src={part.image} alt={part.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Ic width="28" height="28" style={{ color: "var(--ag-green)" }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>{part.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 3, fontFamily: "monospace" }}>
            #{part.pn}{part.oemNumber ? ` · OEM ${part.oemNumber}` : ""}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color: tier.color, background: tier.soft }}>
              {tier.ok ? "✓ Fits this machine" : tier.row}
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color: "var(--text-muted)", background: "var(--surface)" }}>
              {part.isOem ? "OEM" : "Aftermarket"}
            </span>
            {(part.cross || []).length > 0 && (
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color: "var(--ag-green)", background: "var(--ag-green-soft)" }}>
                {part.cross.length} aftermkt alt
              </span>
            )}
            {part.hasRealDealer && (
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color: "var(--ag-green)", background: "var(--ag-green-soft)" }}>
                Dealer stock
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--price)" }}>{money(part.from)}</div>
          {sup && (
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, maxWidth: 96 }}>
              {sup.s}
            </div>
          )}
        </div>
      </div>

      {/* Stock + shipping + order */}
      {sup && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 8 }}>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
            <span style={{ color: (sup.stock || 0) > 0 ? "var(--ag-green)" : "var(--danger)", fontWeight: 700 }}>
              {(sup.stock || 0) > 0 ? `In stock (${sup.stock})` : "Backorder"}
            </span>
            {" · "}{sup.ship ? `+${money(sup.ship)} ship` : "free ship"} · {sup.days || 2}d
          </div>
          <button onClick={order} className="btn-primary" style={{ padding: "7px 14px", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            Order
          </button>
        </div>
      )}
    </div>
  );
}

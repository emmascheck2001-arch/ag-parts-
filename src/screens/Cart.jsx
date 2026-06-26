import { TopBar } from "../components/TopBar";
import { money } from "../lib/marketplace";

const qtyBtn = {
  width: "26px", height: "26px", borderRadius: "6px",
  border: "1px solid var(--border)", background: "var(--surface)",
  color: "var(--text)", fontSize: "16px", lineHeight: 1, cursor: "pointer",
};

// Reviewable cart: change quantities, remove lines, see the running total, then
// continue to checkout. One order = one dealer, so everything here is sold by
// the same dealer (enforced when items are added).
export function Cart({ cart = [], onQty, onCheckout, onBack, onContinue }) {
  const dealerName = cart[0]?.supplier?.s || "Dealer";
  const subtotal = cart.reduce((s, it) => s + (it.supplier?.price ?? 0) * (it.qty || 1), 0);
  const count = cart.reduce((s, it) => s + (it.qty || 1), 0);

  if (!cart.length) {
    return (
      <div className="screen active">
        <TopBar title="Cart" onBack={onBack} />
        <div className="scroll">
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>🛒</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Your cart is empty</div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>Find a part and it'll show up here.</div>
            <button className="btn-primary" onClick={onContinue} style={{ marginTop: "20px", padding: "12px 20px" }}>
              Find parts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen active">
      <TopBar title={`Cart (${count})`} onBack={onBack} />
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Sold by */}
          <div className="card" style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sold by</div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>{dealerName}</div>
            </div>
            {cart[0]?.supplier?.rating && (
              <div style={{ fontSize: "12px", color: "var(--star)" }}>★ {cart[0].supplier.rating}</div>
            )}
          </div>

          {/* Line items */}
          {cart.map((item, i) => {
            const qty = item.qty || 1;
            const price = item.supplier?.price ?? 0;
            return (
              <div key={i} className="card" style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.partName || "Part"}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {item.pn} · {money(price)} each
                      {item.supplier?.cond && item.supplier.cond !== "New" ? ` · ${item.supplier.cond}` : ""}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{money(price * qty)}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <button onClick={() => onQty(i, qty - 1)} aria-label="Decrease quantity" style={qtyBtn}>−</button>
                    <span style={{ minWidth: "18px", textAlign: "center", fontWeight: 600 }}>{qty}</span>
                    <button onClick={() => onQty(i, qty + 1)} aria-label="Increase quantity" style={qtyBtn}>+</button>
                  </span>
                  <button onClick={() => onQty(i, 0)} style={{ background: "none", border: "none", color: "var(--danger)", fontSize: "12px", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          {/* Subtotal */}
          <div className="card" style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
            <span>Subtotal ({count} item{count === 1 ? "" : "s"})</span>
            <span style={{ color: "var(--price)", fontSize: "16px" }}>{money(subtotal)}</span>
          </div>
          <div style={{ fontSize: "10.5px", color: "var(--text-muted)", margin: "6px 2px 0", lineHeight: 1.4 }}>
            Shipping and pickup options are chosen at checkout.
          </div>

          <button className="btn-primary" onClick={onCheckout} style={{ width: "100%", padding: "14px", marginTop: "14px" }}>
            Continue to checkout · {money(subtotal)}
          </button>
          <button onClick={onContinue} style={{ width: "100%", padding: "11px", marginTop: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "12.5px", cursor: "pointer" }}>
            Keep shopping
          </button>
        </div>
      </div>
    </div>
  );
}

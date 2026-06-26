import { TopBar } from "../components/TopBar";

const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

export function OrderTracking({ orders, onBack, onReorder }) {
  return (
    <div className="screen active">
      <TopBar title="Order Tracking" onBack={onBack} />
      
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📦</div>
              <div>No orders yet</div>
            </div>
          ) : (
            orders.map((order, i) => (
              <div key={i} className="card" style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "13px" }}>
                      Order {order.orderId}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                      {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--price)" }}>
                      {money(order.total)}
                    </div>
                    {/* Honest status: a fresh order is placed/awaiting the dealer —
                        not "paid" or "in transit" unless that's actually true. */}
                    <div style={{ fontSize: "11px", color: "var(--ag-green)", marginTop: "4px" }}>
                      {order.fulfillment === "pickup"
                        ? "Order placed · dealer to confirm pickup"
                        : "Order placed · dealer to confirm"}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {order.paid ? "Paid" : "Payment on dealer confirmation"}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                  {(() => {
                    const n = order.cart.reduce((s, it) => s + (it.qty || 1), 0);
                    return `${n} part${n > 1 ? "s" : ""}`;
                  })()}
                  {order.dealer ? ` · ${order.dealer}` : ""}
                  {order.fulfillment === "pickup" && order.pickupLocation ? ` · Pickup: ${order.pickupLocation}` : ""}
                </div>
                {onReorder && order.cart?.length > 0 && (
                  <button
                    onClick={() => onReorder(order)}
                    style={{
                      marginTop: "10px", width: "100%", padding: "9px", borderRadius: "8px", cursor: "pointer",
                      border: "1px solid var(--ag-green)", background: "transparent",
                      color: "var(--ag-green)", fontSize: "12px", fontWeight: 700,
                    }}
                  >
                    🔁 Reorder these parts
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

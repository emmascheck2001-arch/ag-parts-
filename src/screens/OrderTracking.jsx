import { TopBar } from "../components/TopBar";

const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

export function OrderTracking({ orders, onBack }) {
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
                    <div style={{ fontSize: "11px", color: "var(--ag-green)", marginTop: "4px" }}>
                      ✓ In Transit
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                  {order.cart.length} part{order.cart.length > 1 ? "s" : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

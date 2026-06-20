import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { money } from "../lib/marketplace";
import { fetchDealerOrders } from "../lib/orders";

// Normalize a DB order row into the dashboard shape.
function fromDb(o) {
  const items = Array.isArray(o.items) ? o.items : [];
  return {
    orderId: o.order_ref || ("ORD-" + o.id),
    partName: items[0]?.partName || items[0]?.name || "Part",
    fulfillment: o.fulfillment || "ship",
    total: Number(o.total) || 0,
    platformFee: Number(o.platform_fee) || 0,
    dealerPayout: Number(o.dealer_payout) || Number(o.total) || 0,
    customer: o.buyer_email || "Customer",
    status: o.status === "paid" ? "new" : (o.status || "new"),
  };
}

// A couple of seeded orders so the dashboard demonstrates the experience even
// before any live orders exist this session.
const SEED = [
  { orderId: "ORD-10231", partName: "Hydraulic Pump", fulfillment: "ship", total: 414, platformFee: 31.12, dealerPayout: 382.88, customer: "J. Miller", status: "new" },
  { orderId: "ORD-10228", partName: "Air Filter", fulfillment: "pickup", total: 45.75, platformFee: 3.66, dealerPayout: 42.09, customer: "S. Boe", status: "ready" },
];

// Normalize a live session order into the dashboard shape.
function fromOrder(o) {
  return {
    orderId: o.orderId,
    partName: o.cart?.[0]?.partName || "Part",
    fulfillment: o.fulfillment || "ship",
    total: o.total ?? 0,
    platformFee: o.platformFee ?? 0,
    dealerPayout: o.dealerPayout ?? o.total ?? 0,
    customer: o.email || "Customer",
    status: "new",
  };
}

const FLOW = {
  ship: ["new", "shipped", "delivered"],
  pickup: ["new", "ready", "picked_up"],
};
const LABEL = { new: "New", shipped: "Shipped", ready: "Ready for pickup", delivered: "Delivered", picked_up: "Picked up" };
const ACTION = { new: { ship: "Mark shipped", pickup: "Mark ready" }, shipped: { ship: "Mark delivered" }, ready: { pickup: "Mark picked up" } };

export function DealerDashboard({ orders = [], onBack }) {
  const initial = [...orders.map(fromOrder), ...SEED];
  const [rows, setRows] = useState(initial);

  // Pull real persisted orders from the DB (survives refresh; cross-session).
  useEffect(() => {
    let live = true;
    fetchDealerOrders().then((dbOrders) => {
      if (!live || !dbOrders.length) return;
      const seen = new Set();
      const merged = [];
      for (const r of [...dbOrders.map(fromDb), ...orders.map(fromOrder), ...SEED]) {
        if (seen.has(r.orderId)) continue;
        seen.add(r.orderId); merged.push(r);
      }
      setRows(merged);
    });
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (orderId) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.orderId !== orderId) return r;
        const flow = FLOW[r.fulfillment] || FLOW.ship;
        const i = flow.indexOf(r.status);
        return i >= 0 && i < flow.length - 1 ? { ...r, status: flow[i + 1] } : r;
      })
    );
  };

  const gross = rows.reduce((s, r) => s + r.total, 0);
  const fees = rows.reduce((s, r) => s + r.platformFee, 0);
  const net = rows.reduce((s, r) => s + r.dealerPayout, 0);

  const isDone = (r) => {
    const flow = FLOW[r.fulfillment] || FLOW.ship;
    return r.status === flow[flow.length - 1];
  };

  const stat = (label, value, color) => (
    <div className="card" style={{ flex: 1, margin: 0, padding: "12px" }}>
      <div style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px", color: color || "var(--text)" }}>{value}</div>
    </div>
  );

  return (
    <div className="screen active">
      <TopBar title="Dealer Dashboard" onBack={onBack} />
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Summary */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {stat("Orders", rows.length)}
            {stat("Your payout", money(net), "var(--ag-green)")}
            {stat("EzParts fee", money(fees), "var(--text-muted)")}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>
            Gross sales {money(gross)} · payouts go to your bank automatically, minus the EzParts fee.
          </div>

          {/* Orders */}
          <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>Incoming orders</h3>
          {rows.map((r) => {
            const action = ACTION[r.status]?.[r.fulfillment];
            const done = isDone(r);
            return (
              <div key={r.orderId} className="card" style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{r.partName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {r.orderId} · {r.customer} · {r.fulfillment === "pickup" ? "Pickup" : "Ship"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ag-green)" }}>{money(r.dealerPayout)}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>after {money(r.platformFee)} fee</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", marginTop: "10px", paddingTop: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: done ? "var(--text-muted)" : "var(--ag-green)" }}>
                    {done ? "✓ " : ""}{LABEL[r.status]}
                  </span>
                  {action && (
                    <button
                      onClick={() => advance(r.orderId)}
                      style={{ background: "var(--ag-green)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                    >
                      {action}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { SUPPLIERS_MAP, calculateDistance, USER_LOCATION } from "../data/demo";
import { orderMath, money } from "../lib/marketplace";

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "8px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: "12px",
};

export function Checkout({ cart, onBack, onConfirm }) {
  const [fulfillment, setFulfillment] = useState("ship"); // 'ship' | 'pickup'
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // The order is sold by the dealer the farmer chose. (One dealer per order.)
  const dealer = cart[0]?.supplier || null;
  const dealerName = dealer?.s || "Dealer";
  const loc = SUPPLIERS_MAP[dealerName];
  const distance = loc
    ? calculateDistance(USER_LOCATION.lat, USER_LOCATION.lng, loc.lat, loc.lng)
    : null;

  const partSubtotal = cart.reduce((sum, item) => sum + (item.supplier?.price ?? 0), 0);
  const shipCost = dealer?.ship ?? 0;
  const shipDays = dealer?.days ?? 2;
  const m = orderMath({ partSubtotal, shipping: shipCost, fulfillment });

  const needsAddress = fulfillment === "ship";
  const ready = email && phone && (!needsAddress || address) && cart.length > 0;

  const handleCheckout = () => {
    if (!ready) return;
    onConfirm({
      orderId: "ORD-" + Date.now(),
      fulfillment,
      dealer: dealerName,
      pickupLocation: fulfillment === "pickup" ? loc?.address : null,
      email,
      phone,
      address: needsAddress ? address : null,
      cart,
      subtotal: m.subtotal,
      shipping: m.shipping,
      total: m.customerTotal,
      platformFee: m.platformFee,
      dealerPayout: m.dealerPayout,
    });
  };

  const optionCard = (id, title, sub, right) => {
    const selected = fulfillment === id;
    return (
      <button
        onClick={() => setFulfillment(id)}
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: selected ? "var(--ag-green-soft)" : "var(--surface)",
          border: "1px solid " + (selected ? "var(--ag-green)" : "var(--border)"),
          borderRadius: "10px",
          padding: "12px",
          marginBottom: "8px",
          cursor: "pointer",
          color: "var(--text)",
        }}
      >
        <span
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            border: "2px solid " + (selected ? "var(--ag-green)" : "var(--text-muted)"),
            background: selected ? "var(--ag-green)" : "transparent",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{sub}</div>
        </div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ag-green)" }}>{right}</div>
      </button>
    );
  };

  return (
    <div className="screen active">
      <TopBar title="Checkout" onBack={onBack} />

      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Sold by */}
          <div className="card" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sold by</div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>{dealerName}</div>
            </div>
            {dealer?.rating && (
              <div style={{ fontSize: "12px", color: "var(--star)" }}>★ {dealer.rating}</div>
            )}
          </div>

          {/* Fulfillment choice */}
          <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>How do you want it?</h3>
          {optionCard(
            "ship",
            "Ship to my farm",
            `Arrives in ~${shipDays} day${shipDays === 1 ? "" : "s"}`,
            money(shipCost)
          )}
          {optionCard(
            "pickup",
            `Pick up at ${dealerName}`,
            loc ? `${loc.address}${distance != null ? ` · ${distance} mi` : ""}` : "Ready today",
            "FREE"
          )}

          {/* Order summary */}
          <div className="card" style={{ margin: "16px 0" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Order Summary</h3>
            {cart.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                <span>{item.partName || "Part"} ×1</span>
                <span style={{ fontWeight: 600 }}>{money(item.supplier?.price ?? 0)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              <span>{fulfillment === "pickup" ? "Pickup" : "Shipping"}</span>
              <span>{fulfillment === "pickup" ? "FREE" : money(m.shipping)}</span>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "12px", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: "var(--price)", fontSize: "16px" }}>{money(m.customerTotal)}</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.4 }}>
              You pay {dealerName} directly. PartFinder’s fee comes from the dealer — never added to your price.
            </div>
          </div>

          {/* Contact / address */}
          <div className="card" style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>
              {needsAddress ? "Contact & Shipping Address" : "Contact Info"}
            </h3>
            <input style={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={input} type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {needsAddress && (
              <input style={{ ...input, marginBottom: 0 }} type="text" placeholder="Shipping address" value={address} onChange={(e) => setAddress(e.target.value)} />
            )}
            {!needsAddress && loc && (
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Pick up at <strong style={{ color: "var(--text)" }}>{dealerName}</strong><br />
                {loc.address}{loc.hours ? ` · ${loc.hours}` : ""}
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={handleCheckout}
            disabled={!ready}
            style={{ width: "100%", padding: "14px", opacity: ready ? 1 : 0.5 }}
          >
            {fulfillment === "pickup" ? "Reserve for Pickup" : "Place Order"} · {money(m.customerTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}

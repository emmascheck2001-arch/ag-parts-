import { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { TopBar } from "../components/TopBar";
import { PaymentForm } from "../components/PaymentForm";
import { SUPPLIERS_MAP, calculateDistance, USER_LOCATION } from "../data/demo";
import { orderMath, money } from "../lib/marketplace";
import { STRIPE_ENABLED, stripePromise, createPaymentIntent, getDealerAccount } from "../lib/stripe";

const stripeAppearance = {
  theme: "night",
  variables: { colorPrimary: "#24b33f", colorBackground: "#172021" },
};

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

const qtyBtn = {
  width: "24px",
  height: "24px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  fontSize: "15px",
  lineHeight: 1,
  cursor: "pointer",
};

export function Checkout({ cart, onBack, onConfirm, onQty }) {
  const [fulfillment, setFulfillment] = useState("ship"); // 'ship' | 'pickup'
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [clientSecret, setClientSecret] = useState(null); // set → show card form
  const [pendingOrder, setPendingOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  // The order is sold by the dealer the farmer chose. (One dealer per order.)
  const dealer = cart[0]?.supplier || null;
  const dealerName = dealer?.s || "Dealer";
  const loc = SUPPLIERS_MAP[dealerName];
  const distance = loc
    ? calculateDistance(USER_LOCATION.lat, USER_LOCATION.lng, loc.lat, loc.lng)
    : null;

  const partSubtotal = cart.reduce((sum, item) => sum + (item.supplier?.price ?? 0) * (item.qty || 1), 0);
  const shipCost = dealer?.ship ?? 0;
  const shipDays = dealer?.days ?? 2;
  const m = orderMath({ partSubtotal, shipping: shipCost, fulfillment });

  const needsAddress = fulfillment === "ship";
  const ready = email && phone && (!needsAddress || address) && cart.length > 0;

  const buildOrder = () => ({
    orderId: "ORD-" + Date.now(),
    fulfillment,
    dealer: dealerName,
    // Real dealers carry an id (from Supabase inventory) — without it the order
    // never reaches the dealer's dashboard or their alert email.
    dealerId: dealer?.dealerId ?? null,
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

  const handleCheckout = async () => {
    if (!ready || busy) return;
    const order = buildOrder();

    // No Stripe configured → demo confirmation (keeps the app usable).
    if (!STRIPE_ENABLED) return onConfirm(order);

    setBusy(true);
    try {
      const res = await createPaymentIntent({
        amount: m.customerTotal,
        platformFee: m.platformFee,
        // The chosen dealer's real Stripe Connect account (from inventory) gets
        // the payout and EzParts keeps the fee. Falls back to the browser-stored
        // demo account, then to a plain charge, so the rail still works in demo.
        dealerAccountId: dealer?.dealerAccountId || getDealerAccount() || undefined,
        metadata: {
          orderId: order.orderId, dealer: dealerName, fulfillment,
          dealerId: dealer?.dealerId != null ? String(dealer.dealerId) : "",
        },
      });
      if (res.clientSecret) {
        setPendingOrder(order);
        setClientSecret(res.clientSecret); // shows the card form
      } else {
        // Backend secret key not set yet → demo confirmation.
        onConfirm(order);
      }
    } catch {
      // Fail-safe: never block the order on a payment-setup hiccup.
      onConfirm(order);
    } finally {
      setBusy(false);
    }
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
            {cart.map((item, i) => {
              const qty = item.qty || 1;
              const lineTotal = (item.supplier?.price ?? 0) * qty;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "8px", gap: "8px" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{item.partName || "Part"}</span>
                  {onQty ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => onQty(i, qty - 1)} aria-label="Decrease quantity" style={qtyBtn}>−</button>
                      <span style={{ minWidth: "16px", textAlign: "center", fontWeight: 600 }}>{qty}</span>
                      <button onClick={() => onQty(i, qty + 1)} aria-label="Increase quantity" style={qtyBtn}>+</button>
                    </span>
                  ) : (
                    <span>×{qty}</span>
                  )}
                  <span style={{ fontWeight: 600, minWidth: "56px", textAlign: "right" }}>{money(lineTotal)}</span>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              <span>{fulfillment === "pickup" ? "Pickup" : "Shipping"}</span>
              <span>{fulfillment === "pickup" ? "FREE" : money(m.shipping)}</span>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "12px", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: "var(--price)", fontSize: "16px" }}>{money(m.customerTotal)}</span>
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.4 }}>
              You pay {dealerName} directly. EzParts’ fee comes from the dealer — never added to your price.
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--ag-green)", fontWeight: 600, marginTop: "6px", lineHeight: 1.4 }}>
              🛡️ OEM-verified parts are covered by the EzParts fit guarantee — if it doesn’t fit, return it free.
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

          {clientSecret && pendingOrder ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
              <PaymentForm
                amount={pendingOrder.total}
                onPaid={() => onConfirm({ ...pendingOrder, paid: true })}
                onCancel={() => { setClientSecret(null); setPendingOrder(null); }}
              />
            </Elements>
          ) : (
            <button
              className="btn-primary"
              onClick={handleCheckout}
              disabled={!ready || busy}
              style={{ width: "100%", padding: "14px", opacity: ready && !busy ? 1 : 0.5 }}
            >
              {busy
                ? "Starting checkout…"
                : `${fulfillment === "pickup" ? "Reserve for Pickup" : "Place Order"} · ${money(m.customerTotal)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

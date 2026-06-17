import { useState } from "react";
import { TopBar } from "../components/TopBar";

const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

export function Checkout({ cart, onBack, onConfirm }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const total = cart.reduce((sum, item) => sum + item.total, 0);

  const handleCheckout = () => {
    if (email && phone && address && cart.length > 0) {
      onConfirm({ email, phone, address, cart, total, orderId: "ORD-" + Date.now() });
    }
  };

  return (
    <div className="screen active">
      <TopBar title="Checkout" onBack={onBack} />
      
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Order Summary */}
          <div className="card" style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>
              Order Summary
            </h3>
            {cart.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                <span>{item.partName} x1</span>
                <span style={{ color: "var(--price)", fontWeight: "600" }}>{money(item.total)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "12px", display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
              <span>Total:</span>
              <span style={{ color: "var(--price)", fontSize: "16px" }}>{money(total)}</span>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="card" style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>
              Shipping Address
            </h3>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "8px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "12px",
              }}
            />
            <input
              type="tel"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "8px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "12px",
              }}
            />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "12px",
              }}
            />
          </div>

          {/* Checkout Button */}
          <button
            className="btn-primary"
            onClick={handleCheckout}
            disabled={!email || !phone || !address}
            style={{
              width: "100%",
              padding: "14px",
              opacity: email && phone && address ? 1 : 0.5,
            }}
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { money } from "../lib/marketplace";

// Collects the card and confirms the PaymentIntent. Calls onPaid() on success.
export function PaymentForm({ amount, onPaid, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    if (paymentIntent && paymentIntent.status === "succeeded") {
      onPaid(paymentIntent);
    } else {
      setError("Payment didn’t complete. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: "16px" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>Payment</h3>
      <PaymentElement />
      {error && (
        <div style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px" }}>{error}</div>
      )}
      <button
        className="btn-primary"
        onClick={pay}
        disabled={!stripe || busy}
        style={{ width: "100%", padding: "14px", marginTop: "12px", opacity: busy ? 0.6 : 1 }}
      >
        {busy ? "Processing…" : `Pay ${money(amount)}`}
      </button>
      {onCancel && (
        <button
          onClick={onCancel}
          style={{ width: "100%", padding: "10px", marginTop: "6px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}
        >
          Cancel
        </button>
      )}
      <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "8px", textAlign: "center" }}>
        Test mode — use card 4242 4242 4242 4242, any future date & CVC.
      </div>
    </div>
  );
}

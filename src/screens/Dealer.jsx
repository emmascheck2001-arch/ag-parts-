import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { PLATFORM_FEE_RATE } from "../lib/marketplace";
import {
  STRIPE_ENABLED,
  createConnectAccount,
  getConnectStatus,
  getDealerAccount,
  setDealerAccount,
} from "../lib/stripe";

const feePct = Math.round(PLATFORM_FEE_RATE * 100);

export function Dealer({ onBack, onNav }) {
  const [acctId, setAcctId] = useState(getDealerAccount());
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check status whenever we have an account id (incl. returning from Stripe).
  useEffect(() => {
    if (!acctId || !STRIPE_ENABLED) return;
    let alive = true;
    getConnectStatus(acctId)
      .then((s) => alive && setStatus(s))
      .catch(() => {});
    return () => { alive = false; };
  }, [acctId]);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createConnectAccount({ accountId: acctId });
      if (!res.configured) {
        setError("Payments aren’t configured yet.");
        setLoading(false);
        return;
      }
      setDealerAccount(res.accountId);
      window.location.href = res.url; // off to Stripe onboarding
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const reset = () => {
    setDealerAccount(null);
    setAcctId(null);
    setStatus(null);
  };

  const ready = status?.payouts_enabled && status?.charges_enabled;

  return (
    <div className="screen active">
      <TopBar title="Sell on EzParts" onBack={onBack} />
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          <div className="card" style={{ marginBottom: "14px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>
              Become an EzParts dealer
            </h3>
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.55 }}>
              List your parts in front of farmers searching for exactly what you stock.
              You set your prices and fulfill orders by shipping or in-store pickup.
              Payments go straight to your bank — EzParts keeps a {feePct}% fee per sale,
              taken automatically, so there’s nothing to invoice.
            </div>
          </div>

          {/* Status */}
          {!STRIPE_ENABLED ? (
            <div className="card" style={{ marginBottom: "14px", fontSize: "12.5px", color: "var(--text-muted)" }}>
              Payments aren’t configured yet.
            </div>
          ) : ready ? (
            <div className="card" style={{ marginBottom: "14px", borderColor: "var(--ag-green)", background: "var(--ag-green-soft)" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ag-green)" }}>✓ Payouts enabled</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                You’re set up to receive payments. Orders pay out to your account minus the {feePct}% EzParts fee.
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "8px", wordBreak: "break-all" }}>
                Account: {acctId}
              </div>
            </div>
          ) : acctId ? (
            <div className="card" style={{ marginBottom: "14px", borderColor: "var(--star)" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--star)" }}>Onboarding incomplete</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                You started setup but haven’t finished. Continue to enable payouts.
              </div>
            </div>
          ) : null}

          {error && (
            <div style={{ color: "var(--danger)", fontSize: "12px", marginBottom: "12px" }}>{error}</div>
          )}

          {STRIPE_ENABLED && !ready && (
            <button
              className="btn-primary"
              onClick={start}
              disabled={loading}
              style={{ width: "100%", padding: "14px", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Opening Stripe…" : acctId ? "Continue payout setup" : "Set up payouts with Stripe"}
            </button>
          )}

          <button
            onClick={() => onNav && onNav("list-part")}
            className="btn-primary"
            style={{ width: "100%", padding: "14px", marginTop: "10px" }}
          >
            List your parts
          </button>

          <button
            onClick={() => onNav && onNav("dealer-dashboard")}
            className="btn-primary"
            style={{ width: "100%", padding: "14px", marginTop: "8px", background: "transparent", border: "1px solid var(--ag-green)", color: "var(--ag-green)" }}
          >
            View order dashboard
          </button>

          {acctId && (
            <button
              onClick={reset}
              style={{ width: "100%", padding: "10px", marginTop: "8px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}
            >
              Start over with a new account
            </button>
          )}

          <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "12px", lineHeight: 1.4 }}>
            Test mode — Stripe will accept test details during onboarding (use the “skip”
            / prefilled options it offers). No real bank info needed.
          </div>
        </div>
      </div>
    </div>
  );
}

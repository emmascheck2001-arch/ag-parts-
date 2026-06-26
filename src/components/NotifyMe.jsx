import { useState } from "react";
import { logMiss } from "../lib/index-store";

// Capture demand when no dealer has listed a part yet: the farmer leaves an
// email and we record the (query, machine, email) as a lead. Beats sending the
// farmer straight off-platform to Google/eBay.
export function NotifyMe({ query, machine }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = () => {
    if (!valid) return;
    logMiss(query, { email, machine: machine || undefined });
    setDone(true);
  };

  if (done) {
    return (
      <div className="card" style={{ marginTop: "8px", borderColor: "var(--ag-green)", background: "var(--ag-green-soft)" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ag-green)" }}>✓ We'll let you know</div>
        <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.4 }}>
          We'll email you the moment a dealer lists “{query}”{machine ? ` for your ${machine}` : ""}.
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: "8px", borderColor: "var(--ag-green)" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
        Tell us you need it
      </h3>
      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "10px", lineHeight: 1.4 }}>
        Leave your email and we'll notify you — and ask our dealers to stock it — as soon as
        “{query}”{machine ? ` for your ${machine}` : ""} is available.
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="email"
          placeholder="you@farm.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{
            flex: 1, padding: "10px", borderRadius: "8px", fontSize: "13px",
            border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)",
          }}
        />
        <button
          className="btn-primary"
          onClick={submit}
          disabled={!valid}
          style={{ padding: "10px 14px", fontWeight: 700, opacity: valid ? 1 : 0.5, whiteSpace: "nowrap" }}
        >
          Notify me
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { signIn, signUp } from "../lib/auth";

const input = {
  width: "100%", padding: "11px", marginBottom: "10px", borderRadius: "8px",
  border: "1px solid var(--border)", background: "var(--surface)",
  color: "var(--text)", fontSize: "13px",
};

// reason: why the sign-in is being asked for (e.g. "to sell on EzParts")
export function Auth({ onBack, onAuthed, onGuest, reason }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [role, setRole] = useState("dealer"); // signup role
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dealerName, setDealerName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const submit = async () => {
    setErr(""); setNote("");
    if (!email || !password) { setErr("Email and password required."); return; }
    setBusy(true);
    try {
      if (mode === "signin") {
        const r = await signIn(email, password);
        onAuthed && onAuthed(r.session || null);
      } else {
        const r = await signUp({ email, password, role, dealerName });
        if (r.session) onAuthed && onAuthed(r.session);
        else setNote("Account created. Check your email to confirm, then sign in.");
      }
    } catch (e) {
      setErr(e?.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const tab = (id, label) => (
    <button onClick={() => { setMode(id); setErr(""); setNote(""); }}
      style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
        background: mode === id ? "var(--ag-green-soft)" : "transparent",
        color: mode === id ? "var(--ag-green)" : "var(--text-muted)",
        border: "none", borderBottom: "2px solid " + (mode === id ? "var(--ag-green)" : "transparent") }}>
      {label}
    </button>
  );

  const roleBtn = (id, label) => (
    <button onClick={() => setRole(id)}
      style={{ flex: 1, padding: "9px", fontSize: "12px", fontWeight: 600, cursor: "pointer", borderRadius: "8px",
        border: "1px solid " + (role === id ? "var(--ag-green)" : "var(--border)"),
        background: role === id ? "var(--ag-green-soft)" : "var(--surface)",
        color: role === id ? "var(--ag-green)" : "var(--text-muted)" }}>
      {label}
    </button>
  );

  return (
    <div className="screen active">
      <TopBar title="Sign in" onBack={onBack} />
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {reason && (
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>{reason}</div>
          )}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
              {tab("signin", "Sign in")}
              {tab("signup", "Create account")}
            </div>
            <div style={{ padding: "16px" }}>
              {mode === "signup" && (
                <>
                  <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>I am a…</div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    {roleBtn("dealer", "Dealer (sell parts)")}
                    {roleBtn("farmer", "Farmer (buy parts)")}
                  </div>
                  {role === "dealer" && (
                    <input style={input} placeholder="Dealership name" value={dealerName} onChange={(e) => setDealerName(e.target.value)} />
                  )}
                </>
              )}
              <input style={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input style={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              {err && <div style={{ fontSize: "12px", color: "var(--danger)", marginBottom: "8px" }}>{err}</div>}
              {note && <div style={{ fontSize: "12px", color: "var(--ag-green)", marginBottom: "8px" }}>{note}</div>}
              <button className="btn-primary" onClick={submit} disabled={busy}
                style={{ width: "100%", padding: "13px", opacity: busy ? 0.6 : 1 }}>
                {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </div>
          </div>

          {onGuest && (
            <button onClick={onGuest}
              style={{ width: "100%", marginTop: "14px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "12.5px", cursor: "pointer" }}>
              Just browsing? Continue as a guest →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

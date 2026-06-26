// The EzParts fit guarantee — our competitive moat made visible. We only make
// this promise where we can actually back it: an OEM-verified fit (listed in the
// machine's OEM parts manual). Unverified/OCR fits keep their "verify" language
// instead — never over-promise.
//
//   <FitGuarantee ok={tier.ok} machine={name} />            full reassurance card
//   <FitGuarantee ok={tier.ok} compact />                   small inline badge
export function FitGuarantee({ ok, machine, compact }) {
  if (!ok) return null;

  if (compact) {
    return (
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: "10px", fontWeight: 700, color: "var(--ag-green)",
          background: "var(--ag-green-soft)", borderRadius: "999px", padding: "2px 7px",
        }}
      >
        🛡️ Guaranteed fit
      </span>
    );
  }

  return (
    <div
      className="card"
      style={{ marginBottom: "16px", borderColor: "var(--ag-green)", background: "var(--ag-green-soft)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "18px" }}>🛡️</span>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ag-green)" }}>
          Guaranteed to fit{machine ? ` your ${machine}` : ""}
        </div>
      </div>
      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.45 }}>
        This part is OEM-verified for your machine. If it doesn't fit, return it free — that's the EzParts promise.
      </div>
    </div>
  );
}

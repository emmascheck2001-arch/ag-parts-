import { TopBar } from "../components/TopBar";

// ── Edit these as the business details firm up ────────────────────────────────
const CONTACT = {
  business: "EzParts",
  email: "support@ezparts.app", // TODO: set up a real, monitored inbox before going live
  region: "Iowa, United States",
};
const EFFECTIVE = "June 2026";

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: "14px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>{title}</h3>
      <div style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.55 }}>
        {children}
      </div>
    </div>
  );
}

export function Account({ onBack, onNav, session, profile, onSignIn, onSignOut }) {
  const user = session?.user;
  return (
    <div className="screen active">
      <TopBar title="Account & Info" onBack={onBack} />

      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Auth status */}
          <div className="card" style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            {user ? (
              <>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{profile?.dealer_name || user.email}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {profile?.role === "dealer" ? "Dealer account" : "Signed in"} · {user.email}
                  </div>
                </div>
                <button onClick={onSignOut} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", fontWeight: 600, color: "var(--text)", cursor: "pointer", flexShrink: 0 }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>Browsing as guest</div>
                <button onClick={onSignIn} className="btn-primary" style={{ padding: "8px 14px", fontSize: "12px", flexShrink: 0 }}>
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Dealer call-to-action */}
          <button
            onClick={() => onNav && onNav("dealer")}
            className="card"
            style={{
              width: "100%",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              marginBottom: "14px",
              cursor: "pointer",
              borderColor: "var(--ag-green)",
              background: "var(--ag-green-soft)",
              color: "var(--text)",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>Sell on EzParts</div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                Are you a dealer? Set up payouts and start selling.
              </div>
            </div>
            <span style={{ fontSize: "22px", color: "var(--ag-green)" }}>›</span>
          </button>

          {/* Admin: catalog extractor */}
          <button
            onClick={() => onNav && onNav("extract")}
            className="card"
            style={{
              width: "100%", textAlign: "left", display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: "10px", marginBottom: "14px",
              cursor: "pointer", color: "var(--text)",
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>Catalog Extractor</div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                Admin — turn a catalog page into structured fitment.
              </div>
            </div>
            <span style={{ fontSize: "22px", color: "var(--text-muted)" }}>›</span>
          </button>

          <Section title="Contact">
            <div><strong style={{ color: "var(--text)" }}>{CONTACT.business}</strong></div>
            <div>{CONTACT.region}</div>
            <div style={{ marginTop: "6px" }}>
              Email:{" "}
              <a href={`mailto:${CONTACT.email}`} style={{ color: "var(--ag-green)" }}>
                {CONTACT.email}
              </a>
            </div>
            <div style={{ marginTop: "6px" }}>
              Questions about an order, a part, or a return? Email us and we’ll get back within 1 business day.
            </div>
          </Section>

          <Section title="How It Works">
            EzParts is a marketplace that connects farmers with agricultural-parts dealers.
            You search for the right part, compare dealers on price, distance, and delivery,
            then order it. The dealer fulfills the order by shipping it to your farm or holding
            it for pickup. You pay the dealer’s listed price; EzParts earns a small commission
            from the dealer — never added to your price.
          </Section>

          <Section title="Returns & Refunds">
            <ul style={{ paddingLeft: "16px", margin: 0 }}>
              <li>Unused, uninstalled parts may be returned within <strong style={{ color: "var(--text)" }}>30 days</strong> in their original packaging.</li>
              <li><strong style={{ color: "var(--text)" }}>Wrong or defective part?</strong> We’ll arrange a free return and a replacement or full refund.</li>
              <li><strong style={{ color: "var(--text)" }}>Core charges:</strong> parts sold with a core deposit are refunded once the old core is returned to the dealer.</li>
              <li>Refunds are issued to your original payment method, typically within 5–10 business days of the dealer receiving the return.</li>
              <li>Returns are handled through the dealer that fulfilled your order; contact us and we’ll coordinate it.</li>
            </ul>
          </Section>

          <Section title="Terms of Service">
            By placing an order you agree that EzParts operates as a marketplace: dealers are the
            sellers of record and set their own prices, stock, and shipping. EzParts facilitates the
            transaction and payment and charges dealers a commission. We work to keep fitment and
            pricing accurate but do not guarantee availability; an order is confirmed only once the
            dealer accepts it. Effective {EFFECTIVE}.
          </Section>

          <Section title="Privacy">
            We collect only what’s needed to process your orders — your name, contact details, and
            (for shipped orders) your delivery address — and share it with the fulfilling dealer and
            our payment processor (Stripe) to complete the sale. We don’t sell your personal
            information. Effective {EFFECTIVE}.
          </Section>

          <div style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", padding: "8px 0 4px" }}>
            © 2026 {CONTACT.business}
          </div>
        </div>
      </div>
    </div>
  );
}

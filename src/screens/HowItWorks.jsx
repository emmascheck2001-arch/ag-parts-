import { TopBar } from "../components/TopBar";

export function HowItWorks({ onBack }) {
  return (
    <div className="screen active">
      <TopBar title="How It Works" onBack={onBack} />
      
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Step 1 */}
          <div className="card" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <div style={{
                background: "var(--ag-green)",
                color: "#fff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                flexShrink: 0,
              }}>
                1
              </div>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Search for a Part</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Enter a part number, machine model, or description in the search bar
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <div style={{
                background: "var(--ag-green)",
                color: "#fff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                flexShrink: 0,
              }}>
                2
              </div>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Compare Prices</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  See all available suppliers with prices, shipping costs, and delivery times
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card" style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <div style={{
                background: "var(--ag-green)",
                color: "#fff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                flexShrink: 0,
              }}>
                3
              </div>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Get Verified Fitment</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Every part is verified to fit your specific machine model
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <div style={{
                background: "var(--ag-green)",
                color: "#fff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                flexShrink: 0,
              }}>
                4
              </div>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Order & Track</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Buy from your favorite supplier and track your order in real-time
                </div>
              </div>
            </div>
          </div>

          {/* Why Use PartFinder */}
          <div style={{
            background: "rgba(36, 179, 63, 0.08)",
            border: "1px solid var(--ag-green-soft)",
            borderRadius: "8px",
            padding: "16px",
          }}>
            <div style={{ fontWeight: "600", marginBottom: "12px", color: "var(--ag-green)" }}>
              Why Choose PartFinder AG?
            </div>
            <ul style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.6" }}>
              <li>✓ Never the wrong part - Verified fitment guaranteed</li>
              <li>✓ Lowest price - Automatic price comparison across suppliers</li>
              <li>✓ One search - Find all suppliers in one place</li>
              <li>✓ Easy tracking - Know exactly when your parts arrive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

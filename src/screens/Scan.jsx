import { TopBar } from "../components/TopBar";

export function Scan({ onBack }) {
  return (
    <div className="screen active">
      <TopBar title="Scan Part" onBack={onBack} />
      
      <div className="scroll">
        <div style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>📱</div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
            Scan Barcode or QR Code
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Point your camera at a part barcode or QR code to quickly find pricing
          </p>

          <button
            className="btn-primary"
            onClick={() => alert("Camera access would open here")}
            style={{ width: "100%", padding: "14px" }}
          >
            Open Camera
          </button>

          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              background: "rgba(36, 179, 63, 0.08)",
              borderRadius: "8px",
              border: "1px solid var(--ag-green-soft)",
            }}
          >
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              💡 <strong>Tip:</strong> You can also search by part number manually in the home screen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { TopBar } from "../components/TopBar";

// Snap (or upload) a photo of a part or its tag/label. Claude vision reads the
// part number off it, then we drop the farmer straight into search results.
// Uses the same extract-fitment function the dealer catalog importer uses.
export function Scan({ onBack, onDetected }) {
  const [file, setFile] = useState(null); // { data, mediaType, name, preview }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      const base64 = url.split(",")[1] || "";
      setFile({ data: base64, mediaType: f.type, name: f.name, preview: url });
    };
    reader.readAsDataURL(f);
  };

  const read = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/.netlify/functions/extract-fitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: file.data, mediaType: file.mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "HTTP " + res.status);
      if (json.configured === false) {
        setError("Photo recognition isn't switched on yet. Type the part number on the home screen instead.");
        return;
      }
      const pn = (json.fitments || []).map((r) => r.part_number).find(Boolean);
      if (!pn) {
        setError("Couldn't read a part number from that photo. Try a clearer shot of the part tag, or type it in.");
        return;
      }
      onDetected && onDetected(pn.trim());
    } catch (e) {
      setError(e.message || "Something went wrong reading the photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen active">
      <TopBar title="Scan Part" onBack={onBack} />
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          <div className="card" style={{ marginBottom: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "44px", marginBottom: "8px" }}>📷</div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>
              Photograph the part or its tag
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
              Take a clear photo of the part number stamped on the part or its label.
              We'll read it and find who has it in stock.
            </p>

            {/* capture="environment" opens the rear camera on phones; on desktop
                it's a normal file picker. */}
            <label className="btn-primary" style={{ display: "block", width: "100%", padding: "13px", cursor: "pointer" }}>
              {file ? "Choose a different photo" : "Take / choose photo"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFile}
                style={{ display: "none" }}
              />
            </label>

            {file?.preview && (
              <img
                src={file.preview}
                alt="Part to scan"
                style={{ width: "100%", borderRadius: "8px", marginTop: "12px", border: "1px solid var(--border)" }}
              />
            )}

            {file && (
              <button
                className="btn-primary"
                onClick={read}
                disabled={busy}
                style={{ width: "100%", padding: "13px", marginTop: "10px", opacity: busy ? 0.6 : 1 }}
              >
                {busy ? "Reading the photo…" : "Find this part"}
              </button>
            )}

            {error && (
              <div style={{ color: "var(--danger)", fontSize: "12px", marginTop: "10px", lineHeight: 1.4 }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", lineHeight: 1.5, padding: "0 4px" }}>
            💡 <strong>Tip:</strong> the part number is usually stamped on the part or printed on a
            sticker — letters and digits like <span style={{ fontFamily: "monospace" }}>RE509672</span>.
            You can also type it on the home screen.
          </div>
        </div>
      </div>
    </div>
  );
}

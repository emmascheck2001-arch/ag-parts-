import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { netlifyFunctionUrl } from "../lib/netlify-functions";

// Snap (or upload) a photo of a part or its tag/label. Claude vision reads the
// part number off it, then we drop the farmer straight into search results.
// Uses the same extract-fitment function the dealer catalog importer uses.
export function Scan({ machineName, onBack, onDetected }) {
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
      const res = await fetch(netlifyFunctionUrl("extract-fitment"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: file.data,
          mediaType: file.mediaType,
          mode: "part-photo",
          machineName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "HTTP " + res.status);
      if (json.configured === false) {
        setError("Photo recognition isn't switched on yet. Type the part number in the selected machine search instead.");
        return;
      }
      const candidates = json.candidates || [];
      const pn = candidates.find((candidate) => candidate.confidence === "high")?.part_number
        || candidates.find((candidate) => candidate.confidence === "medium")?.part_number;
      if (!pn) {
        setError("We couldn't confidently read a part number. Move closer to the stamped number, wipe away dirt if possible, and try again.");
        return;
      }
      onDetected && onDetected(pn.trim());
    } catch (e) {
      console.error("Part photo scan failed", e);
      setError("Photo recognition couldn't connect. Check your signal and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen active">
      <TopBar title="Find Part from Photo" onBack={onBack} />
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          <div className="scan-machine-context">
            <span>Machine selected</span>
            <strong>{machineName}</strong>
            <small>Photo results stay limited to parts for this machine.</small>
          </div>
          <div className="card" style={{ marginBottom: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "44px", marginBottom: "8px" }}>📷</div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>
              Photograph the part or its tag
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
              Take a clear photo of the part number stamped on the part or its label.
              We'll read it and search the selected machine's verified catalog.
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
            You can also type it in the selected machine search.
          </div>
        </div>
      </div>
    </div>
  );
}

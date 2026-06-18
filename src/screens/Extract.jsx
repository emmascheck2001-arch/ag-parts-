import { useState } from "react";
import { TopBar } from "../components/TopBar";

// Admin tool: upload a parts-catalog page (image or PDF) and let Claude
// extract structured fitment rows. Sourced data still needs human review
// before loading into the live catalog.
export function Extract({ onBack }) {
  const [file, setFile] = useState(null); // { data, mediaType, name }
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setRows(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "").split(",")[1] || "";
      setFile({ data: base64, mediaType: f.type, name: f.name });
    };
    reader.readAsDataURL(f);
  };

  const extract = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setRows(null);
    try {
      const res = await fetch("/.netlify/functions/extract-fitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: file.data, mediaType: file.mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "HTTP " + res.status);
      if (json.configured === false) {
        setError("The Anthropic API key isn't configured yet.");
      } else {
        setRows(json.fitments || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const input = {
    width: "100%", padding: "10px", borderRadius: "6px",
    border: "1px solid var(--border)", background: "var(--surface)",
    color: "var(--text)", fontSize: "13px",
  };

  return (
    <div className="screen active">
      <TopBar title="Catalog Extractor" onBack={onBack} />
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          <div className="card" style={{ marginBottom: "14px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Extract fitment from a catalog page</h3>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
              Upload a parts-catalog or fitment page (image or PDF). Claude reads it and returns
              structured part rows you can review before loading into the catalog.
            </div>
            <input type="file" accept="image/*,application/pdf" onChange={onFile} style={input} />
            {file && (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                {file.name} ({file.mediaType || "unknown type"})
              </div>
            )}
            <button
              className="btn-primary"
              onClick={extract}
              disabled={!file || busy}
              style={{ width: "100%", padding: "12px", marginTop: "10px", opacity: !file || busy ? 0.5 : 1 }}
            >
              {busy ? "Reading the page…" : "Extract fitment"}
            </button>
            {error && <div style={{ color: "var(--danger)", fontSize: "12px", marginTop: "10px" }}>{error}</div>}
          </div>

          {rows && (
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
                Extracted {rows.length} row{rows.length === 1 ? "" : "s"}
              </h3>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>
                AI-extracted — verify against the source before loading into the live catalog.
              </div>
              {rows.length === 0 && (
                <div className="card" style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  No part rows found on this page.
                </div>
              )}
              {rows.map((r, i) => (
                <div key={i} className="card" style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>
                    {r.part_number} — {r.part_name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                    {[r.make, r.model].filter(Boolean).join(" ")}
                    {r.serial_range ? ` · ${r.serial_range}` : ""}
                  </div>
                  {(r.position || r.qty || r.category) && (
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {[r.position, r.qty ? `Qty ${r.qty}` : "", r.category].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

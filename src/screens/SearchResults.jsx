import { useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { SupplierCard } from "../components/SupplierCard";
import { getParts, partsForMachine, getMachines } from "../lib/catalog";
import { rankSuppliers } from "../lib/ranking";
import { TIER, partTier } from "../lib/fit-confidence";
import { logMiss } from "../lib/index-store";

export function SearchResults({ query, onBack, onPartSelect, onBuy, onViewMap, onMachineSelect }) {
  const q = (query || "").toLowerCase();

  // Machines matching the query.
  const machineResults = getMachines().filter(
    (m) => m.nm.toLowerCase().includes(q) || (m.ty || "").toLowerCase().includes(q)
  );

  // Parts matching the query (number, name, fitment text, or category).
  const results = Object.entries(getParts())
    .filter(([pn, part]) =>
      pn.toLowerCase().includes(q) ||
      part.name.toLowerCase().includes(q) ||
      part.fits.toLowerCase().includes(q) ||
      (part.cat || "").toLowerCase().includes(q)
    )
    .map(([pn, part]) => ({ pn, ...part }));

  const handleBuyClick = (pn, supplier, total) => onBuy({ pn, supplier, total });
  const nothing = machineResults.length === 0 && results.length === 0;

  // Demand signal: a search the index couldn't answer is the ingestion queue.
  useEffect(() => {
    if (nothing && query) logMiss(query);
  }, [query, nothing]);

  // Own nothing: index dealers' listings, and point to where the rest already lives.
  const enc = encodeURIComponent((query || "") + " tractor part");
  const webSources = [
    { label: "Google", url: "https://www.google.com/search?q=" + enc },
    { label: "eBay", url: "https://www.ebay.com/sch/i.html?_nkw=" + enc },
    { label: "Amazon", url: "https://www.amazon.com/s?k=" + enc },
  ];
  const externalSearch = (
    <div className="card" style={{ marginTop: "8px" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Search the web for “{query}”</h3>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px", lineHeight: 1.4 }}>
        Not listed by a dealer yet? Find it anywhere — EzParts indexes dealers and points you to the rest.
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {webSources.map((s) => (
          <a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1, minWidth: "90px", textAlign: "center", padding: "10px",
              borderRadius: "8px", border: "1px solid var(--ag-green)",
              color: "var(--ag-green)", textDecoration: "none", fontSize: "12px", fontWeight: 600,
            }}
          >
            {s.label} ›
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <div className="screen active">
      <TopBar title={`Results for "${query}"`} onBack={onBack} />

      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {nothing ? (
            <>
              <div style={{ textAlign: "center", padding: "28px 20px 16px", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
                <div>No dealer has listed “{query}” yet — but you can still find it:</div>
              </div>
              {externalSearch}
            </>
          ) : (
            <>
              {/* Machines */}
              {machineResults.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px", color: "var(--text-muted)" }}>
                    Machines ({machineResults.length})
                  </h3>
                  {machineResults.map((m) => {
                    const count = partsForMachine(m.nm).length;
                    return (
                      <div
                        key={m.nm}
                        className="card"
                        onClick={() => onMachineSelect && onMachineSelect(m.nm)}
                        style={{ cursor: "pointer", marginBottom: "10px", display: "flex", alignItems: "center", gap: "12px" }}
                      >
                        {m.img ? (
                          <img src={m.img} alt={m.nm} loading="lazy" style={{ width: "60px", height: "44px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <span style={{ fontSize: "28px", width: "60px", textAlign: "center", flexShrink: 0 }}>{m.ic || "🚜"}</span>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>{m.nm}</div>
                          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {m.ty}{count ? ` · ${count} part${count > 1 ? "s" : ""}` : ""}
                          </div>
                        </div>
                        <span style={{ fontSize: "20px", color: "var(--text-muted)" }}>›</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Parts */}
              {results.length > 0 && (
                <>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px", color: "var(--text-muted)" }}>
                    Parts ({results.length})
                  </h3>
                  <button
                    onClick={onViewMap}
                    style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid var(--ag-green)", color: "var(--ag-green)", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", marginBottom: "16px" }}
                  >
                    📍 View Suppliers Near Me
                  </button>
                  {results.map((part) => {
                    const sorted = rankSuppliers(part.suppliers);
                    return (
                      <div key={part.pn} style={{ marginBottom: "20px" }}>
                        <div className="card" onClick={() => onPartSelect(part.pn)} style={{ cursor: "pointer", marginBottom: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <div>
                              <div style={{ fontSize: "16px", fontWeight: "600" }}>{part.ic} {part.name}</div>
                              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{part.pn}</div>
                              {(() => {
                                const t = TIER[partTier(part.fitment)];
                                return (
                                  <div style={{ marginTop: "8px", display: "inline-flex", fontSize: "10.5px", fontWeight: 700,
                                    padding: "3px 8px", borderRadius: "999px", color: t.color, background: t.soft }}>
                                    {t.ok ? "✓ OEM-verified fit" : t.row === "⚠ Scan" ? "⚠ Scanned manual — verify #" : "⚠ Unverified — verify #"}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>Fits: {part.fits}</div>
                        </div>
                        {sorted.map((supplier, i) => (
                          <SupplierCard key={i} supplier={supplier} partNum={part.pn} best={i === 0} onBuy={handleBuyClick} />
                        ))}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Always offer the web — own nothing, find anything */}
              {externalSearch}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

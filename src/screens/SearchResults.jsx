import { TopBar } from "../components/TopBar";
import { SupplierCard } from "../components/SupplierCard";
import { VerifiedFit } from "../components/Badge";
import { MACHINES } from "../data/demo";
import { getParts, partsForMachine } from "../lib/catalog";
import { rankSuppliers } from "../lib/ranking";

export function SearchResults({ query, onBack, onPartSelect, onBuy, onViewMap, onMachineSelect }) {
  const q = (query || "").toLowerCase();

  // Machines matching the query.
  const machineResults = MACHINES.filter(
    (m) => m.nm.toLowerCase().includes(q) || m.ty.toLowerCase().includes(q)
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

  return (
    <div className="screen active">
      <TopBar title={`Results for "${query}"`} onBack={onBack} />

      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {nothing ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
              <div>No machines or parts found matching "{query}"</div>
              <button className="btn-primary" onClick={onBack} style={{ marginTop: "16px" }}>
                Back to Search
              </button>
            </div>
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
                        {m.img && (
                          <img src={m.img} alt={m.nm} loading="lazy" style={{ width: "60px", height: "44px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
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
                              <div style={{ marginTop: "8px" }}><VerifiedFit /></div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

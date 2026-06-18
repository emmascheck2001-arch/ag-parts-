import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { SupplierCard } from "../components/SupplierCard";
import { VerifiedFit } from "../components/Badge";
import { PARTS } from "../data/demo";
import { rankSuppliers } from "../lib/ranking";

export function SearchResults({ query, onBack, onPartSelect, onBuy, onViewMap }) {
  // Simple search - find parts matching query
  const q = (query || "").toLowerCase();
  const results = Object.entries(PARTS)
    .filter(([pn, part]) =>
      pn.toLowerCase().includes(q) ||
      part.name.toLowerCase().includes(q) ||
      part.fits.toLowerCase().includes(q) ||
      (part.cat || "").toLowerCase().includes(q)
    )
    .map(([pn, part]) => ({ pn, ...part }));

  const handleBuyClick = (pn, supplier, total) => {
    onBuy({ pn, supplier, total });
  };

  return (
    <div className="screen active">
      <TopBar 
        title={`Results for "${query}"`} 
        onBack={onBack}
      />
      
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
              <div>No parts found matching "{query}"</div>
              <button 
                className="btn-primary"
                onClick={onBack}
                style={{ marginTop: "16px" }}
              >
                Back to Search
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "16px" }}>
                <button
                  onClick={onViewMap}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "transparent",
                    border: "1px solid var(--ag-green)",
                    color: "var(--ag-green)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  📍 View Suppliers Near Me
                </button>
              </div>
              {results.map((part) => {
                const sorted = rankSuppliers(part.suppliers);
                return (
                  <div key={part.pn} style={{ marginBottom: "20px" }}>
                    <div
                      className="card"
                      onClick={() => onPartSelect(part.pn)}
                      style={{ cursor: "pointer", marginBottom: "12px" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: "600" }}>
                            {part.ic} {part.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                            {part.pn}
                          </div>
                          <div style={{ marginTop: "8px" }}>
                            <VerifiedFit />
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                        Fits: {part.fits}
                      </div>
                    </div>

                    {/* Suppliers */}
                    {sorted.map((supplier, i) => (
                      <SupplierCard
                        key={i}
                        supplier={supplier}
                        partNum={part.pn}
                        best={i === 0}
                        onBuy={handleBuyClick}
                      />
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { machines as getMachines, searchParts } from "../lib/db";
import { TIER, partTier } from "../lib/fit-confidence";
import { buildSearchTermGroups, normalizeSearchText } from "../lib/search-language";

export function SearchResults({ query, machine, onBack, onChangeMachine, onPartSelect, onMachineSelect }) {
  const q = normalizeSearchText(query);
  const groups = buildSearchTermGroups(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flagOpen, setFlagOpen] = useState(null);   // which part# has its red-flag note open

  // Same part number used by 2+ manufacturers → collect each maker's version.
  const byNumber = {};
  results.forEach((p) => {
    const key = p.pn;
    (byNumber[key] = byNumber[key] || []).push(p);
  });
  const sharedMakers = (pn) => {
    const parts = byNumber[pn] || [];
    const makers = [...new Set(parts.flatMap((x) => x.makes && x.makes.length ? x.makes : [x.manufacturer || "?"]))];
    return makers.length > 1 ? { makers, parts } : null;
  };

  // Machines matching the query (from the cached machine list; hidden when scoped).
  const machineResults = machine ? [] : getMachines().filter(
    (m) => {
      const haystack = normalizeSearchText(`${m.nm} ${m.ty || ""}`);
      return groups.length ? groups.every((group) => group.some((term) => haystack.includes(term))) : haystack.includes(q);
    }
  );

  // Parts: query Supabase server-side (scales to millions), then scope to the
  // chosen machine if one is set.
  useEffect(() => {
    let live = true;
    setLoading(true);
    searchParts(query, 80).then((parts) => {
      if (!live) return;
      const scoped = machine
        ? parts.filter((p) => (p.fitment || []).some((f) => f.machine === machine))
        : parts;
      setResults(scoped);
      setLoading(false);
    });
    return () => { live = false; };
  }, [query, machine]);

  const nothing = !loading && machineResults.length === 0 && results.length === 0;

  return (
    <div className="screen active">
      <TopBar title={`Results for "${query}"`} onBack={onBack} />

      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Machine scope banner */}
          <div
            onClick={onChangeMachine}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              padding: "10px 12px", marginBottom: 14, borderRadius: 8, cursor: "pointer",
              border: "1px solid " + (machine ? "var(--ag-green)" : "var(--border)"),
              background: machine ? "var(--ag-green-soft)" : "var(--surface)",
            }}
          >
            <span style={{ fontSize: 12.5, color: machine ? "var(--ag-green)" : "var(--text-muted)", fontWeight: 600 }}>
              {machine ? `✓ Showing parts that fit ${machine}` : "Searching all machines — pick yours to confirm fit"}
            </span>
            <span style={{ fontSize: 11.5, color: "var(--ag-green)", fontWeight: 700, whiteSpace: "nowrap" }}>Change ›</span>
          </div>

          {nothing ? (
            <div style={{ textAlign: "center", padding: "28px 20px 16px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
              <div>
                {machine
                  ? `No “${query}” parts found that fit ${machine} yet.`
                  : `No parts found for “${query}”.`}
              </div>
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
                    const count = m.count;
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

              {loading && (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: 13 }}>
                  Searching…
                </div>
              )}

              {/* Parts — search-engine view: no sellers, no prices */}
              {results.length > 0 && (
                <>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px", color: "var(--text-muted)" }}>
                    Parts ({results.length})
                  </h3>
                  {results.map((part, idx) => {
                    const fit = machine ? (part.fitment || []).filter((f) => f.machine === machine) : part.fitment;
                    const t = TIER[partTier(fit)];
                    const shared = sharedMakers(part.pn);
                    const mine = (part.makes && part.makes[0]) || part.manufacturer || "";
                    const open = flagOpen === part.pn + ":" + idx;
                    return (
                      <div key={part.pn + ":" + idx} className="card" style={{ position: "relative", marginBottom: "12px" }}>
                        {/* red flag — same number exists across manufacturers; tap to compare */}
                        {shared && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setFlagOpen(open ? null : part.pn + ":" + idx); }}
                            title="This number is used by more than one manufacturer — tap to compare"
                            style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
                          >🚩</button>
                        )}
                        <div onClick={() => onPartSelect(part.pn)} style={{ cursor: "pointer" }}>
                          <div style={{ fontSize: "16px", fontWeight: "600", paddingRight: shared ? 24 : 0 }}>{part.ic} {part.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                            Part #: <strong>{part.pn}</strong> · {part.cat}{mine ? <> · <span style={{ color: "var(--ag-green)", fontWeight: 600 }}>{mine}</span></> : null}
                          </div>
                          <div style={{ marginTop: "8px" }}>
                            <span style={{ display: "inline-flex", fontSize: "10.5px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px", color: t.color, background: t.soft }}>
                              {t.ok ? "✓ OEM-verified fit" : t.row === "⚠ Scan" ? "⚠ Scanned manual — verify #" : "⚠ Unverified — verify #"}
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>Fits: {part.fits}</div>
                        </div>
                        {/* the red-flag comparison note (only when the flag is tapped) */}
                        {shared && open && (
                          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(220,40,40,0.08)", border: "1px solid rgba(220,40,40,0.5)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#d33", marginBottom: 6 }}>🚩 Part #{part.pn} is used by {shared.makers.length} manufacturers</div>
                            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.4 }}>
                              Same number, different parts — pick the one for your machine:
                            </div>
                            {shared.parts.map((sp, i) => (
                              <div key={i} onClick={() => onPartSelect(sp.pn)} style={{ cursor: "pointer", padding: "6px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                                  <span style={{ color: "var(--ag-green)" }}>{(sp.makes && sp.makes[0]) || sp.manufacturer || "?"}</span> — {sp.name}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Fits: {sp.fits}</div>
                              </div>
                            ))}
                          </div>
                        )}
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

import { useState, useMemo, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { resolveExactParts, hasSerialBreaks } from "../data/demo";
import { loadMachines, machineByName, machinePartsFor } from "../lib/db";
import { CATEGORIES } from "../lib/categories";
import { UIIcon, CatIcon } from "../components/icons";
import { manualFor } from "../data/machine-manuals";
import { diagramPagesFor, loadDiagrams } from "../lib/diagrams";
import { DiagramBrowser } from "../components/DiagramBrowser";

const input = {
  width: "100%", padding: "11px 12px", borderRadius: 8, border: "1px solid var(--border)",
  background: "var(--surface)", color: "var(--text)", fontSize: 14,
};

// Machine → the parts that fit it. Search engine only: browse/search parts,
// see fitment, open the part. No sellers, prices, or ordering.
export function MachineDetails({ machine, onBack, onScan, onPartSelect, inFleetSaved = false, onToggleFleet }) {
  const [, setRefreshTick] = useState(0);
  const machineData = machineByName(machine);
  const manuals = machineData?.manuals || [];
  const primaryManualUrl = manualFor(machine, machineData?.make, machineData?.model);
  const [allParts, setAllParts] = useState([]);
  const [diagramAssetsReady, setDiagramAssetsReady] = useState(false);
  useEffect(() => {
    let live = true;
    loadMachines({ includeCounts: false }).then(() => {
      if (live) setRefreshTick((tick) => tick + 1);
    }).catch(() => {});
    return () => { live = false; };
  }, [machine]);
  useEffect(() => {
    let live = true;
    setAllParts([]);
    loadMachines({ includeCounts: false })
      .then(() => machinePartsFor(machine))
      .then((p) => { if (live) setAllParts(p); })
      .catch(() => { if (live) setAllParts([]); });
    return () => { live = false; };
  }, [machine]);

  const [cat, setCat] = useState(null);
  const [q, setQ] = useState("");
  const [browseMode, setBrowseMode] = useState("categories");
  const [sort, setSort] = useState("name");        // name | category
  const [limit, setLimit] = useState(40);          // render cap — big machines freeze the DOM
  const [serial, setSerial] = useState("");
  const [result, setResult] = useState(null);
  const runSerial = () => setResult(resolveExactParts(machine, serial));

  useEffect(() => { setLimit(40); }, [cat, q, sort]);
  useEffect(() => { setBrowseMode("categories"); }, [machine]);
  useEffect(() => {
    let live = true;
    setDiagramAssetsReady(false);
    loadDiagrams().then((ok) => {
      if (!live || !ok) return;
      setDiagramAssetsReady(true);
      setRefreshTick((tick) => tick + 1);
    }).catch(() => {});
    return () => { live = false; };
  }, [machine]);

  const counts = useMemo(() => {
    const c = {};
    for (const p of allParts) c[p.cat] = (c[p.cat] || 0) + 1;
    return c;
  }, [allParts]);

  const query = q.trim().toLowerCase();
  const browsing = cat != null || query.length > 0;
  const diagramSet = diagramPagesFor(machine);
  const manualEntries = useMemo(() => {
    const deduped = [];
    const seen = new Set();
    const pushEntry = (entry) => {
      if (!entry?.url || seen.has(entry.url)) return;
      seen.add(entry.url);
      deduped.push(entry);
    };
    if (primaryManualUrl) {
      pushEntry({
        title: "Parts Manual",
        type: "Manufacturer parts catalog",
        url: primaryManualUrl,
      });
    }
    for (const manual of manuals) pushEntry(manual);
    return deduped;
  }, [manuals, primaryManualUrl]);

  const shown = useMemo(() => {
    if (!browsing) return [];
    let list = allParts;
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const hay = `${p.name} ${p.pn} ${(p.cross || []).map((c) => c.pn).join(" ")}`.toLowerCase();
        return terms.every((tm) => hay.includes(tm));
      });
    } else if (cat) {
      list = list.filter((p) => p.cat === cat);
    }
    const by = {
      name: (a, b) => a.name.localeCompare(b.name),
      category: (a, b) => (a.cat || "").localeCompare(b.cat || "") || a.name.localeCompare(b.name),
    };
    return [...list].sort(by[sort] || by.name);
  }, [allParts, browsing, cat, query, sort]);

  return (
    <div className="screen active">
      <TopBar title={machine} onBack={onBack} right={machineData?.ic} />
      <div className="scroll">
        {machineData?.img && (
          <img src={machineData.img} alt={machine} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
        )}

        <div style={{ padding: 16 }}>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <input
              style={input}
              placeholder={`Search parts for this ${machineData?.ty || "machine"} — e.g. bearing`}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (e.target.value.trim()) { setCat(null); setBrowseMode("categories"); }
              }}
            />
          </div>

          {manualEntries.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginBottom: 10, color: "var(--text-muted)" }}>
                Manuals & Guides
              </h3>
              <div style={{ display: "grid", gap: 8 }}>
                {manualEntries.map((man) => (
                  <a
                    key={`${man.title}:${man.url}`}
                    href={man.url}
                    target="_blank"
                    rel="noreferrer"
                    className="card"
                    style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "var(--text)" }}
                  >
                    <span style={{ color: "var(--ag-green)", flexShrink: 0, lineHeight: 0 }}><UIIcon.doc width="22" height="22" /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{man.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{man.type}</div>
                    </div>
                    <span style={{ color: "var(--text-muted)", flexShrink: 0, lineHeight: 0 }}><UIIcon.external width="16" height="16" /></span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ---- HOME VIEW: category grid + machine info ---- */}
          {!browsing && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => onToggleFleet && onToggleFleet(machine)}
                  className="btn-primary"
                  style={{ flex: 1, padding: 11, fontSize: 13, fontWeight: 700, background: inFleetSaved ? "var(--surface)" : undefined, color: inFleetSaved ? "var(--ag-green)" : undefined, border: inFleetSaved ? "1px solid var(--ag-green)" : "none" }}
                >
                  {inFleetSaved ? "★ In My Machines" : "☆ Add to My Machines"}
                </button>
                <button
                  onClick={onScan}
                  className="btn-primary"
                  style={{ flex: 1, padding: 11, fontSize: 13, fontWeight: 700 }}
                >
                  <UIIcon.camera width="17" height="17" /> Use a photo
                </button>
              </div>

              <div style={{ fontSize: 12.5, color: "var(--ag-green)", fontWeight: 600, marginBottom: 12 }}>
                {allParts.length} parts catalogued for {machine}
              </div>

              {diagramSet && (
                <div className="machine-browse-tabs" role="tablist" aria-label="Parts browsing mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={browseMode === "categories"}
                    className={browseMode === "categories" ? "active" : ""}
                    onClick={() => setBrowseMode("categories")}
                  >
                    <UIIcon.grid width="18" height="18" /> Categories
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={browseMode === "diagram"}
                    className={browseMode === "diagram" ? "active" : ""}
                    onClick={() => setBrowseMode("diagram")}
                  >
                    <UIIcon.doc width="18" height="18" /> Diagrams
                  </button>
                </div>
              )}

              {!diagramSet && !diagramAssetsReady && (
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: 12 }}>
                  Diagram pages load on demand for legacy machines.
                </div>
              )}

              {browseMode === "diagram" && diagramSet ? (
                <DiagramBrowser machine={machine} parts={allParts} onPartSelect={onPartSelect} />
              ) : (
                <>
                  <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Browse parts by category</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                    {CATEGORIES.map((c) => {
                      const n = counts[c.key] || 0;
                      const Ic = CatIcon[c.key] || CatIcon.Other;
                      return (
                        <button
                          key={c.key}
                          onClick={() => n && setCat(c.key)}
                          style={{
                            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
                            padding: "16px 8px", cursor: n ? "pointer" : "default", opacity: n ? 1 : 0.4,
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--text)",
                          }}
                        >
                          <Ic width="26" height="26" style={{ color: "var(--ag-green)" }} />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{c.key}</span>
                          <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{n} part{n === 1 ? "" : "s"}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Machine details */}
                  <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Machine Details</h3>
                    {[["Make", machineData?.make], ["Model", machineData?.model], ["Year", machineData?.year], ["Type", machineData?.ty], ["Engine", machineData?.hp]]
                      .filter(([, v]) => v)
                      .map(([label, value], i, arr) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <span style={{ color: "var(--text-muted)" }}>{label}</span>
                          <span style={{ fontWeight: 600 }}>{value}</span>
                        </div>
                      ))}
                  </div>

              {/* Serial lookup — exact part, never the wrong one */}
                  {hasSerialBreaks(machine) && (
                <div className="card" style={{ marginBottom: 20, borderColor: "var(--ag-green)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Find Your Exact Part by Serial</h3>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10 }}>
                    Some parts change at a serial break. Enter your serial / PIN and we'll give the exact one.
                  </div>
                  <input value={serial} onChange={(e) => setSerial(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSerial()} placeholder="Serial / PIN" style={{ ...input, marginBottom: 8 }} />
                  <button className="btn-primary" onClick={runSerial} style={{ width: "100%", padding: 12 }}>Find exact parts</button>
                  {result?.error && <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 10 }}>{result.error}</div>}
                  {result?.parts && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Matched to production #{result.seq}</div>
                      {result.parts.map((p) => (
                        <button key={p.role} onClick={() => onPartSelect(p.pn)} style={{ width: "100%", textAlign: "left", display: "block", background: "var(--ag-green-soft)", border: "1px solid var(--ag-green)", borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer", color: "var(--text)" }}>
                          <div style={{ fontSize: 12, color: "var(--ag-green)", fontWeight: 700 }}>✅ Correct {p.role}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{p.pn}</div>
                          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{p.name} · {p.range}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                  )}

                </>
              )}
            </>
          )}

          {/* ---- BROWSE VIEW: category or search results ---- */}
          {browsing && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {cat && (
                  <button onClick={() => setCat(null)} style={{ background: "none", border: "none", color: "var(--ag-green)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                    ‹ All categories
                  </button>
                )}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2, display: "flex", alignItems: "center", gap: 8 }}>
                {cat ? (() => { const Ic = CatIcon[cat] || CatIcon.Other; return <><Ic width="20" height="20" style={{ color: "var(--ag-green)" }} /> {cat}</>; })() : `Results for "${q}"`}
              </h3>
              <div style={{ fontSize: 11.5, color: "var(--ag-green)", marginBottom: 12 }}>
                ✓ {shown.length} part{shown.length === 1 ? "" : "s"} that fit {machine}
              </div>

              {/* Sort only — no dealer filters */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...input, width: "auto", padding: "7px 10px", fontSize: 12 }}>
                  <option value="name">Sort: Name</option>
                  <option value="category">Sort: Category</option>
                </select>
              </div>

              {shown.length === 0 ? (
                <div className="card" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  No matching parts for this machine.
                </div>
              ) : (
                <>
                  {shown.slice(0, limit).map((p) => (
                    <div key={p.pn} className="card" onClick={() => onPartSelect(p.pn)}
                      style={{ cursor: "pointer", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{p.ic || "🧩"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                          Part #: <strong>{p.pn}</strong> · {p.cat}
                        </div>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: 18 }}>›</span>
                    </div>
                  ))}
                  {shown.length > limit && (
                    <button
                      onClick={() => setLimit((l) => l + 40)}
                      style={{ width: "100%", padding: 12, marginTop: 4, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ag-green)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    >
                      Show more ({shown.length - limit} remaining)
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

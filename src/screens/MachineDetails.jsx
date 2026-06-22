import { useState, useMemo, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { PartCard } from "../components/PartCard";
import { resolveExactParts, hasSerialBreaks } from "../data/demo";
import { machineParts, serviceKit, getMachines } from "../lib/catalog";
import { CATEGORIES, categoryIcon } from "../lib/categories";
import { inFleet, toggleFleet } from "../lib/fleet";
import { UIIcon } from "../components/icons";

const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));
const input = {
  width: "100%", padding: "11px 12px", borderRadius: 8, border: "1px solid var(--border)",
  background: "var(--surface)", color: "var(--text)", fontSize: 14,
};

// The machine parts hub: pick a category (or search) → browse the parts that are
// CONFIRMED to fit this exact machine, with filters/sorting and one-tap order.
export function MachineDetails({ machine, onBack, onPartSelect, onBuy }) {
  const machineData = getMachines().find((m) => m.nm === machine);
  const manuals = machineData?.manuals || [];
  const allParts = useMemo(() => machineParts(machine), [machine]);
  const kit = useMemo(() => serviceKit(machine), [machine]);

  const [cat, setCat] = useState(null);           // selected category key, or null = category grid
  const [q, setQ] = useState("");                 // within-machine search
  const [sort, setSort] = useState("price");      // price | priceHigh | ship | name
  const [oem, setOem] = useState("all");          // all | oem | aftermarket
  const [stockOnly, setStockOnly] = useState(false);
  const [supplier, setSupplier] = useState("all");
  const [fleet, setFleet] = useState(inFleet(machine));

  const [limit, setLimit] = useState(30);          // render cap — big categories (300+ parts) freeze the DOM
  const [serial, setSerial] = useState("");
  const [result, setResult] = useState(null);
  const runSerial = () => setResult(resolveExactParts(machine, serial));

  // Reset the render cap whenever the result set changes.
  useEffect(() => { setLimit(30); }, [cat, q, sort, oem, stockOnly, supplier]);

  // counts per category for the grid
  const counts = useMemo(() => {
    const c = {};
    for (const p of allParts) c[p.cat] = (c[p.cat] || 0) + 1;
    return c;
  }, [allParts]);

  const suppliers = useMemo(() => {
    const s = new Set();
    allParts.forEach((p) => p.suppliers.forEach((x) => s.add(x.s)));
    return [...s].sort();
  }, [allParts]);

  const query = q.trim().toLowerCase();
  const browsing = cat != null || query.length > 0;

  const shown = useMemo(() => {
    if (!browsing) return [];
    let list = allParts;
    if (query) {
      // Search spans the WHOLE machine (every word must match somewhere) — name,
      // part #, OEM #, or a cross-reference number.
      const SYN = { oil: ["oil", "lube"], lube: ["lube", "oil"], ac: ["ac", "a/c", "recirc", "cab"] };
      const terms = query.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const hay = `${p.name} ${p.pn} ${p.oemNumber} ${(p.cross || []).map((c) => c.pn).join(" ")}`.toLowerCase();
        return terms.every((tm) => (SYN[tm] || [tm]).some((s) => hay.includes(s)));
      });
    } else if (cat) {
      list = list.filter((p) => p.cat === cat);
    }
    // Catalog parts are OEM (from the makers' manuals); aftermarket options are
    // documented as cross-references, so "Aftermkt" = parts with a cross-ref alt.
    if (oem === "oem") list = list.filter((p) => p.isOem);
    if (oem === "aftermarket") list = list.filter((p) => (p.cross || []).length > 0);
    if (stockOnly) list = list.filter((p) => p.inStock);
    if (supplier !== "all") list = list.filter((p) => p.suppliers.some((s) => s.s === supplier));
    const by = {
      price: (a, b) => (a.from ?? 1e9) - (b.from ?? 1e9),
      priceHigh: (a, b) => (b.from ?? -1) - (a.from ?? -1),
      ship: (a, b) => a.fastestDays - b.fastestDays,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...list].sort(by[sort] || by.price);
  }, [allParts, browsing, cat, query, oem, stockOnly, supplier, sort]);

  const addKitToCart = () => {
    const orderable = kit.filter((p) => p.bestSupplier);
    orderable.forEach((p, i) => {
      onBuy?.({
        pn: p.pn, supplier: p.bestSupplier,
        total: (p.bestSupplier.price || 0) + (p.bestSupplier.ship || 0),
        partName: p.name, silent: i < orderable.length - 1, // last one opens checkout with full cart
      });
    });
  };

  return (
    <div className="screen active">
      <TopBar title={machine} onBack={onBack} right={machineData?.ic} />
      <div className="scroll">
        {machineData?.img && (
          <img src={machineData.img} alt={machine} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
        )}

        <div style={{ padding: 16 }}>
          {/* Search within this machine — always available */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <input
              style={input}
              placeholder={`Search parts for this ${machineData?.ty || "machine"} — e.g. oil filter`}
              value={q}
              onChange={(e) => { setQ(e.target.value); if (e.target.value.trim()) setCat(null); }}
            />
          </div>

          {/* ---- CATEGORY GRID + machine info (home view) ---- */}
          {!browsing && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => { toggleFleet(machine); setFleet(inFleet(machine)); }}
                  className="btn-primary"
                  style={{ flex: 1, padding: 11, fontSize: 13, fontWeight: 700, background: fleet ? "var(--surface)" : undefined, color: fleet ? "var(--ag-green)" : undefined, border: fleet ? "1px solid var(--ag-green)" : "none" }}
                >
                  {fleet ? "★ In My Fleet" : "☆ Add to My Fleet"}
                </button>
              </div>

              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Browse parts by category</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                {CATEGORIES.map((c) => {
                  const n = counts[c.key] || 0;
                  return (
                    <button
                      key={c.key}
                      onClick={() => n && setCat(c.key)}
                      style={{
                        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
                        padding: "14px 8px", cursor: n ? "pointer" : "default", opacity: n ? 1 : 0.4,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "var(--text)",
                      }}
                    >
                      <span style={{ fontSize: 26 }}>{c.ic}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.key}</span>
                      <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{n} part{n === 1 ? "" : "s"}</span>
                    </button>
                  );
                })}
              </div>

              {/* Maintenance / service kit */}
              {kit.length > 0 && (
                <div className="card" style={{ marginBottom: 20, borderColor: "var(--ag-green)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🧰 Service Kit ({kit.length} filters)</h3>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10 }}>
                    All the filters for a service interval on this machine — order the set in one tap.
                  </div>
                  <div style={{ fontSize: 12, marginBottom: 10 }}>
                    {kit.map((p) => (
                      <div key={p.pn} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "var(--text-muted)" }}>
                        <span>{p.name}</span><span>{p.from != null ? money(p.from) : "—"}</span>
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary" onClick={addKitToCart} style={{ width: "100%", padding: 11, fontWeight: 700 }}>
                    Add service kit to cart
                  </button>
                </div>
              )}

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
                          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{p.name} · {p.range} · tap for suppliers ›</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manuals */}
              {manuals.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", marginBottom: 10, color: "var(--text-muted)" }}>Manuals & Guides</h3>
                  {manuals.map((man) => (
                    <a key={man.title} href={man.url} target="_blank" rel="noreferrer" className="card" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, textDecoration: "none", color: "var(--text)" }}>
                      <span style={{ color: "var(--ag-green)", flexShrink: 0, lineHeight: 0 }}><UIIcon.doc width="22" height="22" /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{man.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{man.type}</div>
                      </div>
                      <span style={{ color: "var(--text-muted)", flexShrink: 0, lineHeight: 0 }}><UIIcon.external width="16" height="16" /></span>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ---- BROWSE VIEW: category or search results ---- */}
          {browsing && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {cat && (
                  <button onClick={() => { setCat(null); }} style={{ background: "none", border: "none", color: "var(--ag-green)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                    ‹ All categories
                  </button>
                )}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                {cat ? `${categoryIcon(cat)} ${cat}` : `Results for "${q}"`}
              </h3>
              <div style={{ fontSize: 11.5, color: "var(--ag-green)", marginBottom: 12 }}>
                ✓ {shown.length} part{shown.length === 1 ? "" : "s"} confirmed to fit {machine}
              </div>

              {/* Filter / sort bar */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...input, width: "auto", padding: "7px 10px", fontSize: 12 }}>
                  <option value="price">Price: low → high</option>
                  <option value="priceHigh">Price: high → low</option>
                  <option value="ship">Fastest shipping</option>
                  <option value="name">Name</option>
                </select>
                <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                  {["all", "oem", "aftermarket"].map((o) => (
                    <button key={o} onClick={() => setOem(o)} style={{ padding: "7px 10px", fontSize: 11.5, fontWeight: 600, border: "none", cursor: "pointer", background: oem === o ? "var(--ag-green)" : "var(--surface)", color: oem === o ? "#fff" : "var(--text-muted)" }}>
                      {o === "all" ? "All" : o === "oem" ? "OEM" : "Aftermkt"}
                    </button>
                  ))}
                </div>
                <button onClick={() => setStockOnly((v) => !v)} style={{ padding: "7px 10px", fontSize: 11.5, fontWeight: 600, borderRadius: 8, cursor: "pointer", border: "1px solid " + (stockOnly ? "var(--ag-green)" : "var(--border)"), background: stockOnly ? "var(--ag-green-soft)" : "var(--surface)", color: stockOnly ? "var(--ag-green)" : "var(--text-muted)" }}>
                  In stock
                </button>
                {suppliers.length > 1 && (
                  <select value={supplier} onChange={(e) => setSupplier(e.target.value)} style={{ ...input, width: "auto", padding: "7px 10px", fontSize: 12 }}>
                    <option value="all">All suppliers</option>
                    {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>

              {shown.length === 0 ? (
                <div className="card" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {oem === "aftermarket"
                    ? "No aftermarket cross-references documented for these parts yet — they're all OEM."
                    : "No matching parts for this machine."}
                </div>
              ) : (
                <>
                  {shown.slice(0, limit).map((p) => (
                    <PartCard key={p.pn} part={p} machineName={machine} onSelect={onPartSelect} onOrder={onBuy} />
                  ))}
                  {shown.length > limit && (
                    <button
                      onClick={() => setLimit((l) => l + 30)}
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

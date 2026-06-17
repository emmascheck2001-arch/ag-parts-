import { useState } from "react";

/* ============================================================
   PartFinder AG — preview build (single file).
   In the real project this splits into src/styles.css,
   src/data/demo.js, src/components/*, and src/screens/*.
   Tokens live in the <style> block below = single source of truth.
   ============================================================ */

/* ---------------- DEMO DATA (replace with Supabase) ---------------- */
const MACHINES = [
  { nm: "John Deere 8320R", ty: "Tractor", ic: "🚜" },
  { nm: "New Holland CR8.90", ty: "Combine", ic: "🌾" },
  { nm: "Case IH Magnum 340", ty: "Tractor", ic: "🚜" },
];
const CATS = [
  { t: "Engine", ic: "⚙️" }, { t: "Hydraulic", ic: "💧" }, { t: "Electrical", ic: "⚡" },
  { t: "Filters", ic: "🔲" }, { t: "Belts", ic: "➰" }, { t: "Bearings", ic: "⭕" },
  { t: "Drivetrain", ic: "🔩" }, { t: "Cooling", ic: "❄️" }, { t: "Cab & Body", ic: "🚪" },
];
const RECENT = ["RE548693 hydraulic pump", "Air filter Donaldson P606860", "Serpentine belt 8PK2610"];
const PARTS = {
  RE548693: {
    name: "Hydraulic Pump", cat: "Hydraulic", ic: "🔧", fits: "John Deere 8320R, 8345R, 8370R", stock: 14,
    suppliers: [
      { s: "Prairie Equipment", price: 389, ship: 25, rating: 4.8, n: 230, days: 2, stock: 14 },
      { s: "Greenline Supply", price: 412, ship: 25, rating: 4.6, n: 95, days: 1, stock: 3 },
      { s: "Agri Parts Central", price: 425, ship: 28, rating: 4.7, n: 120, days: 2, stock: 8 },
      { s: "JD Parts Direct", price: 445, ship: 30, rating: 4.8, n: 342, days: 1, stock: 12, oem: true },
    ],
  },
  P606860: {
    name: "Air Filter", cat: "Filters", ic: "🔲", fits: "John Deere 8320R, 8345R", stock: 40,
    suppliers: [
      { s: "Prairie Equipment", price: 45.75, ship: 9, rating: 4.8, n: 230, days: 2, stock: 40 },
      { s: "Agri Parts Central", price: 49, ship: 9, rating: 4.7, n: 120, days: 2, stock: 25 },
    ],
  },
  "8PK2610": {
    name: "Serpentine Belt", cat: "Belts", ic: "➰", fits: "Case IH Magnum 340", stock: 18,
    suppliers: [
      { s: "Ag Valley Supply", price: 32.1, ship: 10, rating: 4.8, n: 86, days: 3, stock: 18 },
      { s: "Greenline Supply", price: 36, ship: 12, rating: 4.6, n: 95, days: 3, stock: 6 },
    ],
  },
};
const MACHINE_PARTS = [
  { pn: "RE548693", name: "Hydraulic Pump", ic: "🔧", from: 389.0 },
  { pn: "P606860", name: "Air Filter", ic: "🔲", from: 45.75 },
  { pn: "8PK2610", name: "Serpentine Belt", ic: "➰", from: 32.1 },
  { pn: "RE54782", name: "Fuel Filter", ic: "⛽", from: 18.5 },
  { pn: "RE12345", name: "Alternator", ic: "🔋", from: 275.0 },
];
const REMINDERS = [
  { ic: "🛢", nm: "Engine Oil Change", due: "Due in 25 hours" },
  { ic: "💧", nm: "Hydraulic Filter Change", due: "Due in 56 hours" },
  { ic: "🔲", nm: "Air Filter Check", due: "Due in 10 hours" },
];

/* ---------------- HELPERS ---------------- */
const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));
const stars = (r) => { const f = Math.round(r); return "★★★★★".slice(0, f) + "☆☆☆☆☆".slice(0, 5 - f); };
const byPrice = (list) => [...list].sort((a, b) => (a.price + a.ship) - (b.price + b.ship));

/* ---------------- SMALL COMPONENTS ---------------- */
function TopBar({ title, onBack, right, variant }) {
  return (
    <div className={"topbar " + (variant || "")}>
      {onBack ? <button className="back" onClick={onBack}>‹</button> : <span className="spacer" />}
      <h1>{title}</h1>
      {right ? <span className="ic-r">{right}</span> : <span className="spacer" />}
    </div>
  );
}
function VFit() { return <span className="vfit">✓ VERIFIED FIT</span>; }

function SupplierCard({ r, best, onOpen }) {
  return (
    <div className={"rcard " + (best ? "best" : "")} onClick={() => onOpen(r.pn)}>
      {best && <span className="best-tag">BEST PRICE</span>}
      <div className="rtop">
        <div className="supp">
          <div className="s1">{r.s} {r.oem && <span className="oem-tag">OEM</span>}</div>
          <div className="rate"><span className="stars">{stars(r.rating)}</span> {r.rating} ({r.n})</div>
        </div>
        <div className="rprice"><div className="p">{money(r.price)}</div></div>
      </div>
      <div className="rmeta">
        <span className="in">{r.stock} in stock</span><span className="dot">•</span>
        {money(r.ship)} shipping<span className="dot">•</span>Ships in {r.days} day{r.days > 1 ? "s" : ""}
      </div>
      <div className="rbot">
        <span className="ships">{r.days === 1 ? "Ships tomorrow" : "Ships in " + r.days + " days"}</span>
        <button className={"buy " + (best ? "" : "ghost")} onClick={(e) => { e.stopPropagation(); onOpen(r.pn); }}>Buy now</button>
      </div>
    </div>
  );
}

/* ---------------- MAIN APP ---------------- */
export default function App() {
  const [screen, setScreen] = useState("home");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [part, setPart] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [mtab, setMtab] = useState("parts");
  const [toast, setToast] = useState("");

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 1600); }

  function go(id) { setScreen(id); window.scrollTo?.(0, 0); }

  function runSearch(q) {
    const term = (q || "").toLowerCase().trim();
    const matched = Object.entries(PARTS)
      .filter(([pn, p]) => !term || pn.toLowerCase().includes(term) || p.name.toLowerCase().includes(term) || p.cat.toLowerCase().includes(term))
      .map(([pn, p]) => ({ pn, ...p }));
    setQuery(q || "");
    if (matched.length === 1) {
      setFeatured(matched[0]);
      setResults(byPrice(matched[0].suppliers).map((s, i) => ({ ...s, pn: matched[0].pn, best: i === 0 })));
    } else {
      setFeatured(null);
      setResults(matched.map((p) => ({ ...byPrice(p.suppliers)[0], pn: p.pn, best: true })));
    }
    go("results");
  }

  function openPart(pn) {
    const p = PARTS[pn];
    if (!p) { showToast("Demo: part not seeded yet"); return; }
    setPart({ pn, ...p });
    setSupplier(byPrice(p.suppliers)[0]);
    go("part");
  }

  const navActive = { results: "results", categories: "results", part: "results", order: "orders", scan: "home", howitworks: "home" }[screen] || screen;

  return (
    <div className="phone">
      <style>{CSS}</style>
      <div className="demo-flag">DEMO DATA</div>

      {/* ---------- HOME ---------- */}
      {screen === "home" && (
        <div className="scroll">
          <div className="home-head">
            <div className="brand"><span className="logo">PARTFINDER</span><span className="ag">AG</span><span className="bell">🔔</span></div>
            <div className="tagline">Search every supplier. Find the right part.</div>
            <div className="searchbar">
              <input placeholder="Search part number, name, or description"
                onKeyDown={(e) => e.key === "Enter" && runSearch(e.target.value)} />
              <button className="go" onClick={(e) => runSearch(e.currentTarget.previousSibling.value)}>🔍</button>
            </div>
          </div>
          <div className="actions">
            <div className="action" onClick={() => go("scan")}><span className="ic">📷</span><span className="t">Scan Part</span><span className="s">Use camera</span></div>
            <div className="action" onClick={() => go("machine")}><span className="ic">🚜</span><span className="t">By Machine</span><span className="s">Find parts</span></div>
            <div className="action" onClick={() => runSearch("RE548693")}><span className="ic">🔢</span><span className="t">Part Number</span><span className="s">Manual search</span></div>
          </div>
          <div className="sec">
            <div className="sec-head"><h2>My Machines</h2><a onClick={() => go("machine")}>View all</a></div>
            <div className="mrow">
              {MACHINES.map((m) => (
                <div className="mcard" key={m.nm} onClick={() => go("machine")}>
                  <div className="img">{m.ic}</div>
                  <div className="meta"><div className="nm">{m.nm}</div><div className="ty">{m.ty}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="sec">
            <div className="sec-head"><h2>Quick Categories</h2></div>
            <div className="cats">
              {CATS.slice(0, 6).map((c) => (
                <div className="cat" key={c.t} onClick={() => runSearch(c.t)}><span className="ic">{c.ic}</span><span className="t">{c.t}</span></div>
              ))}
            </div>
          </div>
          <div className="allcat-row" onClick={() => go("categories")}>
            <span className="ic">🗂</span><div><div className="t">View all categories</div><div className="s">Browse all parts</div></div>
            <span className="chev">›</span>
          </div>
          <div className="sec">
            <div className="sec-head"><h2>Recent Searches</h2><a onClick={() => showToast("Cleared")}>Clear all</a></div>
            {RECENT.map((q) => (
              <div className="rec-item" key={q} onClick={() => runSearch(q.split(" ")[0])}><span className="ic">🕐</span><span className="t">{q}</span></div>
            ))}
          </div>
          <div className="sec" style={{ paddingBottom: 18 }}><a className="link" onClick={() => go("howitworks")}>How it works ›</a></div>
        </div>
      )}

      {/* ---------- CATEGORIES ---------- */}
      {screen === "categories" && (
        <>
          <TopBar title="Browse Categories" onBack={() => go("home")} right="🔍" />
          <div className="scroll"><div className="sec" style={{ paddingTop: 4 }}>
            <div className="cats">{CATS.map((c) => (
              <div className="cat" key={c.t} onClick={() => runSearch(c.t)}><span className="ic">{c.ic}</span><span className="t">{c.t}</span></div>
            ))}</div>
          </div></div>
        </>
      )}

      {/* ---------- SEARCH RESULTS ---------- */}
      {screen === "results" && (
        <>
          <TopBar title="Search Results" onBack={() => go("home")} right="🛒" />
          <div className="resbar"><div className="sb"><span className="mag">🔍</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch(e.target.value)} />
            <span className="x" onClick={() => go("home")}>✕</span></div></div>
          {featured && (
            <div className="featured"><div className="thumb">{featured.ic}</div>
              <div className="info"><div className="nm">{featured.name}</div>
                <div className="pn">{featured.pn} <VFit /></div>
                <div className="fits">Fits: {featured.fits} · {featured.cat} system</div></div></div>
          )}
          <div className="res-meta"><span className="count">{results.length} result{results.length === 1 ? "" : "s"} found</span><span className="filter">⚙ Filter</span></div>
          <div className="sortrow"><span className="chip on">Lowest price</span><span className="chip">Best match</span><span className="chip">Fastest delivery</span><span className="chip">Verified fit</span></div>
          <div className="scroll"><div className="list">
            {results.length
              ? results.map((r, i) => <SupplierCard key={i} r={r} best={r.best} onOpen={openPart} />)
              : <div className="empty">No parts match “{query}”.<br />Try a part number like RE548693.</div>}
          </div></div>
        </>
      )}

      {/* ---------- PART DETAILS ---------- */}
      {screen === "part" && part && (
        <>
          <TopBar title="Part Details" onBack={() => go("results")} right="⤴" />
          <div className="scroll">
            <div className="hero">{part.ic}</div>
            <div className="dots"><i className="on" /><i /><i /><i /></div>
            <div className="pd-head"><div className="nm">{part.name} <VFit /></div>
              <div className="pn">{part.pn} · Fits: {part.fits} · {part.cat} system</div></div>
            <div className="specrow">
              <div className="spec"><div className="v">New</div><div className="l">Condition</div></div>
              <div className="spec"><div className="v">{part.stock}</div><div className="l">In stock</div></div>
              <div className="spec"><div className="v">2 days</div><div className="l">Est. delivery</div></div>
            </div>
            <div className="cmp"><h3>Price comparison <a>See all</a></h3>
              {byPrice(part.suppliers).map((s, i) => (
                <div className="crow" key={i}>
                  <div className="left"><div className="s1">{s.s} {i === 0 && <span className="bp">· Best price</span>} {s.oem && <span className="oem-tag">OEM</span>}</div>
                    <div className="m"><span className="stars">{stars(s.rating)}</span> {s.rating} · <span className="in">{s.stock} in stock</span> · Ships {s.days}d</div></div>
                  <div className="right"><div className="p">{money(s.price)}</div><div className="ship">+{money(s.ship)} ship</div></div>
                </div>
              ))}
            </div>
            <div style={{ height: 8 }} />
          </div>
          <div className="cta-bar">
            <button className="buy" onClick={() => go("checkout")}>Buy now</button>
            <button className="buy ghost" onClick={() => showToast("Saved to your parts")}>♡ Save part</button>
          </div>
        </>
      )}

      {/* ---------- CHECKOUT ---------- */}
      {screen === "checkout" && part && supplier && (
        <>
          <TopBar title="Checkout" onBack={() => go("part")} variant="green" />
          <div className="scroll">
            <div className="block"><div className="bh"><h3>Order Summary</h3></div>
              <div className="osumm"><div className="thumb">{part.ic}</div>
                <div className="t"><div className="nm">{part.name}</div><div className="q">{part.pn} · Qty 1</div></div>
                <div className="pr">{money(supplier.price)}</div></div>
              <div className="divider" />
              <div className="lrow"><span>Subtotal</span><span>{money(supplier.price)}</span></div>
              <div className="lrow"><span>Shipping</span><span>{money(supplier.ship)}</span></div>
              <div className="lrow tot"><span>Total</span><span>{money(supplier.price + supplier.ship)}</span></div></div>
            <div className="block"><div className="bh"><h3>Ship To</h3><a onClick={() => showToast("Edit address")}>Change</a></div>
              <div className="addr">Emma Scheck<br />RR 3, Township 35<br />Saskatchewan, S0K</div></div>
            <div className="block"><div className="bh"><h3>Supplier</h3></div>
              <div className="osumm"><div className="t"><div className="nm">{supplier.s}</div>
                <div className="q"><span className="stars">{stars(supplier.rating)}</span> {supplier.rating} ({supplier.n}) · Ships in {supplier.days} days</div></div></div></div>
            <div className="block"><div className="bh"><h3>Payment Method</h3><a onClick={() => showToast("Change card")}>Change</a></div>
              <div className="pay">💳 •••• •••• •••• 4242</div></div>
            <div style={{ height: 6 }} />
          </div>
          <div className="placebar"><button className="place" onClick={() => go("order")}>Place order</button>
            <div className="fineprint">By placing this order you agree to our Terms of Service.</div></div>
        </>
      )}

      {/* ---------- ORDER TRACKING ---------- */}
      {screen === "order" && (
        <>
          <TopBar title="Order Tracking" onBack={() => go("home")} variant="track" />
          <div className="scroll">
            <div className="conf"><div className="checkc">✓</div><h2>Order confirmed</h2><p>Your order has been sent to the supplier.</p></div>
            <div className="ordbox"><div className="on">Order #48293</div><div className="od">Placed today</div></div>
            <div className="timeline"><h3>Tracking</h3>
              {[["Order confirmed", "Today, 9:41 AM", true], ["Processing", "Today, 10:15 AM", true],
                ["Shipped", "Expected tomorrow", false], ["Out for delivery", "—", false], ["Delivered", "—", false]
              ].map(([l, d, done], i, a) => (
                <div className={"tstep " + (done ? "done" : "")} key={l}>
                  <div className={"node " + (done ? "done" : "wait")}>{done ? "✓" : ""}</div>
                  <div className="tx"><div className="l">{l}</div><div className="d">{d}</div></div>
                </div>
              ))}
            </div>
            <div className="eta"><span className="l">Estimated delivery</span><span className="d">In 2 days</span></div>
            <div style={{ padding: "0 18px 8px" }}><button className="place" onClick={() => go("home")}>Back to home</button></div>
          </div>
        </>
      )}

      {/* ---------- MACHINE DETAILS ---------- */}
      {screen === "machine" && (
        <>
          <TopBar title="Machine Details" onBack={() => go("home")} right="⋯" />
          <div className="scroll">
            <div className="mhero">🚜</div>
            <div className="mtitle"><div><div className="nm">John Deere 8320R</div><div className="ty">Tractor</div></div>
              <button className="edit" onClick={() => showToast("Edit machine")}>✎ Edit</button></div>
            <div className="tabs">
              {[["overview", "Overview"], ["parts", "Parts"], ["maint", "Maintenance"], ["hist", "History"]].map(([k, l]) => (
                <span key={k} className={"tab " + (mtab === k ? "on" : "")} onClick={() => setMtab(k)}>{l}</span>
              ))}
            </div>

            {mtab === "parts" && (
              <div>
                <div className="msearch">🔍 <input placeholder="Search parts for this machine" /></div>
                <div className="sec" style={{ paddingTop: 16 }}><div className="sec-head"><h2>Common Parts</h2></div></div>
                <div className="plist">
                  {MACHINE_PARTS.map((p) => (
                    <div className="prow" key={p.pn} onClick={() => openPart(p.pn)}>
                      <div className="th">{p.ic}</div>
                      <div className="info"><div className="nm">{p.name}</div><div className="pn">{p.pn}</div></div>
                      <div className="from">From {money(p.from)}</div><span className="chev">›</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "14px 18px 0" }}><a className="link" onClick={() => runSearch("")}>View all parts ›</a></div>
                <div className="sec"><div className="sec-head"><h2>Maintenance Reminders</h2><a onClick={() => setMtab("maint")}>View all</a></div></div>
                <div style={{ padding: "0 18px 18px" }}>
                  {REMINDERS.map((r) => (
                    <div className="rem" key={r.nm}><div className="ic">{r.ic}</div>
                      <div className="info"><div className="nm">{r.nm}</div><div className="due">{r.due}</div></div><span className="chev">›</span></div>
                  ))}
                </div>
              </div>
            )}

            {mtab === "overview" && (
              <div className="mdetail">
                {[["Model", "8320R"], ["Year", "2019"], ["PIN", "1RW8320RKKP123456"], ["Engine hours", "2,453"]].map(([k, v]) => (
                  <div className="mfield" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
                ))}
              </div>
            )}

            {mtab === "maint" && (
              <div>
                <div className="sec" style={{ paddingTop: 16 }}><div className="sec-head"><h2>Maintenance Reminders</h2></div></div>
                <div style={{ padding: "0 18px 18px" }}>
                  {REMINDERS.map((r) => (
                    <div className="rem" key={r.nm}><div className="ic">{r.ic}</div>
                      <div className="info"><div className="nm">{r.nm}</div><div className="due">{r.due}</div></div><span className="chev">›</span></div>
                  ))}
                </div>
              </div>
            )}

            {mtab === "hist" && <div className="empty">No service history logged yet.</div>}
            <div style={{ height: 10 }} />
          </div>
        </>
      )}

      {/* ---------- SCAN ---------- */}
      {screen === "scan" && (
        <div className="scan">
          <TopBar title="Scan Part" onBack={() => go("home")} right="⚡" />
          <div className="viewfinder">
            <div className="frame"><span className="tl" /><span className="tr" /><span className="bl" /><span className="br" /><div className="chip-mid">⚙️</div></div>
            <div className="scan-hint"><div className="h">Position part inside the frame</div><div className="s">We'll find matches for you</div></div>
          </div>
          <div className="scan-ctrl"><div className="b"><span className="ic">🖼</span>Photo Library</div>
            <div className="shutter" onClick={() => runSearch("RE548693")} /><div className="b"><span className="ic">💡</span>Light</div></div>
        </div>
      )}

      {/* ---------- HOW IT WORKS ---------- */}
      {screen === "howitworks" && (
        <>
          <TopBar title="How it works" onBack={() => go("home")} />
          <div className="scroll">
            <div className="hiw-hero"><h2>Four steps, no phone calls</h2><p>From search to delivery, all in one app.</p></div>
            {[["1", "Search", "Search by part number, name, or scan a part with your camera."],
              ["2", "Compare", "We search every supplier and show you the best options, lowest price first."],
              ["3", "Buy", "Choose the best price and place your order securely."],
              ["4", "Shipped", "The supplier ships directly to you. Track your order in the app."]
            ].map(([num, l, d]) => (
              <div className="step" key={num}><div className="num">{num}</div><div className="tx"><div className="l">{l}</div><div className="d">{d}</div></div></div>
            ))}
            <div className="why"><h3>Why PartFinder AG?</h3>
              {["Search every supplier in one place", "Always get the right part", "Real-time pricing and availability", "Order securely in the app", "Suppliers ship directly to you"].map((w) => (
                <div className="w" key={w}><span className="ck">✓</span> {w}</div>
              ))}
            </div>
            <div style={{ padding: "20px 18px" }}><button className="place" onClick={() => go("home")}>Get started</button></div>
          </div>
        </>
      )}

      {/* ---------- ORDERS / ACCOUNT ---------- */}
      {screen === "orders" && (<><TopBar title="Orders" /><div className="scroll"><div className="empty">No orders yet.<br />When you buy a part, your orders and tracking show up here.</div></div></>)}
      {screen === "account" && (<><TopBar title="Account" /><div className="scroll"><div className="empty">Account, saved parts, and addresses live here.<br /><br /><a className="link" onClick={() => go("howitworks")}>How it works ›</a></div></div></>)}

      {/* ---------- BOTTOM NAV ---------- */}
      <nav className="nav">
        {[["home", "🏠", "Home", () => go("home")],
          ["results", "🔍", "Search", () => runSearch("")],
          ["orders", "📋", "Orders", () => go("orders")],
          ["machine", "🚜", "Machines", () => go("machine")],
          ["account", "👤", "Account", () => go("account")]
        ].map(([id, ic, label, fn]) => (
          <div key={id} className={"n " + (navActive === id ? "on" : "")} onClick={fn}><span className="ic">{ic}</span>{label}</div>
        ))}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ---------------- STYLES (move to src/styles.css in the real project) ---------------- */
const CSS = `
:root{
  --ag-green:#2fb04a; --ag-green-dark:#259a3e; --ag-green-soft:rgba(47,176,74,.14);
  --bg:#0f1311; --surface:#181d1a; --surface-2:#1f2521; --border:#2a322d;
  --text:#f3f5f3; --text-muted:#8a938c; --price:#2fb04a; --oem:#f5a623;
  --star:#f5a623; --track:#6c5ce7; --danger:#e0575b;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
.phone{width:100%;max-width:430px;margin:0 auto;min-height:100vh;background:var(--bg);position:relative;
  display:flex;flex-direction:column;overflow:hidden;font-family:'Inter',system-ui,-apple-system,sans-serif;
  color:var(--text);padding-bottom:76px;}
.scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.link{color:var(--ag-green);font-size:13px;font-weight:600;cursor:pointer;}
.demo-flag{position:sticky;top:0;z-index:99;align-self:center;background:var(--surface-2);color:#fff;
  font-size:10px;font-weight:600;letter-spacing:.5px;padding:3px 12px;border-radius:0 0 8px 8px;border:1px solid var(--border);border-top:none;opacity:.9;}
.topbar{display:flex;align-items:center;gap:12px;padding:16px 18px 12px;}
.topbar .back{font-size:24px;color:var(--text);background:none;border:none;cursor:pointer;line-height:1;}
.topbar h1{font-size:17px;font-weight:700;color:var(--text);flex:1;text-align:center;}
.topbar .ic-r{font-size:18px;color:var(--text);opacity:.85;cursor:pointer;}
.topbar .spacer{width:24px;}
.topbar.green{background:var(--ag-green);}
.topbar.green h1,.topbar.green .back{color:#fff;}
.topbar.track{background:linear-gradient(135deg,#6c5ce7,#8b5cf6);}
.topbar.track h1,.topbar.track .back{color:#fff;}
.home-head{padding:18px 18px 6px;}
.brand{display:flex;align-items:center;gap:8px;margin-bottom:3px;}
.brand .logo{color:var(--text);font-weight:900;font-size:21px;letter-spacing:.3px;}
.brand .ag{color:var(--ag-green);font-weight:900;font-size:21px;letter-spacing:.3px;}
.brand .bell{margin-left:auto;color:var(--text);font-size:18px;opacity:.85;}
.tagline{color:var(--text-muted);font-size:12.5px;margin-bottom:16px;}
.searchbar{display:flex;align-items:center;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:0 6px 0 14px;height:50px;}
.searchbar input{flex:1;border:none;outline:none;font-size:14px;font-family:inherit;color:var(--text);background:none;}
.searchbar input::placeholder{color:var(--text-muted);}
.searchbar .go{background:var(--ag-green);border:none;width:40px;height:40px;border-radius:9px;color:#fff;font-size:17px;cursor:pointer;display:grid;place-items:center;}
.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:16px 18px 4px;}
.action{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:15px 8px;text-align:center;cursor:pointer;transition:.12s;}
.action:active{transform:scale(.97);}
.action .ic{font-size:21px;display:block;margin-bottom:7px;}
.action .t{font-size:12px;font-weight:600;color:var(--text);}
.action .s{font-size:10px;color:var(--text-muted);margin-top:2px;display:block;}
.sec{padding:18px 18px 0;}
.sec-head{display:flex;align-items:center;margin-bottom:12px;}
.sec-head h2{font-size:15px;font-weight:700;color:var(--text);}
.sec-head a{margin-left:auto;font-size:12.5px;color:var(--ag-green);font-weight:600;cursor:pointer;}
.mrow{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;}
.mcard{min-width:130px;background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;cursor:pointer;}
.mcard .img{height:80px;background:linear-gradient(135deg,#2a3a2c,#1d2a1f);display:grid;place-items:center;font-size:32px;}
.mcard .meta{padding:9px 11px;}
.mcard .nm{font-size:12.5px;font-weight:700;color:var(--text);}
.mcard .ty{font-size:11px;color:var(--text-muted);}
.cats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.cat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:15px 6px;text-align:center;cursor:pointer;}
.cat:active{transform:scale(.97);}
.cat .ic{font-size:23px;display:block;margin-bottom:7px;}
.cat .t{font-size:11.5px;font-weight:600;color:var(--text);}
.allcat-row{margin:14px 18px 0;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;}
.allcat-row .ic{font-size:20px;}
.allcat-row .t{font-size:13.5px;font-weight:600;color:var(--text);}
.allcat-row .s{font-size:11px;color:var(--text-muted);}
.allcat-row .chev{margin-left:auto;color:var(--text-muted);}
.rec-item{display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:1px solid var(--border);cursor:pointer;}
.rec-item:last-child{border:none;}
.rec-item .ic{color:var(--text-muted);font-size:14px;}
.rec-item .t{font-size:13.5px;color:var(--text);font-weight:500;}
.resbar{padding:12px 18px 4px;}
.resbar .sb{display:flex;align-items:center;background:var(--surface-2);border:1px solid var(--border);border-radius:11px;padding:0 12px;height:46px;gap:8px;}
.resbar .sb .mag{color:var(--text-muted);}
.resbar .sb input{flex:1;border:none;outline:none;font-size:13.5px;font-family:inherit;background:none;color:var(--text);}
.resbar .sb .x{color:var(--text-muted);font-size:18px;cursor:pointer;}
.featured{margin:10px 18px 0;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:13px;display:flex;gap:12px;align-items:center;}
.featured .thumb{width:58px;height:58px;border-radius:10px;background:var(--surface-2);display:grid;place-items:center;font-size:26px;}
.featured .info .nm{font-size:14px;font-weight:700;color:var(--text);}
.featured .info .pn{font-size:11.5px;color:var(--text-muted);}
.featured .info .fits{font-size:10.5px;color:var(--text-muted);margin-top:4px;}
.res-meta{display:flex;align-items:center;justify-content:space-between;padding:14px 18px 6px;}
.res-meta .count{font-size:12.5px;color:var(--text-muted);}
.res-meta .filter{display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--text);background:var(--surface-2);border:1px solid var(--border);padding:6px 11px;border-radius:9px;cursor:pointer;}
.sortrow{display:flex;gap:8px;padding:0 18px 6px;overflow-x:auto;}
.chip{font-size:12px;font-weight:600;padding:7px 13px;border-radius:20px;white-space:nowrap;cursor:pointer;background:var(--surface-2);border:1px solid var(--border);color:var(--text-muted);}
.chip.on{background:var(--ag-green);color:#fff;border-color:var(--ag-green);}
.list{padding:6px 18px 18px;display:flex;flex-direction:column;gap:14px;}
.rcard{background:var(--surface);border:1px solid var(--border);border-radius:15px;padding:15px;cursor:pointer;position:relative;}
.rcard.best{border-color:var(--ag-green);background:linear-gradient(180deg,var(--ag-green-soft),transparent 60%),var(--surface);box-shadow:0 0 0 1px var(--ag-green);}
.best-tag{position:absolute;top:-9px;left:15px;background:var(--ag-green);color:#fff;font-size:10px;font-weight:800;letter-spacing:.5px;padding:3px 10px;border-radius:6px;}
.rtop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.supp .s1{font-size:14.5px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:7px;}
.oem-tag{background:rgba(245,166,35,.16);color:var(--oem);font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:5px;letter-spacing:.4px;}
.supp .rate{font-size:11.5px;color:var(--text-muted);margin-top:4px;}
.supp .rate .stars,.stars{color:var(--star);}
.rprice{text-align:right;}
.rprice .p{font-size:19px;font-weight:800;color:var(--price);}
.rmeta{font-size:11.5px;color:var(--text-muted);margin-top:10px;line-height:1.7;}
.rmeta .in,.in{color:var(--ag-green);font-weight:600;}
.rmeta .dot{opacity:.4;margin:0 5px;}
.rbot{display:flex;align-items:center;justify-content:space-between;margin-top:12px;}
.ships{font-size:11.5px;color:var(--text-muted);}
.buy{background:var(--ag-green);color:#fff;border:none;font-size:13px;font-weight:700;padding:9px 18px;border-radius:9px;cursor:pointer;font-family:inherit;}
.buy:active{background:var(--ag-green-dark);}
.buy.ghost{background:transparent;color:var(--text);border:1px solid var(--border);}
.hero{background:var(--surface-2);height:210px;display:grid;place-items:center;font-size:80px;margin:6px 18px 0;border-radius:16px;}
.dots{display:flex;gap:6px;justify-content:center;margin:12px 0 0;}
.dots i{width:6px;height:6px;border-radius:50%;background:var(--border);}
.dots i.on{background:var(--ag-green);width:18px;border-radius:3px;}
.pd-head{padding:16px 18px 0;}
.pd-head .nm{font-size:21px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.pd-head .pn{font-size:12.5px;color:var(--text-muted);margin-top:5px;}
.vfit{display:inline-flex;align-items:center;gap:3px;font-size:10.5px;font-weight:800;color:var(--ag-green);background:var(--ag-green-soft);padding:3px 8px;border-radius:5px;}
.specrow{display:flex;gap:10px;padding:16px 18px 0;}
.spec{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;}
.spec .v{font-size:15px;font-weight:800;color:var(--text);}
.spec .l{font-size:10.5px;color:var(--text-muted);margin-top:2px;}
.cmp{margin:18px;background:var(--surface);border:1px solid var(--border);border-radius:15px;padding:15px;}
.cmp h3{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;display:flex;align-items:center;}
.cmp h3 a{margin-left:auto;font-size:12px;color:var(--ag-green);}
.crow{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);}
.crow:last-child{border:none;padding-bottom:0;}
.crow .left .s1{font-size:13.5px;font-weight:700;color:var(--text);}
.crow .left .m{font-size:11px;color:var(--text-muted);margin-top:3px;}
.crow .left .bp{color:var(--ag-green);font-weight:700;}
.crow .right{text-align:right;}
.crow .right .p{font-size:16px;font-weight:800;color:var(--price);}
.crow .right .ship{font-size:10px;color:var(--text-muted);}
.cta-bar{position:sticky;bottom:0;display:flex;gap:10px;padding:12px 18px;background:var(--bg);border-top:1px solid var(--border);}
.cta-bar .buy{flex:1;padding:14px;font-size:14.5px;border-radius:12px;}
.block{margin:14px 18px 0;background:var(--surface);border:1px solid var(--border);border-radius:15px;padding:15px;}
.block .bh{display:flex;align-items:center;margin-bottom:10px;}
.block .bh h3{font-size:12.5px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;}
.block .bh a{margin-left:auto;font-size:12px;color:var(--ag-green);font-weight:600;cursor:pointer;}
.osumm{display:flex;gap:12px;align-items:center;}
.osumm .thumb{width:54px;height:54px;border-radius:10px;background:var(--surface-2);display:grid;place-items:center;font-size:24px;}
.osumm .t{flex:1;}
.osumm .t .nm{font-size:14px;font-weight:700;color:var(--text);}
.osumm .t .q{font-size:11.5px;color:var(--text-muted);}
.osumm .pr{font-size:15px;font-weight:800;color:var(--text);}
.divider{height:1px;background:var(--border);margin:12px 0;}
.lrow{display:flex;justify-content:space-between;font-size:13px;padding:6px 0;color:var(--text-muted);}
.lrow span:last-child{color:var(--text);font-weight:500;}
.lrow.tot{font-weight:800;font-size:16px;border-top:1px solid var(--border);margin-top:6px;padding-top:11px;}
.lrow.tot span{color:var(--text);}
.addr{font-size:13px;line-height:1.6;color:var(--text);}
.pay{display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:600;color:var(--text);}
.placebar{position:sticky;bottom:0;padding:12px 18px;background:var(--bg);border-top:1px solid var(--border);}
.place{width:100%;background:var(--ag-green);color:#fff;border:none;font-size:15px;font-weight:700;padding:15px;border-radius:13px;cursor:pointer;font-family:inherit;}
.place:active{background:var(--ag-green-dark);}
.fineprint{text-align:center;font-size:10.5px;color:var(--text-muted);margin-top:8px;}
.conf{text-align:center;padding:30px 18px 10px;}
.checkc{width:66px;height:66px;border-radius:50%;background:var(--ag-green);color:#fff;display:grid;place-items:center;font-size:32px;margin:0 auto 16px;box-shadow:0 0 0 8px var(--ag-green-soft);}
.conf h2{font-size:22px;font-weight:800;color:var(--text);}
.conf p{font-size:13px;color:var(--text-muted);margin-top:6px;}
.ordbox{margin:16px 18px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;}
.ordbox .on{font-size:18px;font-weight:800;color:var(--text);}
.ordbox .od{font-size:11.5px;color:var(--text-muted);margin-top:3px;}
.timeline{margin:0 18px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px;}
.timeline h3{font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:16px;}
.tstep{display:flex;gap:13px;position:relative;padding-bottom:20px;}
.tstep:last-child{padding-bottom:0;}
.tstep .node{width:22px;height:22px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;font-size:12px;z-index:1;}
.tstep .node.done{background:var(--ag-green);color:#fff;}
.tstep .node.wait{background:var(--surface-2);border:2px solid var(--border);}
.tstep::before{content:"";position:absolute;left:10px;top:22px;bottom:0;width:2px;background:var(--border);}
.tstep:last-child::before{display:none;}
.tstep.done::before{background:var(--ag-green);}
.tstep .tx{flex:1;}
.tstep .tx .l{font-size:13.5px;font-weight:600;color:var(--text);}
.tstep .tx .d{font-size:11.5px;color:var(--text-muted);margin-top:1px;}
.eta{margin:16px 18px;display:flex;justify-content:space-between;align-items:center;background:var(--ag-green-soft);border:1px solid var(--border);border-radius:12px;padding:14px 16px;}
.eta .l{font-size:12.5px;color:var(--text);}
.eta .d{font-size:14px;font-weight:800;color:var(--ag-green);}
.mhero{height:190px;margin:6px 18px 0;border-radius:16px;background:linear-gradient(135deg,#2a3a2c,#16201a);display:grid;place-items:center;font-size:70px;}
.mtitle{display:flex;align-items:center;padding:16px 18px 0;}
.mtitle .nm{font-size:20px;font-weight:800;color:var(--text);}
.mtitle .ty{font-size:12px;color:var(--text-muted);margin-top:2px;}
.mtitle .edit{margin-left:auto;background:var(--ag-green-soft);color:var(--ag-green);border:1px solid var(--border);font-size:12px;font-weight:600;padding:7px 16px;border-radius:9px;cursor:pointer;}
.tabs{display:flex;gap:22px;padding:16px 18px 0;border-bottom:1px solid var(--border);margin-top:14px;}
.tab{font-size:13.5px;font-weight:600;color:var(--text-muted);padding-bottom:11px;cursor:pointer;border-bottom:2px solid transparent;}
.tab.on{color:var(--text);border-color:var(--ag-green);}
.msearch{margin:16px 18px 0;display:flex;align-items:center;gap:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:11px;padding:0 12px;height:42px;}
.msearch input{flex:1;border:none;background:none;outline:none;color:var(--text);font-size:13px;font-family:inherit;}
.msearch input::placeholder{color:var(--text-muted);}
.mdetail{margin:16px 18px 0;background:var(--surface);border:1px solid var(--border);border-radius:15px;padding:16px;}
.mfield{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;}
.mfield .k{color:var(--text-muted);}
.mfield .v{font-weight:600;color:var(--text);}
.plist{padding:6px 18px 0;}
.prow{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--border);cursor:pointer;}
.prow:last-child{border:none;}
.prow .th{width:42px;height:42px;border-radius:9px;background:var(--surface-2);display:grid;place-items:center;font-size:19px;}
.prow .info{flex:1;}
.prow .info .nm{font-size:13.5px;font-weight:600;color:var(--text);}
.prow .info .pn{font-size:11px;color:var(--text-muted);margin-top:1px;}
.prow .from{text-align:right;font-size:13px;font-weight:700;color:var(--price);}
.prow .chev{color:var(--text-muted);font-size:16px;}
.rem{display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:13px;margin-bottom:10px;}
.rem .ic{width:38px;height:38px;border-radius:9px;background:var(--surface-2);display:grid;place-items:center;font-size:18px;}
.rem .info{flex:1;}
.rem .info .nm{font-size:13.5px;font-weight:600;color:var(--text);}
.rem .info .due{font-size:11.5px;color:var(--oem);margin-top:2px;font-weight:600;}
.rem .chev{color:var(--text-muted);}
.scan{flex:1;display:flex;flex-direction:column;background:#080a09;}
.viewfinder{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;min-height:360px;}
.frame{width:230px;height:230px;position:relative;}
.frame span{position:absolute;width:34px;height:34px;border:3px solid #fff;}
.frame .tl{top:0;left:0;border-right:none;border-bottom:none;border-radius:6px 0 0 0;}
.frame .tr{top:0;right:0;border-left:none;border-bottom:none;border-radius:0 6px 0 0;}
.frame .bl{bottom:0;left:0;border-right:none;border-top:none;border-radius:0 0 0 6px;}
.frame .br{bottom:0;right:0;border-left:none;border-top:none;border-radius:0 0 6px 0;}
.frame .chip-mid{position:absolute;inset:0;display:grid;place-items:center;font-size:74px;opacity:.45;}
.scan-hint{color:#fff;text-align:center;margin-top:28px;}
.scan-hint .h{font-size:14px;font-weight:600;}
.scan-hint .s{font-size:12px;color:#9a9a9a;margin-top:4px;}
.scan-ctrl{display:flex;align-items:center;justify-content:space-around;padding:24px 30px 34px;}
.scan-ctrl .b{color:#fff;text-align:center;font-size:11px;cursor:pointer;}
.scan-ctrl .b .ic{font-size:24px;display:block;margin-bottom:4px;}
.shutter{width:64px;height:64px;border-radius:50%;background:#fff;border:4px solid var(--ag-green);cursor:pointer;}
.hiw-hero{padding:24px 18px 6px;text-align:center;}
.hiw-hero h2{font-size:22px;font-weight:800;}
.hiw-hero p{font-size:13px;color:var(--text-muted);margin-top:6px;}
.step{display:flex;gap:14px;align-items:flex-start;margin:16px 18px 0;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:15px;}
.step .num{width:30px;height:30px;border-radius:50%;background:var(--ag-green);color:#fff;font-weight:800;font-size:14px;display:grid;place-items:center;flex-shrink:0;}
.step .tx .l{font-size:14px;font-weight:700;color:var(--text);}
.step .tx .d{font-size:12px;color:var(--text-muted);margin-top:3px;line-height:1.5;}
.why{margin:24px 18px 0;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;}
.why h3{font-size:16px;font-weight:800;margin-bottom:14px;}
.why .w{display:flex;align-items:center;gap:11px;padding:8px 0;font-size:13px;color:var(--text);}
.why .w .ck{color:var(--ag-green);font-weight:800;}
.empty{padding:60px 30px;text-align:center;color:var(--text-muted);font-size:13.5px;line-height:1.6;}
.nav{position:sticky;bottom:0;height:66px;background:var(--surface);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-around;}
.nav .n{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;color:var(--text-muted);cursor:pointer;}
.nav .n .ic{font-size:19px;}
.nav .n.on{color:var(--ag-green);font-weight:600;}
.toast{position:fixed;bottom:92px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:500;z-index:200;border:1px solid var(--border);}
`;

// Scrape validated filter cross-references from the *filter-crossreference.com
// network (oil/fuel/air sister sites). For each filter it tries candidate OEM
// brands until one resolves, extracts the /convert/ cross-ref links, drops self,
// and REJECTS over-broad dumps (>80 results = untrustworthy, like Cat 1R-0716).
// Writes a JSON map for crossref_ingest.mjs and prints hits/misses.
//
//   node scripts/scrape_xref.mjs > /tmp/xref.json

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" };
const norm = (s) => String(s || "").toUpperCase().replace(/[\s-]/g, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// site by filter type
const SITE = { oil: "oilfilter-crossreference.com", fuel: "fuelfilter-crossreference.com", air: "airfilter-crossreference.com" };

// candidate OEM brands to try, by part-number pattern
function brands(pn) {
  if (/^P\d/.test(pn)) return ["DONALDSON"];
  if (/^(RE|R\d|DZ|AN|AL|AT)/.test(pn)) return ["JOHN-DEERE"];
  if (/^1R-/.test(pn)) return ["CATERPILLAR"];
  if (/H1$/.test(pn)) return ["INTERNATIONAL", "CASE-IH", "CASE"];
  if (/^84\d{6}/.test(pn)) return ["NEW-HOLLAND", "CASE-IH", "CASE", "FIAT"];
  if (/^A\d{6}/.test(pn)) return ["CASE-IH", "NEW-HOLLAND", "DONALDSON"];
  // unknown OEM numbers (Hagie / Ag-Chem sprayer parts) — long shots
  return ["HAGIE", "AG-CHEM", "AGCO", "DONALDSON", "BALDWIN", "FLEETGUARD", "WIX"];
}

// The filters to cross-reference: [partNumber, type]. (oil RE539279/DZ101884/84485647 already done.)
const FILTERS = [
  ["318215", "oil"], ["318205", "oil"], ["1295155H1", "oil"], ["1R-0716", "oil"],
  ["180412", "fuel"], ["84557704", "fuel"], ["316208", "fuel"], ["316209", "fuel"], ["646062", "fuel"],
  ["RE560672", "fuel"], ["RE570134", "fuel"], ["317562", "fuel"], ["701477", "fuel"], ["P551852", "fuel"], ["P551855", "fuel"],
  ["A171255", "air"], ["A171256", "air"], ["657425", "air"], ["657424", "air"], ["314901", "air"],
  ["AN207713", "air"], ["317355", "air"], ["310093", "air"], ["314542", "air"],
];

async function lookup(pn, type) {
  const site = SITE[type] || SITE.oil;
  for (const brand of brands(pn)) {
    let html;
    try {
      const r = await fetch(`https://www.${site}/convert/${brand}/${encodeURIComponent(pn)}`, { headers: UA });
      if (!r.ok) continue;
      html = await r.text();
    } catch { continue; }
    const links = [...html.matchAll(/\/convert\/([A-Z0-9\-]+)\/([^"\/?<>]+)"[^>]*>([^<]+)</g)];
    const refs = [];
    const seen = new Set();
    for (const m of links) {
      const b = m[1], p = m[2].trim();
      if (norm(p) === norm(pn)) continue;          // self
      const key = norm(b) + "|" + norm(p);
      if (seen.has(key)) continue; seen.add(key);
      refs.push([titlecase(b), p]);
    }
    if (refs.length === 0) continue;               // try next brand
    if (refs.length > 80) return { pn, status: `SUSPECT(${refs.length})`, refs: [] }; // over-broad dump
    return { pn, status: `ok via ${brand} (${refs.length})`, refs };
  }
  return { pn, status: "no cross-ref found", refs: [] };
}

const titlecase = (b) => b.split("-").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join("-");

(async () => {
  const out = {}; const report = [];
  for (const [pn, type] of FILTERS) {
    const r = await lookup(pn, type);
    report.push(`  ${pn.padEnd(12)} ${r.status}`);
    if (r.refs.length) out[pn] = r.refs;
    await sleep(150);
  }
  console.error(report.join("\n"));
  console.error(`\n${Object.keys(out).length}/${FILTERS.length} filters got cross-refs`);
  console.log(JSON.stringify(out, null, 1));
})();

/* Demo Data for EzParts */

export const MACHINES = [
  {
    nm: "John Deere 8320R", ty: "Tractor", ic: "🚜", hp: "320 hp", img: "/machines/jd-8320r.jpg",
    make: "John Deere", model: "8320R", year: "2014–2018",
    manuals: [
      { type: "Operator's Manual", title: "8R Series Operator's Manual", url: "https://www.deere.com/en/parts-and-service/manuals-and-training/" },
      { type: "Parts Catalog", title: "John Deere Parts Catalog", url: "https://partscatalog.deere.com/" },
      { type: "Maintenance", title: "Service & Maintenance Schedule", url: "https://www.deere.com/en/parts-and-service/manuals-and-training/" },
    ],
  },
  {
    nm: "New Holland CR8.90", ty: "Combine", ic: "🌾", hp: "523 hp", img: "/machines/nh-cr890.jpg",
    make: "New Holland", model: "CR8.90", year: "2014–2019",
    manuals: [
      { type: "Operator's Manual", title: "CR Series Operator's Manual", url: "https://www.newholland.com/en-us" },
      { type: "Parts & Service", title: "New Holland Parts & Service", url: "https://www.newholland.com/en-us" },
    ],
  },
  {
    nm: "Case IH Magnum 340", ty: "Tractor", ic: "🚜", hp: "340 hp", img: "/machines/caseih-magnum340.jpg",
    make: "Case IH", model: "Magnum 340", year: "2014–2018",
    manuals: [
      { type: "Operator's Manual", title: "Magnum Operator's Manual", url: "https://www.caseih.com/northamerica/en-us/service-support" },
      { type: "Parts & Service", title: "Case IH Parts & Service", url: "https://www.caseih.com/northamerica/en-us/service-support" },
    ],
  },
  {
    nm: "John Deere 4020", ty: "Tractor", ic: "🚜", hp: "96 hp", img: "/machines/jd-4020.jpg",
    make: "John Deere", model: "4020", year: "1964–1972",
    manuals: [
      { type: "Operator's Manual", title: "4020 Operator's Manual", url: "https://www.deere.com/en/parts-and-service/manuals-and-training/" },
      { type: "Parts Catalog", title: "John Deere Parts Catalog", url: "https://partscatalog.deere.com/" },
    ],
  },
  {
    nm: "John Deere 4440", ty: "Tractor", ic: "🚜", hp: "130 hp", img: "/machines/jd-4440.jpg",
    make: "John Deere", model: "4440", year: "1977–1982",
    manuals: [
      { type: "Operator's Manual", title: "40-Series Operator's Manual", url: "https://www.deere.com/en/parts-and-service/manuals-and-training/" },
      { type: "Parts Catalog", title: "John Deere Parts Catalog", url: "https://partscatalog.deere.com/" },
    ],
  },
  {
    nm: "John Deere S680", ty: "Combine", ic: "🌾", hp: "473 hp", img: "/machines/jd-s680.jpg",
    make: "John Deere", model: "S680", year: "2012–2017",
    manuals: [
      { type: "Operator's Manual", title: "S-Series Operator's Manual", url: "https://www.deere.com/en/parts-and-service/manuals-and-training/" },
      { type: "Parts Catalog", title: "John Deere Parts Catalog", url: "https://partscatalog.deere.com/" },
    ],
  },
];

export const CATS = [
  { t: "Engine", ic: "⚙️" },
  { t: "Hydraulic", ic: "💧" },
  { t: "Electrical", ic: "⚡" },
  { t: "Filters", ic: "🔲" },
  { t: "Belts", ic: "➰" },
  { t: "Bearings", ic: "⭕" },
  { t: "Drivetrain", ic: "🔩" },
  { t: "Cooling", ic: "❄️" },
  { t: "Cab & Body", ic: "🚪" },
];

export const RECENT = [
  "RE509672 engine oil filter",
  "RE587791 air filter",
  "RE573817 hydraulic filter",
];

/* User Farm Location (Demo - Des Moines area) */
export const USER_LOCATION = {
  lat: 41.5868,
  lng: -93.6250,
  name: "Your Farm",
};

export const AVG_FUEL_EFFICIENCY_MPG = 15;
export const CURRENT_GAS_PRICE = 4.25;

/* Supplier Locations */
export const SUPPLIERS_MAP = {
  "Prairie Equipment": {
    lat: 41.5868,
    lng: -93.6250,
    address: "1234 Farm Road, Des Moines, IA 50309",
    phone: "(515) 555-0101",
    hours: "Mon-Fri 8am-5pm",
    website: "https://prairieequipment.com",
  },
  "Greenline Supply": {
    lat: 42.0065,
    lng: -91.6670,
    address: "567 Industrial Blvd, Cedar Rapids, IA 52402",
    phone: "(319) 555-0102",
    hours: "Mon-Sat 8am-6pm",
    website: "https://greenline-supply.com",
  },
  "Agri Parts Central": {
    lat: 42.0115,
    lng: -93.6173,
    address: "890 Highway 30, Ames, IA 50010",
    phone: "(515) 555-0103",
    hours: "Mon-Fri 7am-5pm",
    website: "https://agripartscentral.com",
  },
  "JD Parts Direct": {
    lat: 42.5006,
    lng: -92.3406,
    address: "2890 Crossroads, Waterloo, IA 50704",
    phone: "(319) 555-0104",
    hours: "Mon-Fri 8am-5:30pm",
    website: "https://jdpartsdirect.com",
  },
  "Ag Valley Supply": {
    lat: 42.5006,
    lng: -96.4044,
    address: "4567 Valley Lane, Sioux City, IA 51101",
    phone: "(712) 555-0105",
    hours: "Mon-Sat 8am-4pm",
    website: "https://agvalleysupply.com",
  },
};

// ── Real John Deere 8R Final Tier 4 service parts ────────────────────────────
// Part numbers, fitment, and service intervals are taken from John Deere's
// official "Filter Overview with Service Intervals and Capacities" for the
// 8R FT4 series (8245R–8400R, which includes the 8320R), March 2019. Supplier
// names, prices, and stock levels are illustrative sample data.
const FT4_8R = [
  "John Deere 8245R", "John Deere 8270R", "John Deere 8295R", "John Deere 8320R",
  "John Deere 8335R", "John Deere 8345R", "John Deere 8370R", "John Deere 8400R",
];
const FITS_STR =
  "John Deere 8R Final Tier 4 — 8245R, 8270R, 8295R, 8320R, 8335R, 8345R, 8370R, 8400R";

// One fitment row per machine in the 8R FT4 family (these service parts fit them all).
const fitAll = (position, qty = 1) =>
  FT4_8R.map((m) => ({ machine: m, years: "2014–2018", position, qty, verified: true }));

// Illustrative sellers spread around a base price.
const sellers = (price, ship = 12) => [
  { s: "Prairie Equipment", price, ship, rating: 4.8, n: 230, days: 2, stock: 22 },
  { s: "Agri Parts Central", price: +(price * 1.07).toFixed(2), ship, rating: 4.7, n: 120, days: 2, stock: 14 },
  { s: "JD Parts Direct", price: +(price * 1.13).toFixed(2), ship: ship + 4, rating: 4.8, n: 342, days: 1, stock: 35, oem: true },
];

export const PARTS = {
  RE509672: { name: "Engine Oil Filter", cat: "Filters", ic: "🛢", fits: FITS_STR,
    fitment: fitAll("Engine oil filter — change at 100 h, then every 500 h / annually"), suppliers: sellers(22.5, 9),
    cross: [{ brand: "Donaldson", pn: "P550938" }, { brand: "Baldwin", pn: "P7233" }, { brand: "Fleetguard", pn: "LF16043" }, { brand: "WIX", pn: "51370" }, { brand: "NAPA", pn: "1370" }] },
  RE539465: { name: "Primary Fuel Filter", cat: "Filters", ic: "⛽", fits: FITS_STR,
    fitment: fitAll("Primary fuel filter — replace with final filter, 500 h / annually"), suppliers: sellers(38, 9),
    cross: [{ brand: "Baldwin", pn: "BF9866-O" }, { brand: "Fleetguard", pn: "FS1091" }, { brand: "WIX", pn: "33969" }, { brand: "Mann", pn: "WK11030X" }] },
  RE533910: { name: "Final Fuel Filter", cat: "Filters", ic: "⛽", fits: FITS_STR,
    fitment: fitAll("Final fuel filter — replace with primary filter, 500 h / annually"), suppliers: sellers(34, 9),
    cross: [{ brand: "Baldwin", pn: "BF9917" }] },
  RE587791: { name: "Primary Air Filter", cat: "Filters", ic: "🔲", fits: FITS_STR,
    fitment: fitAll("Primary engine air filter (TSN 110760– ) — 1000 h / annually"), suppliers: sellers(84, 14),
    cross: [{ brand: "Donaldson", pn: "P635443" }, { brand: "Hifi", pn: "SA16987" }, { brand: "John Deere (alt)", pn: "RE580337" }] },
  RE587792: { name: "Secondary Air Filter", cat: "Filters", ic: "🔲", fits: FITS_STR,
    fitment: fitAll("Secondary engine air filter (TSN 110760– ) — every 2nd primary change"), suppliers: sellers(52, 12) },
  RE587793: { name: "Primary Air Filter (early)", cat: "Filters", ic: "🔲", fits: FITS_STR,
    fitment: fitAll("Primary engine air filter (TSN 090001–110759) — 1000 h / annually"), suppliers: sellers(82, 14),
    cross: [{ brand: "WIX", pn: "49203" }, { brand: "Mann", pn: "C31021" }, { brand: "Luber-finer", pn: "LAF5354" }, { brand: "Hengst", pn: "E1720L" }] },
  RE587794: { name: "Secondary Air Filter (early)", cat: "Filters", ic: "🔲", fits: FITS_STR,
    fitment: fitAll("Secondary engine air filter (TSN 090001–110759) — every 2nd primary change"), suppliers: sellers(50, 12) },
  RE573817: { name: "Hydraulic / Transmission Oil Filter", cat: "Hydraulic", ic: "🔧", fits: FITS_STR,
    fitment: fitAll("Hydraulic/transmission (Hy-Gard) oil filter — every 1500 h"), suppliers: sellers(58, 12),
    cross: [{ brand: "Donaldson", pn: "P580316" }, { brand: "Baldwin", pn: "HY80072" }] },
  RE269061: { name: "SCV Oil Filter", cat: "Hydraulic", ic: "🔧", fits: FITS_STR,
    fitment: fitAll("Selective Control Valve (SCV) oil filter"), suppliers: sellers(24, 9) },
  RE284091: { name: "Cab Fresh Air Filter", cat: "Cab & Body", ic: "🚪", fits: "John Deere 8R FT4 tractors AND S-Series combines",
    fitment: [
      ...fitAll("Cab fresh air filter — 1000 h / annually"),
      { machine: "John Deere S680", years: "2012–2017", position: "Cab fresh air filter — clean/replace 50 h", qty: 1, verified: true },
    ],
    suppliers: sellers(46, 10) },
  RE291412: { name: "Cab Recirculation Air Filter", cat: "Cab & Body", ic: "🚪", fits: FITS_STR,
    fitment: fitAll("Cab recirculation air filter — 1000 h / annually"), suppliers: sellers(44, 10) },
  N378886: { name: "Fuel / Water Separator Filter", cat: "Filters", ic: "💧", fits: FITS_STR,
    fitment: fitAll("Fuel/water separator filter (if equipped)"), suppliers: sellers(29, 9) },
  AL204884: { name: "Air Brake Air Dryer Filter", cat: "Filters", ic: "🛞", fits: FITS_STR,
    fitment: fitAll("Trailer air brake air dryer filter (if equipped) — annually"), suppliers: sellers(68, 12) },

  // ── John Deere 4020 (New Generation era) service parts ──────────────────────
  // Real part numbers from public JD parts listings; these famously fit a broad
  // range of 1960s–70s tractors. Prices/stock are illustrative.
  AR26350: { name: "Engine Oil Filter", cat: "Filters", ic: "🛢", fits: "John Deere 4020, 3020, 4000, 4010, 4230 (gas & diesel)",
    fitment: [
      { machine: "John Deere 4020", years: "1964–1972", position: "Engine oil filter (gas & diesel)", qty: 1, verified: true },
      { machine: "John Deere 3020", years: "1964–1972", position: "Engine oil filter", qty: 1, verified: true },
      { machine: "John Deere 4000", years: "1969–1972", position: "Engine oil filter", qty: 1, verified: true },
      { machine: "John Deere 4010", years: "1960–1963", position: "Engine oil filter", qty: 1, verified: true },
      { machine: "John Deere 4230", years: "1973–1977", position: "Engine oil filter", qty: 1, verified: true },
    ],
    suppliers: sellers(11.5, 8) },
  AR44077: { name: "Fuel Filter (Diesel)", cat: "Filters", ic: "⛽", fits: "John Deere 3010, 3020, 4000, 4010, 4020, 4520 (diesel)",
    fitment: [
      { machine: "John Deere 4020", years: "1964–1972", position: "Diesel fuel filter element", qty: 1, verified: true },
      { machine: "John Deere 3020", years: "1964–1972", position: "Diesel fuel filter element", qty: 1, verified: true },
      { machine: "John Deere 4000", years: "1969–1972", position: "Diesel fuel filter element", qty: 1, verified: true },
      { machine: "John Deere 4010", years: "1960–1963", position: "Diesel fuel filter element", qty: 1, verified: true },
    ],
    suppliers: sellers(9.5, 8),
    cross: [{ brand: "WIX", pn: "33143" }, { brand: "Fleetguard", pn: "FF130" }, { brand: "Baldwin", pn: "PF814" }, { brand: "Donaldson", pn: "P551748" }, { brand: "Fram", pn: "C1168PL" }] },
  AH69798: { name: "Air Filter", cat: "Filters", ic: "🔲", fits: "John Deere 3020, 4000, 4020, 450",
    fitment: [
      { machine: "John Deere 4020", years: "1964–1972", position: "Engine air filter element", qty: 1, verified: true },
      { machine: "John Deere 3020", years: "1964–1972", position: "Engine air filter element", qty: 1, verified: true },
      { machine: "John Deere 4000", years: "1969–1972", position: "Engine air filter element", qty: 1, verified: true },
    ],
    suppliers: sellers(34, 10) },
  AR75603: { name: "Hydraulic Filter Element", cat: "Hydraulic", ic: "🔧", fits: "John Deere 4020 and New Generation series",
    fitment: [
      { machine: "John Deere 4020", years: "1964–1972", position: "Hydraulic/transmission filter element", qty: 1, verified: true },
      { machine: "John Deere 3020", years: "1964–1972", position: "Hydraulic/transmission filter element", qty: 1, verified: true },
    ],
    suppliers: sellers(18, 9) },

  // ── Case IH Magnum 340 (CNH, FPT Cursor 9) service parts ────────────────────
  // Real OEM part numbers from public Case IH parts listings. Several CNH filters
  // cross to New Holland T8 tractors. Prices/stock illustrative.
  "84283691": { name: "Fuel Filter", cat: "Filters", ic: "⛽", fits: "Case IH Magnum 310/340/380; New Holland T8.410/T8.435",
    fitment: [
      { machine: "Case IH Magnum 340", years: "2014–2018", position: "Engine fuel filter", qty: 1, verified: true },
      { machine: "Case IH Magnum 310", years: "2014–2018", position: "Engine fuel filter", qty: 1, verified: true },
      { machine: "New Holland T8.410", years: "2014–2018", position: "Engine fuel filter", qty: 1, verified: true },
    ],
    suppliers: sellers(28, 10) },
  "5801659560": { name: "Air Filter (Outer)", cat: "Filters", ic: "🔲", fits: "Case IH Magnum 310/340 and Magnum series",
    fitment: [
      { machine: "Case IH Magnum 340", years: "2014–2018", position: "Primary engine air filter", qty: 1, verified: true },
      { machine: "Case IH Magnum 310", years: "2014–2018", position: "Primary engine air filter", qty: 1, verified: true },
    ],
    suppliers: sellers(78, 14) },
  "84487937": { name: "Hydraulic / Transmission Filter", cat: "Hydraulic", ic: "🔧", fits: "Case IH Magnum series",
    fitment: [
      { machine: "Case IH Magnum 340", years: "2014–2018", position: "Hydraulic/transmission oil filter", qty: 1, verified: true },
    ],
    suppliers: sellers(62, 12) },
  "87267363": { name: "Cab Air Filter", cat: "Cab & Body", ic: "🚪", fits: "Case IH Magnum 310/340",
    fitment: [
      { machine: "Case IH Magnum 340", years: "2014–2018", position: "Cab air filter", qty: 1, verified: true },
      { machine: "Case IH Magnum 310", years: "2014–2018", position: "Cab air filter", qty: 1, verified: true },
    ],
    suppliers: sellers(40, 10) },
  "1907539": { name: "Fuel / Water Separator Filter", cat: "Filters", ic: "💧", fits: "Case IH Magnum (FPT/Iveco engine)",
    fitment: [
      { machine: "Case IH Magnum 340", years: "2014–2018", position: "Fuel/water separator filter", qty: 1, verified: true },
    ],
    suppliers: sellers(26, 9) },

  // ── John Deere 4440 (40-Series "Iron Horse") service parts ──────────────────
  // Real part numbers from JD's 40-Series filter overview and public listings.
  AR43261: { name: "Engine Oil Filter", cat: "Filters", ic: "🛢", fits: "John Deere 4040, 4230, 4240, 4430, 4440, 4630",
    fitment: [
      { machine: "John Deere 4440", years: "1977–1982", position: "Engine oil filter (spin-on)", qty: 1, verified: true },
      { machine: "John Deere 4040", years: "1977–1982", position: "Engine oil filter (spin-on)", qty: 1, verified: true },
      { machine: "John Deere 4240", years: "1977–1982", position: "Engine oil filter (spin-on)", qty: 1, verified: true },
      { machine: "John Deere 4640", years: "1978–1982", position: "Engine oil filter (spin-on)", qty: 1, verified: true },
    ],
    suppliers: sellers(12.5, 8),
    cross: [{ brand: "Baldwin", pn: "BT287" }, { brand: "WIX", pn: "51758" }, { brand: "Fram", pn: "PH47" }, { brand: "Case", pn: "A57857" }] },
  AR79679: { name: "Primary Air Filter", cat: "Filters", ic: "🔲", fits: "John Deere 40-Series (4040–4840)",
    fitment: [
      { machine: "John Deere 4440", years: "1977–1982", position: "Primary engine air filter", qty: 1, verified: true },
      { machine: "John Deere 4240", years: "1977–1982", position: "Primary engine air filter", qty: 1, verified: true },
      { machine: "John Deere 4640", years: "1978–1982", position: "Primary engine air filter", qty: 1, verified: true },
    ],
    suppliers: sellers(38, 11) },
  AR79680: { name: "Secondary Air Filter", cat: "Filters", ic: "🔲", fits: "John Deere 40-Series (4040–4840)",
    fitment: [
      { machine: "John Deere 4440", years: "1977–1982", position: "Secondary engine air filter", qty: 1, verified: true },
      { machine: "John Deere 4240", years: "1977–1982", position: "Secondary engine air filter", qty: 1, verified: true },
    ],
    suppliers: sellers(22, 9) },
  AR50041: { name: "Fuel / Water Separator Filter", cat: "Filters", ic: "💧", fits: "John Deere 4020, 4040, 4440 and others",
    fitment: [
      { machine: "John Deere 4440", years: "1977–1982", position: "Fuel/water separator element", qty: 1, verified: true },
      { machine: "John Deere 4240", years: "1977–1982", position: "Fuel/water separator element", qty: 1, verified: true },
    ],
    suppliers: sellers(10.5, 8) },
  AR94510: { name: "Transmission / Hydraulic Oil Filter", cat: "Hydraulic", ic: "🔧", fits: "John Deere 40-Series (2WD), 25 micron",
    fitment: [
      { machine: "John Deere 4440", years: "1977–1982", position: "Transmission/hydraulic oil filter (2WD, 25 micron)", qty: 1, verified: true },
      { machine: "John Deere 4240", years: "1977–1982", position: "Transmission/hydraulic oil filter (2WD, 25 micron)", qty: 1, verified: true },
    ],
    suppliers: sellers(24, 9) },

  // ── New Holland CR8.90 combine (CNH) service parts ──────────────────────────
  "84217229": { name: "Air Filter", cat: "Filters", ic: "🔲", fits: "New Holland CR8.90 / CR9.90 combines",
    fitment: [
      { machine: "New Holland CR8.90", years: "2014–2019", position: "Primary engine air filter", qty: 1, verified: true },
    ],
    suppliers: sellers(86, 16) },
  "84228488": { name: "Engine Oil Filter", cat: "Filters", ic: "🛢", fits: "New Holland CR combines and CNH equipment",
    fitment: [
      { machine: "New Holland CR8.90", years: "2014–2019", position: "Engine oil filter", qty: 1, verified: true },
    ],
    suppliers: sellers(24, 10) },

  // ── John Deere S680 combine service parts ───────────────────────────────────
  // From JD's official S-Series filter overview (S550–S690). The cab filter
  // RE284091 is shared with the 8R FT4 tractors (see its fitment below).
  RE572785: { name: "Engine Oil Filter", cat: "Filters", ic: "🛢", fits: "John Deere S680, S690 combines",
    fitment: [
      { machine: "John Deere S680", years: "2012–2017", position: "Engine oil filter (Plus-50 II)", qty: 1, verified: true },
    ],
    suppliers: sellers(28, 12) },
  HXE11090: { name: "Primary Air Filter", cat: "Filters", ic: "🔲", fits: "John Deere S660–S690 combines",
    fitment: [
      { machine: "John Deere S680", years: "2012–2017", position: "Primary engine air filter — clean/replace 400 h", qty: 1, verified: true },
    ],
    suppliers: sellers(96, 16) },
  HXE11091: { name: "Secondary Air Filter", cat: "Filters", ic: "🔲", fits: "John Deere S660–S690 combines",
    fitment: [
      { machine: "John Deere S680", years: "2012–2017", position: "Secondary engine air filter — change with primary", qty: 1, verified: true },
    ],
    suppliers: sellers(58, 13) },
  RE532952: { name: "Primary Fuel Filter (Tier 2)", cat: "Filters", ic: "⛽", fits: "John Deere S680–S690 combines (Tier 2)",
    fitment: [
      { machine: "John Deere S680", years: "2012–2017", position: "Primary fuel filter — every 400 h", qty: 1, verified: true },
    ],
    suppliers: sellers(34, 10) },
  RE525523: { name: "Final Fuel Filter (Tier 2)", cat: "Filters", ic: "⛽", fits: "John Deere S660–S690 combines (Tier 2)",
    fitment: [
      { machine: "John Deere S680", years: "2012–2017", position: "Final fuel filter — every 400 h", qty: 1, verified: true },
    ],
    suppliers: sellers(30, 10) },
  R502778: { name: "Fuel / Water Separator Pre-Filter", cat: "Filters", ic: "💧", fits: "John Deere S660–S690 combines",
    fitment: [
      { machine: "John Deere S680", years: "2012–2017", position: "Fuel/water separator pre-filter (standard)", qty: 1, verified: true },
    ],
    suppliers: sellers(22, 9) },
  AXE12964: { name: "Hydraulic Reservoir Filter", cat: "Hydraulic", ic: "🔧", fits: "John Deere S680, S690 (closed center)",
    fitment: [
      { machine: "John Deere S680", years: "2012–2017", position: "Hydraulic filter in reservoir (closed center) — 400 h", qty: 1, verified: true },
    ],
    suppliers: sellers(64, 13) },
  AN207368: { name: "Hydrostatic Charge Filter", cat: "Hydraulic", ic: "🔧", fits: "John Deere S680, S690 (closed center)",
    fitment: [
      { machine: "John Deere S680", years: "2012–2017", position: "Hydrostatic charge filter — every 400 h", qty: 1, verified: true },
    ],
    suppliers: sellers(46, 12) },
  AH128449: { name: "ProDrive / Hydraulic Case Filter", cat: "Hydraulic", ic: "🔧", fits: "John Deere S670, S680, S690 combines",
    fitment: [
      { machine: "John Deere S680", years: "2012–2017", position: "ProDrive filter — first 100 h, then 400 h", qty: 1, verified: true },
    ],
    suppliers: sellers(52, 12) },
};

export const MACHINE_PARTS = [
  { pn: "RE548693", name: "Hydraulic Pump", ic: "🔧", from: 389.0 },
  { pn: "P606860", name: "Air Filter", ic: "🔲", from: 45.75 },
  { pn: "8PK2610", name: "Serpentine Belt", ic: "➰", from: 32.1 },
  { pn: "RE54782", name: "Fuel Filter", ic: "⛽", from: 18.5 },
  { pn: "RE12345", name: "Alternator", ic: "🔋", from: 275.0 },
];

// Reverse fitment: every part that fits a given machine, with how it's used.
// Derived from each part's `fitment` list — the mirror of the Used-On lookup.
export function partsForMachine(machineName) {
  const out = [];
  for (const [pn, part] of Object.entries(PARTS)) {
    const fit = (part.fitment || []).find((f) => f.machine === machineName);
    if (!fit) continue;
    out.push({
      pn,
      name: part.name,
      ic: part.ic,
      cat: part.cat,
      position: fit.position,
      qty: fit.qty,
      years: fit.years,
      verified: fit.verified,
      from: Math.min(...part.suppliers.map((s) => s.price)),
    });
  }
  return out;
}

// ── Serial-number resolution ("never the wrong part") ────────────────────────
// Some parts change at a serial break — same model, different correct part.
// Real example: the 8R FT4 engine air filters switch at TSN 110760.
const FT4_AIR_RULES = [
  { role: "Primary Air Filter", brk: 110760, below: "RE587793", atOrAbove: "RE587791" },
  { role: "Secondary Air Filter", brk: 110760, below: "RE587794", atOrAbove: "RE587792" },
];
const SERIAL_BREAKS = Object.fromEntries(FT4_8R.map((m) => [m, FT4_AIR_RULES]));

export const hasSerialBreaks = (machineName) => Boolean(SERIAL_BREAKS[machineName]);

// Pull the production sequence number out of a serial / PIN (last digit group).
export function serialSequence(serial) {
  const groups = (serial || "").match(/\d+/g);
  if (!groups || !groups.length) return null;
  return parseInt(groups[groups.length - 1], 10);
}

// Given a machine + serial, return the exact part for each serial-dependent role.
export function resolveExactParts(machineName, serial) {
  const seq = serialSequence(serial);
  if (seq == null) return { error: "Enter a serial / PIN that includes the production number." };
  const rules = SERIAL_BREAKS[machineName] || [];
  const parts = rules.map((r) => {
    const pn = seq >= r.brk ? r.atOrAbove : r.below;
    return {
      role: r.role,
      pn,
      name: PARTS[pn]?.name || r.role,
      range: seq >= r.brk ? `TSN ${r.brk} and up` : `TSN up to ${r.brk - 1}`,
    };
  });
  return { seq, parts };
}

export const REMINDERS = [
  { ic: "🛢", nm: "Engine Oil Change", due: "Due in 25 hours" },
  { ic: "💧", nm: "Hydraulic Filter Change", due: "Due in 56 hours" },
  { ic: "🔲", nm: "Air Filter Check", due: "Due in 10 hours" },
];

/* Helper Functions */
export const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

export const stars = (r) => {
  const f = Math.round(r);
  return "★★★★★".slice(0, f) + "☆☆☆☆☆".slice(0, 5 - f);
};

/* Calculate distance between two lat/lng coordinates (miles) */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
};

export const calculateGasCost = (
  distanceMiles,
  mpg = AVG_FUEL_EFFICIENCY_MPG,
  gasPrice = CURRENT_GAS_PRICE,
  roundTrip = true
) => {
  const tripMultiplier = roundTrip ? 2 : 1;
  const gallons = (distanceMiles * tripMultiplier) / mpg;
  return Math.round(gallons * gasPrice * 100) / 100;
};

/* Get suppliers sorted by distance */
export const getSuppliersByDistance = (userLat, userLng) => {
  return Object.entries(SUPPLIERS_MAP)
    .map(([name, location]) => ({
      name,
      ...location,
      distance: calculateDistance(userLat, userLng, location.lat, location.lng),
      gasCost: calculateGasCost(calculateDistance(userLat, userLng, location.lat, location.lng)),
    }))
    .sort((a, b) => a.distance - b.distance);
};

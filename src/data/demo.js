/* Demo Data for EzParts */

export const MACHINES = [
  {
    nm: "John Deere 8320R", ty: "Tractor", ic: "🚜", hp: "320 hp", img: "/machines/jd-8320r.jpg",
    make: "John Deere", model: "8320R", year: "2011–2015",
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
  "RE548693 hydraulic pump",
  "Air filter Donaldson P606860",
  "Serpentine belt 8PK2610",
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

export const PARTS = {
  RE548693: {
    name: "Hydraulic Pump",
    cat: "Hydraulic",
    ic: "🔧",
    fits: "John Deere 8295R, 8320R, 8345R, 8370R",
    stock: 14,
    // Where-used: every machine this part fits, and how.
    fitment: [
      { machine: "John Deere 8295R", years: "2011–2015", position: "Main hydraulic pump (PowrReverser)", qty: 1, verified: true },
      { machine: "John Deere 8320R", years: "2011–2015", position: "Main hydraulic pump (PowrReverser)", qty: 1, verified: true },
      { machine: "John Deere 8345R", years: "2011–2015", position: "Main hydraulic pump (PowrReverser)", qty: 1, verified: true },
      { machine: "John Deere 8370R", years: "2012–2015", position: "Main hydraulic pump (PowrReverser)", qty: 1, verified: true },
    ],
    suppliers: [
      { s: "Prairie Equipment", price: 389, ship: 25, rating: 4.8, n: 230, days: 2, stock: 14 },
      { s: "Greenline Supply", price: 412, ship: 25, rating: 4.6, n: 95, days: 1, stock: 3 },
      { s: "Agri Parts Central", price: 425, ship: 28, rating: 4.7, n: 120, days: 2, stock: 8 },
      { s: "JD Parts Direct", price: 445, ship: 30, rating: 4.8, n: 342, days: 1, stock: 12, oem: true },
    ],
  },
  P606860: {
    name: "Air Filter (Donaldson)",
    cat: "Filters",
    ic: "🔲",
    fits: "John Deere 8R series, S-Series combines; cross-fits multiple makes",
    stock: 40,
    fitment: [
      { machine: "John Deere 8320R", years: "2011–2015", position: "Primary engine air filter", qty: 1, verified: true },
      { machine: "John Deere 8345R", years: "2011–2015", position: "Primary engine air filter", qty: 1, verified: true },
      { machine: "John Deere S670 Combine", years: "2012–2017", position: "Primary engine air filter", qty: 1, verified: true },
      { machine: "Case IH Magnum 340", years: "2014–2018", position: "Primary engine air filter", qty: 1, verified: false },
      { machine: "New Holland CR8.90", years: "2014–2019", position: "Primary engine air filter", qty: 1, verified: false },
    ],
    suppliers: [
      { s: "Prairie Equipment", price: 45.75, ship: 9, rating: 4.8, n: 230, days: 2, stock: 40 },
      { s: "Agri Parts Central", price: 49, ship: 9, rating: 4.7, n: 120, days: 2, stock: 25 },
    ],
  },
  "8PK2610": {
    name: "Serpentine Belt",
    cat: "Belts",
    ic: "➰",
    fits: "Case IH Magnum 290, 310, 340",
    stock: 18,
    fitment: [
      { machine: "Case IH Magnum 290", years: "2014–2018", position: "Serpentine drive belt", qty: 1, verified: true },
      { machine: "Case IH Magnum 310", years: "2014–2018", position: "Serpentine drive belt", qty: 1, verified: true },
      { machine: "Case IH Magnum 340", years: "2014–2018", position: "Serpentine drive belt", qty: 1, verified: true },
    ],
    suppliers: [
      { s: "Ag Valley Supply", price: 32.1, ship: 10, rating: 4.8, n: 86, days: 3, stock: 18 },
      { s: "Greenline Supply", price: 36, ship: 12, rating: 4.6, n: 95, days: 3, stock: 6 },
    ],
  },
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

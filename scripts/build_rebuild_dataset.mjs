// Content track -> normalized rebuild dataset. Reads researched hero-machine parts and emits
// JSON per proposed table into catalogs/rebuild/. No DB writes. See catalogs/rebuild/README.md.
import { readFileSync, writeFileSync } from "node:fs";

const parts = JSON.parse(readFileSync(new URL("../catalogs/machines/parts_load.json", import.meta.url), "utf8"));
const OUT = new URL("../catalogs/rebuild/", import.meta.url);
// correct machine_type from the researched machine catalog (deep parts files omit it)
const typeByModel = {};
for (const m of JSON.parse(readFileSync(new URL("../catalogs/machines/machines_research.json", import.meta.url), "utf8")))
  typeByModel[`${m.make}|${m.model}`] = m.type;

const slug = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const norm = (s) => String(s || "").toUpperCase().replace(/[\s-]/g, "");
const splitRefs = (s) => String(s || "").split(/[,/;]+/).map((x) => x.trim()).filter(Boolean);

// category -> {system, subsystem}
const TAX = {
  "Filters":{s:"Maintenance & Filtration",sub:"Filters"}, "Belts":{s:"Drivetrain",sub:"Belts"},
  "Bearings":{s:"Bearings & Bushings",sub:"Bearings"}, "Hydraulics":{s:"Hydraulics",sub:"Hydraulic Components"},
  "Electrical":{s:"Electrical",sub:"Electrical Components"}, "Engine":{s:"Engine",sub:"Engine Components"},
  "Cooling":{s:"Cooling",sub:"Cooling Components"}, "Fuel System":{s:"Fuel System",sub:"Fuel Components"},
  "Seals & Gaskets":{s:"Seals & Gaskets",sub:"Seals & Gaskets"}, "Drivetrain":{s:"Drivetrain",sub:"Drivetrain Components"},
  "Steering":{s:"Steering",sub:"Steering Components"}, "Brakes":{s:"Brakes",sub:"Brake Components"},
  "PTO":{s:"Power Take-Off",sub:"PTO Components"}, "Lighting":{s:"Electrical",sub:"Lighting"},
  "Cab & Body":{s:"Cab & Body",sub:"Cab & Body"}, "Hardware":{s:"Hardware & Fasteners",sub:"Hardware"},
  "Tires & Wheels":{s:"Wheels & Tires",sub:"Wheels & Tires"}, "Chains":{s:"Drivetrain",sub:"Chains"},
  "Augers/Elevators":{s:"Grain Handling",sub:"Augers & Elevators"}, "Concave/Threshing":{s:"Threshing & Separation",sub:"Concaves & Grates"},
  "Cutting/Blades":{s:"Cutting",sub:"Blades & Knives"},
};

const manufacturers = new Map(), types = new Set(), models = new Map(), variants = new Map();
const taxNodes = new Map(), partsOut = new Map(), partNumbers = [], partTax = [], fitments = [], rels = [];

function addMfr(name){ const sl=slug(name); if(!manufacturers.has(sl)) manufacturers.set(sl,{slug:sl,canonical_name:name}); return sl; }
function addTax(cat){
  const t=TAX[cat]||{s:"Uncategorized",sub:"Uncategorized"};
  const sSlug=slug(t.s), subSlug=`${sSlug}--${slug(t.sub)}`;
  if(!taxNodes.has(sSlug)) taxNodes.set(sSlug,{slug:sSlug,level:"system",parent_slug:null,canonical_name:t.s});
  if(!taxNodes.has(subSlug)) taxNodes.set(subSlug,{slug:subSlug,level:"subsystem",parent_slug:sSlug,canonical_name:t.sub});
  return subSlug;
}

for (const p of parts) {
  const oemMfr = addMfr(p.machine_make);                 // machine's OEM brand
  const issuer = p.is_oem === false ? (p.brand || "aftermarket") : (p.brand || p.machine_make);
  const issuerSlug = addMfr(issuer);
  const mtype = typeByModel[`${p.machine_make}|${p.machine_model}`] || p.machine_type || "Tractor"; types.add(mtype);
  const modelCode = p.machine_model;
  const mKey = `${oemMfr}|${modelCode}`;
  if(!models.has(mKey)) models.set(mKey,{manufacturer_slug:oemMfr,machine_type:mtype,model_code:modelCode,display_name:`${p.machine_make} ${modelCode}`});
  const vKey = `${mKey}|base`;
  if(!variants.has(vKey)) variants.set(vKey,{model_code:modelCode,variant_code:"base",display_name:`${p.machine_make} ${modelCode}`});

  const nn = norm(p.part_number);
  const partKey = `${issuerSlug}:${nn}`;
  if(!partsOut.has(partKey)){
    partsOut.set(partKey,{part_key:partKey,canonical_name:p.name||p.part_number,part_kind:p.category||"Other",lifecycle_status:"active"});
    partNumbers.push({part_key:partKey,issuer_manufacturer_slug:issuerSlug,number:p.part_number,normalized_number:nn,number_type:p.is_oem===false?"aftermarket":"OEM",is_primary:true});
    partTax.push({part_key:partKey,taxonomy_slug:addTax(p.category),is_primary:true});
  }
  fitments.push({part_key:partKey,model_code:modelCode,variant_code:"base",assembly_status:"unresolved",source:"ezparts-research",verification_status:"researched"});
  // aftermarket -> OEM equivalence (split comma/slash lists), fixing the single-string bug
  if(p.is_oem===false && p.oem_crossref){
    for(const ref of splitRefs(p.oem_crossref)){
      if(norm(ref)===nn) continue;
      rels.push({from_part_key:partKey,to_number_normalized:norm(ref),to_issuer_slug:oemMfr,relationship_type:"equivalent",source:"ezparts-research",confidence:0.7});
    }
  }
}

const w=(name,arr)=>{writeFileSync(new URL(name,OUT),JSON.stringify(arr,null,0));return arr.length;};
const counts={
  manufacturers:w("manufacturers.json",[...manufacturers.values()]),
  machine_types:w("machine_types.json",[...types].map(t=>({canonical_name:t}))),
  machine_models:w("machine_models.json",[...models.values()]),
  model_variants:w("model_variants.json",[...variants.values()]),
  taxonomy_nodes:w("taxonomy_nodes.json",[...taxNodes.values()]),
  parts:w("parts.json",[...partsOut.values()]),
  part_numbers:w("part_numbers.json",partNumbers),
  part_taxonomy:w("part_taxonomy.json",partTax),
  fitments:w("fitments.json",fitments),
  part_relationships:w("part_relationships.json",rels),
};
console.log("Normalized rebuild dataset written to catalogs/rebuild/:");
for(const [k,v] of Object.entries(counts)) console.log(`  ${String(v).padStart(5)}  ${k}`);

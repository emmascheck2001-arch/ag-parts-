// Bootstrap dealer supply so the marketplace has real sellers + prices.
// Run AFTER DEALER_INVENTORY_SCHEMA.sql. Idempotent (upserts).
//
//   node --env-file=.env scripts/seed_dealers.mjs
//   (or: export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ; node scripts/seed_dealers.mjs)
//
// These are DEMO dealers (no real Stripe accounts) — they make the storefront
// functional end-to-end. Replace with real onboarded dealers for live payouts.
import { readFileSync, existsSync } from "node:fs";
(function loadEnv(f=".env"){ if(!existsSync(f))return; for(const l of readFileSync(f,"utf8").split("\n")){ const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2]; } })();

const URL=process.env.SUPABASE_URL, SVC=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!URL||!SVC){ console.error("Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const h={ apikey:SVC, Authorization:"Bearer "+SVC, "Content-Type":"application/json" };
const hash=s=>{ let x=0; for(const c of String(s)) x=(x*31+c.charCodeAt(0))>>>0; return x; };

async function req(method,path,body,prefer){
  const r=await fetch(URL+path,{method,headers:prefer?{...h,Prefer:prefer}:h,body:body!=null?JSON.stringify(body):undefined});
  const t=await r.text(); if(!r.ok) throw new Error(r.status+" "+t); return t?JSON.parse(t):null;
}

const DEALERS=[
  { name:"Prairie Equipment", city:"Carrington", state:"ND", lat:47.45, lng:-99.13, rating:4.8, status:"active" },
  { name:"Agri Parts Central", city:"Saskatoon", state:"SK", lat:52.13, lng:-106.67, rating:4.7, status:"active" },
  { name:"Midwest Ag Supply",  city:"Fargo",     state:"ND", lat:46.88, lng:-96.79, rating:4.6, status:"active" },
];

const dealerIds=[];
for(const d of DEALERS){
  const row=await req("POST","/rest/v1/dealers?on_conflict=name&select=id",d,"resolution=merge-duplicates,return=representation");
  dealerIds.push(row[0].id);
}
console.log("dealers:",dealerIds.length);

// Pull filter/consumable parts from the index (the high-demand reorder items).
let parts=[],from=0;
while(true){
  const b=await req("GET",`/rest/v1/parts?select=pn_norm,part_number,name,category&limit=1000&offset=${from}`);
  if(!b||!b.length) break; parts=parts.concat(b); if(b.length<1000) break; from+=1000;
}
const consumable=parts.filter(p=>/filter|belt|oil|fuel|air|hydraulic/i.test((p.category||"")+" "+(p.name||""))).slice(0,800);
console.log("consumable parts to stock:", consumable.length);

let rows=[];
for(const p of consumable){
  const base=12+(hash(p.pn_norm)%90); // deterministic price $12–$101
  const n=1+(hash(p.pn_norm)%DEALERS.length); // 1–3 dealers carry it
  for(let i=0;i<n;i++){
    const did=dealerIds[(hash(p.pn_norm)+i)%dealerIds.length];
    rows.push({ dealer_id:did, pn_norm:p.pn_norm, part_number:p.part_number, name:p.name,
      price:+(base*(1+i*0.06)).toFixed(2), ship:9+(hash(p.pn_norm)%8), stock:1+(hash(p.pn_norm+i)%25), lead_days:1+(hash(p.pn_norm)%4), active:true });
  }
}
// dedupe (dealer_id, pn_norm)
const seen=new Set(); rows=rows.filter(r=>{const k=r.dealer_id+"|"+r.pn_norm; if(seen.has(k))return false; seen.add(k); return true;});
let n=0;
for(let i=0;i<rows.length;i+=200){ await req("POST","/rest/v1/inventory?on_conflict=dealer_id,pn_norm",rows.slice(i,i+200),"resolution=merge-duplicates,return=minimal"); n+=rows.slice(i,i+200).length; }
console.log("inventory rows written:",n);
const cnt=await req("GET","/rest/v1/inventory?select=count",null,"count=exact");
console.log("inventory total:",cnt[0].count);

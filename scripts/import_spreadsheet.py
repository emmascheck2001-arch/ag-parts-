#!/usr/bin/env python3
"""
Generic manufacturer PARTS SPREADSHEET importer for EzParts.
Drop in ANY manufacturer's CSV/Excel parts export and load parts + fitment +
PRICE into Supabase. Auto-detects columns; override with flags if needed.

This is the real pipeline: when a manufacturer sends their spreadsheet, run this.

Usage:
  # preview what it will do (no writes):
  python3 scripts/import_spreadsheet.py FILE --manufacturer "Redekop" --dry
  # load it:
  python3 scripts/import_spreadsheet.py FILE --manufacturer "Redekop"
  # if there's no per-row model column, set the fitment for the whole file:
  python3 scripts/import_spreadsheet.py FILE --manufacturer "X" --make "John Deere" --model "S780"
  # force a column mapping (0-based index or header name):
  ... --col-part "Part No" --col-desc Description --col-price "List Price" --col-model "Fits"

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""
import os, re, sys, json, argparse, urllib.request

norm = lambda s: re.sub(r'[\s-]', '', str(s or '').upper())

# header keyword -> canonical field (first match wins, checked in order)
HEADER_HINTS = [
    ('part',   ['part number','part no','part #','partnum','part_no','partno','item number','sku','part','item','number']),
    ('price',  ['list price','msrp','retail','dealer price','unit price','price','cost','list']),
    ('desc',   ['description','desc','name','title','part name']),
    ('qty',    ['qty','quantity','qty per','per unit']),
    ('model',  ['model','fits','fitment','application','applications','combine','machine','models','fits models']),
    ('make',   ['make','brand','oem make']),
    ('cat',    ['category','type','group','assembly','section']),
    ('cross',  ['cross','supersede','supersedes','replaces','oem number','oem #','interchange']),
]

def detect(headers):
    hl = [str(h or '').strip().lower() for h in headers]
    picked = {}
    for field, kws in HEADER_HINTS:
        for kw in kws:
            for i,h in enumerate(hl):
                if i in picked.values(): continue
                if h == kw or kw in h:
                    picked[field] = i; break
            if field in picked: break
    return picked

def read_rows(path):
    if path.lower().endswith(('.xlsx','.xlsm')):
        import openpyxl
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb.active
        rows = [[c for c in r] for r in ws.iter_rows(values_only=True)]
    else:
        import csv
        with open(path, newline='', encoding='utf-8-sig', errors='ignore') as f:
            rows = list(csv.reader(f))
    rows = [r for r in rows if any(str(c).strip() for c in r)]   # drop blank rows
    return rows[0], rows[1:]

def col_override(val, headers):
    if val is None: return None
    if val.isdigit(): return int(val)
    hl=[str(h or '').strip().lower() for h in headers]
    v=val.strip().lower()
    return hl.index(v) if v in hl else None

# ---- Supabase ----
def req(method, path, body=None, prefer=None):
    U=os.environ['SUPABASE_URL']; K=os.environ['SUPABASE_SERVICE_ROLE_KEY']
    h={'apikey':K,'Authorization':'Bearer '+K,'Content-Type':'application/json'}
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(U+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw=resp.read().decode(); return json.loads(raw) if raw else None

def categorize(d):
    d=(d or '').lower()
    if 'filter' in d: return 'Filters'
    if any(k in d for k in('blade','knife','paddle')): return 'Blades'
    if 'belt' in d: return 'Belts'
    if 'bearing' in d: return 'Bearings'
    if any(k in d for k in('seal','o-ring','gasket')): return 'Seals'
    if any(k in d for k in('bolt','nut','screw','washer','pin')): return 'Hardware'
    if any(k in d for k in('hose','hyd','fitting')): return 'Hydraulics'
    if any(k in d for k in('switch','sensor','wire','harness','light')): return 'Electrical'
    return 'Other'

def price_of(v):
    if v is None: return None
    m=re.search(r'\d+(?:\.\d+)?', str(v).replace(',',''))
    return float(m.group(0)) if m else None

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('file')
    ap.add_argument('--manufacturer', required=True, help='seller name shown as the price source')
    ap.add_argument('--make'); ap.add_argument('--model')  # fallback fitment when no model column
    ap.add_argument('--col-part'); ap.add_argument('--col-desc'); ap.add_argument('--col-price')
    ap.add_argument('--col-model'); ap.add_argument('--col-qty'); ap.add_argument('--col-make')
    ap.add_argument('--dry', action='store_true')
    a=ap.parse_args()

    headers, rows = read_rows(a.file)
    m = detect(headers)
    for f,flag in [('part',a.col_part),('desc',a.col_desc),('price',a.col_price),
                   ('model',a.col_model),('qty',a.col_qty),('make',a.col_make)]:
        o=col_override(flag, headers)
        if o is not None: m[f]=o
    if 'part' not in m:
        print('!! Could not find a part-number column. Headers:', headers)
        print('   Re-run with --col-part "<header or index>"'); sys.exit(1)

    print('DETECTED COLUMNS:')
    for f in ['part','desc','price','qty','model','make','cat','cross']:
        if f in m: print(f'   {f:6s} -> col[{m[f]}] "{headers[m[f]]}"')
    def cell(r,f):
        i=m.get(f); return r[i] if (i is not None and i < len(r)) else None

    parts={}; fitplan={}; priced=0
    for r in rows:
        pn=str(cell(r,'part') or '').strip()
        if not pn or not re.search(r'\d', pn): continue
        name=str(cell(r,'desc') or pn).strip()[:80]
        parts[pn]={'name':name,'price':price_of(cell(r,'price')),
                   'qty':int(re.sub(r'\D','',str(cell(r,'qty') or '1')) or 1)}
        if parts[pn]['price'] is not None: priced+=1
        # fitment: per-row model(s) split on , / ; | else the --make/--model fallback
        mv=str(cell(r,'model') or '').strip()
        mk=str(cell(r,'make') or a.make or a.manufacturer).strip()
        models=[x.strip() for x in re.split(r'[;,/|]', mv) if x.strip()] or ([a.model] if a.model else [])
        for md in models:
            fitplan.setdefault((mk,md),set()).add(pn)

    print(f'\nROWS: {len(rows)} | parts: {len(parts)} | with price: {priced} '
          f'| machines: {len(fitplan)}')
    ex=list(parts.items())[:4]
    for pn,v in ex: print(f'   e.g. {pn:16s} ${v["price"]}  {v["name"][:40]}')
    if a.dry: print('\nDRY RUN — no writes.'); return
    if not fitplan and not a.model:
        print('\n!! No model/fitment found and no --model given. Parts would load with NO machine link.')
        print('   Add --make/--model or a model column, or re-run to load parts-only.');
    # 1) parts
    idn={}; items=list(parts.items())
    for i in range(0,len(items),200):
        chunk=[{'part_number':pn[:40],'pn_norm':norm(pn),'name':v['name'],'category':categorize(v['name'])} for pn,v in items[i:i+200]]
        for row in req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm',chunk,'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']]=row['id']
    # 2) fitments
    total_fit=0
    for (mk,md),pns in fitplan.items():
        mid=req('POST','/rest/v1/machines?on_conflict=make,model&select=id',{'make':mk,'model':md,'type':'Combine'},'resolution=merge-duplicates,return=representation')[0]['id']
        rws=[{'machine_id':mid,'part_id':idn.get(norm(pn)),'position':None,'qty':parts[pn]['qty'],'verified':True,'source':'sheet/'+a.manufacturer,'confidence':1.0} for pn in pns]
        rws=[x for x in rws if x['part_id']]
        for i in range(0,len(rws),200):
            req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',rws[i:i+200],'resolution=ignore-duplicates,return=minimal')
        total_fit+=len(rws)
    # 3) prices -> one "dealer" = the manufacturer, inventory rows carry the price
    n_price=0
    if priced:
        d=req('POST','/rest/v1/dealers?on_conflict=name&select=id',{'name':a.manufacturer+' (list price)','status':'catalog'},'resolution=merge-duplicates,return=representation')
        did=d[0]['id']
        inv=[{'dealer_id':did,'pn_norm':norm(pn),'part_number':pn[:40],'price':v['price'],'stock':0,'active':True} for pn,v in parts.items() if v['price'] is not None]
        for i in range(0,len(inv),200):
            req('POST','/rest/v1/inventory?on_conflict=dealer_id,pn_norm',inv[i:i+200],'resolution=merge-duplicates,return=minimal')
        n_price=len(inv)
    print(f'\nDONE: {len(parts)} parts, {total_fit} fitments, {n_price} prices loaded for {a.manufacturer}.')

if __name__=='__main__':
    main()

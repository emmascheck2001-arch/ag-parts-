#!/usr/bin/env python3
"""
Load ALL Redekop crop-residue parts (MAV straw chopper, SCU, rotors, blades) from
their online parts-manual portal (cms.strawchopper.com) into Supabase.

Redekop manuals are exploded-diagram PDFs whose text layer still carries a real
BOM row per part:  <balloon#> <PART NO> <DESCRIPTION> <QTY>   (part# first, qty last)
— a different column order than the Hagie-style loader, so it needs its own regex.

Fitment: Redekop parts fit a COMBINE. make comes from the portal folder; the model
is read from the PDF cover (e.g. "JD S7", "CR/CX", "Lexion 7/8") or falls back to the
folder leaf. Parts are attached to that combine so a combine owner finds them.

Usage:
  python3 scripts/load_redekop.py --dry      # parse everything, print, NO writes
  python3 scripts/load_redekop.py            # parse + write to Supabase

Manifest: /tmp/redekop_pdfs.json  ({"pdfs": {url: folder_path}})  (from crawl_redekop.py)
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   Requires: pypdf
"""
import os, re, sys, json, ssl, urllib.request, urllib.parse

DRY = '--dry' in sys.argv
CTX = ssl.create_default_context(); CTX.check_hostname=False; CTX.verify_mode=ssl.CERT_NONE

# BOM row:  <balloon> <PARTNO> <DESC ...> <QTY>   and checklist:  <PARTNO>  <DESC>
ROW = re.compile(r'^\s*(\d{1,3})\s+([A-Z][A-Z0-9][A-Z0-9\-]{2,})\s+(.+?)\s+(\d{1,3})\s*$')
CHK = re.compile(r'^([A-Z][A-Z0-9][A-Z0-9\-]{2,})\s{2,}([A-Za-z].+\S)\s*$')
# Older-manual table (no balloon):  <PARTNO> <DESC ...> <QTY> [notes]
TBL_HDR = re.compile(r'part\s*#.*descrip.*quant', re.I)
TBL = re.compile(r'^([A-Z]{1,4}\d[A-Z0-9\-]*)\s+([A-Za-z].+?)\s+(\d{1,3})(?:\s.*)?$')

def norm(pn): return re.sub(r'[\s-]', '', pn.upper())

def categorize(d):
    d=d.lower()
    if 'filter' in d: return 'Filters'
    if any(k in d for k in ('blade','knife','paddle','flail')): return 'Blades'
    if 'belt' in d: return 'Belts'
    if 'bearing' in d: return 'Bearings'
    if any(k in d for k in ('seal','o-ring','gasket')): return 'Seals'
    if any(k in d for k in ('bolt','nut','screw','washer','clamp','pin','rivet')): return 'Hardware'
    if any(k in d for k in ('hose','fit','ftg','hyd')): return 'Hydraulics'
    if any(k in d for k in ('switch','sensor','wire','harness','light','decal')): return 'Electrical'
    if any(k in d for k in ('rotor','vane','housing','floor','shroud','sidewall','tailboard','hood')): return 'Chopper Body'
    return 'Other'

def parse_pdf(path):
    from pypdf import PdfReader
    parts={}; in_table=False
    for page in PdfReader(path).pages:
        for ln in (page.extract_text() or '').split('\n'):
            s=ln.rstrip()
            if TBL_HDR.search(s): in_table=True; continue     # older-manual parts table starts
            m=ROW.match(s)
            if m and re.search(r'\d', m.group(2)) and len(m.group(2))>=4:
                pn=m.group(2)
                parts.setdefault(pn, {'name':m.group(3).strip()[:80],
                                      'qty':int(m.group(4)) if m.group(4).isdigit() else 1})
                continue
            if in_table:
                t=TBL.match(s)
                if t and len(t.group(1))>=4:
                    parts.setdefault(t.group(1), {'name':t.group(2).strip()[:80],
                                                  'qty':int(t.group(3)) if t.group(3).isdigit() else 1})
                    continue
            c=CHK.match(s)
            if c and re.search(r'\d', c.group(1)) and len(c.group(1))>=4:
                parts.setdefault(c.group(1), {'name':c.group(2).strip()[:80],'qty':1})
    return parts

def cover_model(path, make):
    from pypdf import PdfReader
    try: txt = (PdfReader(path).pages[0].extract_text() or '')
    except Exception: return None
    for pat in [r'JD\s*S7\w*', r'S[- ]?Series', r'S7\b', r'CR/CX', r'\bCR\d+', r'\bCX\d+',
                r'Lexion\s*[\d/]+', r'Axial[- ]?Flow', r'\b[5-9]\d{3}\b', r'X9\d*',
                r'\b\d0/\d0\b', r'\b1000\b', r'\b2000\b']:
        m=re.search(pat, txt, re.I)
        if m: return m.group(0).upper().replace('  ',' ').strip()
    return None

MAKE_MAP = [('john deere','John Deere'),('case','Case IH'),('new holland','New Holland'),
            ('lexion','CLAAS Lexion'),('cat','CLAAS Lexion'),
            ('massey','AGCO'),('gleaner','AGCO'),('challenger','AGCO')]
def make_from_folder(folder):
    f=folder.lower().replace('+',' ')
    for k,v in MAKE_MAP:
        if k in f: return v
    return 'Redekop'   # base chopper / options / older-generic

def folder_leaf(folder):
    return folder.rstrip('/').split('/')[-1].replace('+',' ')

# ---- Supabase REST ----
def _req(method, path, body=None, prefer=None):
    URL=os.environ['SUPABASE_URL']; SVC=os.environ['SUPABASE_SERVICE_ROLE_KEY']
    h={'apikey':SVC,'Authorization':'Bearer '+SVC,'Content-Type':'application/json'}
    if prefer: h['Prefer']=prefer
    data=json.dumps(body).encode() if body is not None else None
    r=urllib.request.Request(URL+path, data=data, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw=resp.read().decode(); return json.loads(raw) if raw else None

def upsert_machine(make, model):
    d=_req('POST','/rest/v1/machines?on_conflict=make,model&select=id',
           {'make':make,'model':model,'type':'Combine'},
           'resolution=merge-duplicates,return=representation')
    return d[0]['id']

def download(url):
    fn=re.sub(r'[^A-Za-z0-9._-]','_', url.split('/')[-1])
    local='/tmp/rkpdfs/'+fn                       # reuse pre-downloaded file if present
    if os.path.exists(local) and os.path.getsize(local) > 2000:
        return local
    dst='/tmp/rk_'+re.sub(r'\W+','_',url.split('/')[-1])[:60]
    url=url.replace('://strawchopper.com/quadrant','://cms.strawchopper.com/quadrant')  # media served here
    url=urllib.parse.quote(url, safe=':/?&=%#')  # encode spaces in folder-path URLs
    rq=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    open(dst,'wb').write(urllib.request.urlopen(rq, timeout=60, context=CTX).read())
    return dst

def main():
    manifest=json.load(open('/tmp/redekop_pdfs.json'))['pdfs']
    all_parts={}; fit_plan=[]; totals={'pdf':0,'parsed':0,'skipped':0}
    for url, folder in sorted(manifest.items(), key=lambda x:x[1]):
        make=make_from_folder(folder)
        try: path=download(url)
        except Exception as e: print('  !! download fail', url.split('/')[-1], e); continue
        totals['pdf']+=1
        try:
            parts=parse_pdf(path)
        except Exception as e:
            totals['skipped']+=1; print(f'  !! parse fail  {url.split("/")[-1]}: {e}'); continue
        if not parts:
            totals['skipped']+=1
            print(f'  --  0 parts  [{make} / {folder_leaf(folder)}]  {url.split("/")[-1]} (price list / scan?)')
            continue
        model=cover_model(path, make) or folder_leaf(folder)
        model=f'{model} (Redekop MAV)' if make!='Redekop' else folder_leaf(folder)
        totals['parsed']+=1
        for pn,v in parts.items(): all_parts[pn]=v
        fit_plan.append((make, model, list(parts.keys())))
        print(f'  ok  {len(parts):3d} parts  [{make} / {model}]  {url.split("/")[-1]}')
    uniq=len(all_parts); fits=sum(len(p) for _,_,p in fit_plan)
    print(f'\n=== {totals["pdf"]} PDFs | {totals["parsed"]} parsed, {totals["skipped"]} empty '
          f'| {uniq} unique parts | {fits} fitment rows | {len(set((m,md) for m,md,_ in fit_plan))} machines ===')
    if DRY:
        print('DRY RUN — no writes.'); return
    # write parts
    print('Writing parts...'); id_by_norm={}
    items=list(all_parts.items())
    for i in range(0,len(items),200):
        chunk=[{'part_number':pn,'pn_norm':norm(pn),'name':v['name'],'category':categorize(v['name'])}
               for pn,v in items[i:i+200]]
        d=_req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm', chunk,
               'resolution=merge-duplicates,return=representation')
        for row in d or []: id_by_norm[row['pn_norm']]=row['id']
    # write machines + fitments
    print('Writing machines + fitments...'); total_fit=0
    for make,model,pns in fit_plan:
        mid=upsert_machine(make, model)
        rows=[{'machine_id':mid,'part_id':id_by_norm.get(norm(pn)),'position':None,'qty':all_parts[pn]['qty'],
               'verified':False,'source':'redekop/strawchopper.com','confidence':0.85} for pn in pns]
        rows=[r for r in rows if r['part_id']]
        for i in range(0,len(rows),200):
            _req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',
                 rows[i:i+200],'resolution=ignore-duplicates,return=minimal')
        total_fit+=len(rows)
    print(f'DONE: {uniq} parts, {total_fit} fitments across {len(fit_plan)} manuals.')

if __name__=='__main__':
    main()

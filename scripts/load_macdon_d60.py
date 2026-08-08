#!/usr/bin/env python3
"""
Load EVERY part from MacDon's official D50/D60/FD70 parts catalog into EzParts,
attached to machine "MacDon D60" (draper header). No prices.

Catalog PDF: MacDon D50/D60/FD70 Parts Catalog (form 169008). Clean text layer,
rows look like:  [ref] 125138  SUPPORT - ENDSHIELD LH .......... 1
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   Requires: pypdf
Usage: python3 scripts/load_macdon_d60.py <catalog.pdf> [--dry]
"""
import os, re, sys, json, urllib.request
from pypdf import PdfReader

DRY = '--dry' in sys.argv
_args = [a for a in sys.argv[1:] if not a.startswith('--')]
PDF = _args[0]
MODEL = _args[1] if len(_args) > 1 else "D60"   # MacDon model, e.g. D65, FD75
norm = lambda s: re.sub(r'[\s-]', '', str(s).upper())

# MacDon part rows come in three shapes; we union all three so nothing is dropped:
#   "1 125138  SUPPORT - ENDSHIELD LH ...... 1"   (numeric/no ref + spaces)
#   "H 184712  WASHER-FENDER M10 ZP"              (letter ref — the hardware appendix)
#   "135340 – BOLT hex 5/8 ..."                   (dash-separated description)
# part# is 5- or 6-digit; description must start with a letter (excludes serials/qty).
# ref (balloon #) can be a number, letters, or number+letter (e.g. 12, H, 15A, 9d, dd, vv)
REF = r'(?:[0-9]{1,3}[A-Za-z]{0,2}\s+|[A-Za-z]{1,2}\s+)?'
PATS = [
    re.compile(rf'^\s*{REF}(\d{{5,6}})\s+([A-Za-z][A-Za-z0-9].{{1,}}?)(?:\s*[.]{{2,}}.*)?$'),
    re.compile(rf'^\s*{REF}(\d{{5,6}})\s*[–-]\s*([A-Za-z].{{1,}}?)(?:\s*[.]{{2,}}.*)?$'),
]
SERIAL_LINE = re.compile(r'used on machines|serial number|^\s*example:|form #|part #\s*\d|revision', re.I)

def categorize(d):
    d=d.lower()
    if any(k in d for k in('knife','blade','section','guard','sickle')): return 'Knife/Cutting'
    if any(k in d for k in('draper','belt')): return 'Draper/Belt'
    if any(k in d for k in('reel','bat','tine','cam')): return 'Reel'
    if 'bearing' in d: return 'Bearings'
    if any(k in d for k in('seal','o-ring','gasket')): return 'Seals'
    if any(k in d for k in('bolt','nut','screw','washer','pin','clamp')): return 'Hardware'
    if any(k in d for k in('hose','hyd','valve','cylinder','fitting')): return 'Hydraulics'
    if any(k in d for k in('sensor','switch','harness','wire','light')): return 'Electrical'
    if any(k in d for k in('sprocket','chain','pulley','gear','shaft')): return 'Drive'
    if any(k in d for k in('shield','endshield','guard panel','support','weldment','tube','frame')): return 'Frame/Shields'
    return 'Other'

def parse(path):
    reader = PdfReader(path)
    pages = [(p.extract_text() or '') for p in reader.pages]
    # Auto-detect footer/form numbers: any 5-6 digit token that appears on a large
    # share of pages is a page footer / catalog form number, not a part. Exclude it.
    from collections import Counter
    pagehits = Counter()
    for txt in pages:
        for t in set(re.findall(r'(?<!\d)(\d{5,6})(?!\d)', txt)):
            pagehits[t] += 1
    npages = max(1, len(pages))
    FOOTER = {t for t, n in pagehits.items() if n / npages > 0.20}
    parts={}
    for txt in pages:
        for ln in txt.split('\n'):
            s=ln.rstrip()
            if SERIAL_LINE.search(s): continue        # exclude serial-range / form notes
            for pat in PATS:
                m=pat.match(s)
                if not m or m.group(1) in FOOTER: continue
                desc=re.sub(r'\s*[.]{2,}.*$','',m.group(2))            # drop dot-leader + trailer
                desc=re.sub(r'\s+\d{1,3}(\s+\d{5,6})?\s*$','',desc)    # drop trailing qty (+ ref part#)
                desc=desc.strip(' .-–')[:80]
                if len(re.sub(r'[^A-Za-z]','',desc))<3: continue
                parts.setdefault(m.group(1), desc)
    return parts

def req(method, path, body=None, prefer=None):
    U=os.environ['SUPABASE_URL']; K=os.environ['SUPABASE_SERVICE_ROLE_KEY']
    h={'apikey':K,'Authorization':'Bearer '+K,'Content-Type':'application/json'}
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(U+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw=resp.read().decode(); return json.loads(raw) if raw else None

def main():
    parts=parse(PDF)
    print(f'Parsed {len(parts)} unique MacDon {MODEL} parts.')
    for pn,d in list(parts.items())[:8]: print('  ',pn,d[:50])
    if DRY: print('DRY — no writes.'); return
    idn={}; items=list(parts.items())
    for i in range(0,len(items),200):
        chunk=[{'part_number':pn,'pn_norm':norm(pn),'name':d,'category':categorize(d)} for pn,d in items[i:i+200]]
        for row in req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm',chunk,'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']]=row['id']
    mid=req('POST','/rest/v1/machines?on_conflict=make,model&select=id',
            {'make':'MacDon','model':MODEL,'type':'Header'},'resolution=merge-duplicates,return=representation')[0]['id']
    rows=[{'machine_id':mid,'part_id':idn.get(norm(pn)),'position':None,'qty':1,'verified':True,
           'source':'macdon-official/169008','confidence':1.0} for pn in parts]
    rows=[r for r in rows if r['part_id']]
    for i in range(0,len(rows),200):
        req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',rows[i:i+200],'resolution=ignore-duplicates,return=minimal')
    print(f'DONE: {len(parts)} parts -> MacDon {MODEL} ({len(rows)} fitments).')

if __name__=='__main__':
    main()

#!/usr/bin/env python3
"""
Load a Woods rotary-cutter parts manual (text-layer PDF) into EzParts.
Woods parts tables are multi-column: one ref row can list several part-number
variants (Left Wing / Right Wing / Center 540 / Center 1000 rpm) that all share
ONE description at the end of the line, e.g.:
    3 2 39411 39411 39411 39411 Bearing
    2 1 603867 603867* 57316 57316 Gear, crown
We pull EVERY distinct part number from each row and map it to that row's
trailing description. "NS" columns (not serviced) are ignored.
Usage: python3 scripts/load_woods.py <pdf_url_or_path> "<Model>" ["<Type>"]
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   Requires: pypdf
"""
import os, re, sys, json, urllib.request
from pypdf import PdfReader

_args=[a for a in sys.argv[1:] if not a.startswith('--')]
SRC, MODEL = _args[0], _args[1]
MTYPE = _args[2] if len(_args)>2 else 'Rotary Cutter'
DRY = '--dry' in sys.argv
norm=lambda s: re.sub(r'[\s-]','',str(s).upper())

# Woods part number: opt 1-2 letter prefix, 5-7 digits, opt suffix (RP/KT/LH/RH),
# opt trailing * (footnote). Must be >=5 digits so ref/qty ints don't match.
PN = re.compile(r'\b([A-Z]{0,2}\d{5,7}(?:RP|KT|LH|RH)?)\*?')
SKIP = re.compile(r'table of contents|www\.|reserves the right|warranty|torque values|copyright', re.I)

def cat(d):
    d=d.lower()
    if any(k in d for k in('blade','knife','cutting edge')): return 'Blades'
    if 'bearing' in d: return 'Bearings'
    if 'gearbox' in d or 'gear,' in d or 'gear ' in d or 'pinion' in d: return 'Gearbox'
    if any(k in d for k in('bolt','nut','washer','pin','capscrew','screw','snap ring','cotter')): return 'Hardware'
    if any(k in d for k in('seal','o-ring','gasket','shim')): return 'Seals'
    if any(k in d for k in('shaft','yoke','driveline','pto','u-joint','spindle','clutch')): return 'Driveline'
    if 'decal' in d: return 'Decals'
    if any(k in d for k in('hose','hyd','cylinder')): return 'Hydraulics'
    if any(k in d for k in('tire','wheel','hub','axle')): return 'Wheels/Axle'
    return 'Other'

def parse(path):
    parts={}
    for p in PdfReader(path).pages:
        t=p.extract_text() or ''
        if 'REF' not in t.upper() and 'DESCRIPTION' not in t.upper(): continue
        for ln in t.split('\n'):
            s=ln.rstrip()
            if SKIP.search(s): continue
            matches=list(PN.finditer(s))
            if not matches: continue
            # description = trailing text after the last part number, minus qty ints
            desc=s[matches[-1].end():].strip(' .*-')
            desc=re.sub(r'^\d{1,3}\s+','',desc).strip(' .*-')  # drop trailing-column qty
            # if nothing trails the last PN, the desc may precede (rare) -> skip noise
            if len(re.sub(r'[^A-Za-z]','',desc))<3: continue
            pns={m.group(1) for m in matches if m.group(1)!='NS'}
            for pn in pns:
                # ignore all-digit tokens that are really a manual/form number line
                parts.setdefault(pn, desc[:80])
    return parts

def req(method, path, body=None, prefer=None):
    U=os.environ['SUPABASE_URL']; K=os.environ['SUPABASE_SERVICE_ROLE_KEY']
    h={'apikey':K,'Authorization':'Bearer '+K,'Content-Type':'application/json'}
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(U+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw=resp.read().decode(); return json.loads(raw) if raw else None

def get_pdf(src):
    if src.startswith('http'):
        p='/tmp/woods_'+re.sub(r'\W+','_',src.split('/')[-1])[:50]
        open(p,'wb').write(urllib.request.urlopen(urllib.request.Request(src,headers={'User-Agent':'Mozilla/5.0'}),timeout=90).read())
        return p
    return src

def main():
    parts=parse(get_pdf(SRC))
    print(f'Parsed {len(parts)} Woods {MODEL} parts.')
    for pn,d in list(parts.items())[:8]: print('  ',pn,d[:45])
    if DRY or not parts: return
    idn={}; items=list(parts.items())
    for i in range(0,len(items),200):
        chunk=[{'part_number':pn,'pn_norm':norm(pn),'name':d,'category':cat(d)} for pn,d in items[i:i+200]]
        for row in req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm',chunk,'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']]=row['id']
    mid=req('POST','/rest/v1/machines?on_conflict=make,model&select=id',{'make':'Woods','model':MODEL,'type':MTYPE},'resolution=merge-duplicates,return=representation')[0]['id']
    rows=[{'machine_id':mid,'part_id':idn.get(norm(pn)),'position':None,'qty':1,'verified':True,'source':'woods-official','confidence':1.0} for pn in parts]
    rows=[r for r in rows if r['part_id']]
    for i in range(0,len(rows),200):
        req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',rows[i:i+200],'resolution=ignore-duplicates,return=minimal')
    print(f'DONE: Woods {MODEL} — {len(parts)} parts, {len(rows)} fitments.')

if __name__=='__main__':
    main()

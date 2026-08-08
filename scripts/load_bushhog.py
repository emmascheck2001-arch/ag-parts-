#!/usr/bin/env python3
"""
Load a Bush Hog parts manual (text-layer PDF from bushhog.com) into EzParts.
Rows look like:  4 87340 Decal, Important 1   (ref  part#  description  qty)
Part numbers are 5-8 digits, sometimes with a letter suffix (44315BH).
Usage: python3 scripts/load_bushhog.py <pdf_url_or_path> "<Model>" ["<Type>"]
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   Requires: pypdf
"""
import os, re, sys, json, urllib.request
from pypdf import PdfReader

_args=[a for a in sys.argv[1:] if not a.startswith('--')]
SRC, MODEL = _args[0], _args[1]
MTYPE = _args[2] if len(_args)>2 else 'Rotary Cutter'
DRY = '--dry' in sys.argv
norm=lambda s: re.sub(r'[\s-]','',str(s).upper())

# [ref] <PART#> <DESCRIPTION> <QTY>   part# = 5-8 digits (+ opt letters); qty at end
ROW = re.compile(r'^\s*(?:\d{1,3}\s+)?(\d{5,8}[A-Z]{0,3})\s+([A-Za-z(].+?)\s+(\d{1,3})\s*$')
SKIP = re.compile(r'parts section|purchase order|serial number|\.{4,}|reserves the right|griffin ave|alamo group', re.I)

def cat(d):
    d=d.lower()
    if any(k in d for k in('blade','knife')): return 'Blades'
    if 'bearing' in d: return 'Bearings'
    if 'gearbox' in d or 'gear' in d: return 'Gearbox'
    if any(k in d for k in('bolt','nut','washer','pin','capscrew','screw')): return 'Hardware'
    if any(k in d for k in('seal','o-ring','gasket')): return 'Seals'
    if any(k in d for k in('shaft','yoke','driveline','pto','u-joint','spindle')): return 'Driveline'
    if 'decal' in d: return 'Decals'
    if any(k in d for k in('hose','hyd','cylinder')): return 'Hydraulics'
    if any(k in d for k in('tire','wheel','hub','axle')): return 'Wheels/Axle'
    return 'Other'

def parse(path):
    parts={}
    for p in PdfReader(path).pages:
        for ln in (p.extract_text() or '').split('\n'):
            s=ln.rstrip()
            if SKIP.search(s): continue
            m=ROW.match(s)
            if not m: continue
            pn=m.group(1); desc=m.group(2).strip(' .-')[:80]
            if len(re.sub(r'[^A-Za-z]','',desc))<3: continue
            parts.setdefault(pn, desc)
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
        p='/tmp/bh_'+re.sub(r'\W+','_',src.split('/')[-1])[:50]
        open(p,'wb').write(urllib.request.urlopen(urllib.request.Request(src,headers={'User-Agent':'Mozilla/5.0'}),timeout=90).read())
        return p
    return src

def main():
    parts=parse(get_pdf(SRC))
    print(f'Parsed {len(parts)} Bush Hog {MODEL} parts.')
    for pn,d in list(parts.items())[:6]: print('  ',pn,d[:45])
    if DRY or not parts: return
    idn={}; items=list(parts.items())
    for i in range(0,len(items),200):
        chunk=[{'part_number':pn,'pn_norm':norm(pn),'name':d,'category':cat(d)} for pn,d in items[i:i+200]]
        for row in req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm',chunk,'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']]=row['id']
    mid=req('POST','/rest/v1/machines?on_conflict=make,model&select=id',{'make':'Bush Hog','model':MODEL,'type':MTYPE},'resolution=merge-duplicates,return=representation')[0]['id']
    rows=[{'machine_id':mid,'part_id':idn.get(norm(pn)),'position':None,'qty':1,'verified':True,'source':'bushhog-official','confidence':1.0} for pn in parts]
    rows=[r for r in rows if r['part_id']]
    for i in range(0,len(rows),200):
        req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',rows[i:i+200],'resolution=ignore-duplicates,return=minimal')
    print(f'DONE: Bush Hog {MODEL} — {len(parts)} parts, {len(rows)} fitments.')

if __name__=='__main__':
    main()

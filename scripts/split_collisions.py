#!/usr/bin/env python3
"""
Split shared-number parts so each manufacturer's version is its own row.
A part whose fitments come from 2+ different manufacturer catalogs (by source)
is split: the original keeps manufacturer A's fitments; a new row is created for
each other manufacturer and their fitments moved to it. Idempotent — run after
any ingest batch.  Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""
import os, re, urllib.request, urllib.parse, json
U=os.environ['SUPABASE_URL']; K=os.environ['SUPABASE_SERVICE_ROLE_KEY']
H={'apikey':K,'Authorization':'Bearer '+K,'Content-Type':'application/json'}
def _u(p): return U+'/rest/v1/'+urllib.parse.quote(p, safe="/?=&(),.*:%")
def api(method,path,body=None,prefer=None):
    h=dict(H)
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(_u(path), data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    raw=urllib.request.urlopen(r).read().decode(); return json.loads(raw) if raw else None
norm=lambda s: re.sub(r'[\s-]','',str(s).upper())
def mfr(src):
    s=(src or '').lower()
    for key, name in [('macdon','MacDon'),('redekop','Redekop'),('degelman','Degelman'),('bushhog','Bush Hog'),('woods','Woods')]:
        if key in s: return name
    if s.startswith('sheet/'): return src.split('/',1)[1]
    return 'Other'

# part_id -> {manufacturer: [fitment ids]}
part_fits={}; off=0
while True:
    rows=api('GET',f'fitments?select=id,part_id,source&limit=1000&offset={off}')
    if not rows: break
    for f in rows: part_fits.setdefault(f['part_id'],{}).setdefault(mfr(f['source']),[]).append(f['id'])
    off+=1000
    if len(rows)<1000: break

shared=[(pid,bym) for pid,bym in part_fits.items() if len(bym)>1]
print(f'shared-number parts to split: {len(shared)}')
split=0
for pid,bym in shared:
    info=api('GET',f'parts?id=eq.{pid}&select=part_number,name,category')
    if not info: continue
    info=info[0]; pn=info['part_number']
    mfrs=list(bym.keys())
    # original stays for mfrs[0]; new row per other manufacturer
    for b in mfrs[1:]:
        newp=api('POST','parts?on_conflict=pn_norm&select=id',
                 {'part_number':pn,'pn_norm':norm(pn+'~'+b),'name':info['name'],'category':info['category'],'brand':b},
                 'resolution=merge-duplicates,return=representation')[0]['id']
        for fid in bym[b]:
            api('PATCH',f'fitments?id=eq.{fid}',{'part_id':newp},'return=minimal')
        split+=1
    print(f'  split {pn}: {mfrs}')
print(f'DONE: {split} manufacturer-versions split out.')

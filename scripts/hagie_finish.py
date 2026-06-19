#!/usr/bin/env python3
# Finish the Hagie lineup: load model folders missed by the filename filter.
# Tries each model's manuals (newest first), parses DET/QTY/PART/DESC tables,
# VALIDATES part numbers (rejects garbled text layers), loads the best one.
import os, re, json, socket, html, urllib.parse, urllib.request
socket.setdefaulttimeout(45)
from pypdf import PdfReader

URL, SVC = os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY']
norm = lambda s: re.sub(r'[\s-]', '', str(s).upper())
ROW = re.compile(r'^\s*\d+\s+(\d+)\s+([A-Z0-9][A-Z0-9\-]{2,})\s+(.+\S)\s*$')
CLEAN = re.compile(r'^[A-Z0-9]{3,15}$')   # a sane part number after norm
ALREADY = {'200','204','2100','250','254','280','284','DTS 10','DTS 8','DTS 8T',
           'GST 20','STS 10','STS 10T','STS 12','STS 12i','STS 14','STS 16'}

def req(method, path, body=None, prefer=None):
    h={'apikey':SVC,'Authorization':'Bearer '+SVC,'Content-Type':'application/json'}
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(URL+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw=resp.read().decode(); return json.loads(raw) if raw else None

def cat(d):
    d=d.lower()
    if 'filter' in d: return 'Filters'
    if 'hose' in d: return 'Hose'
    if 'valve' in d: return 'Valve'
    if 'bearing' in d: return 'Bearings'
    if any(k in d for k in('seal','o-ring','gasket')): return 'Seals'
    if any(k in d for k in('bolt','nut','screw','washer','clamp')): return 'Hardware'
    if any(k in d for k in('switch','cable','wire','sensor','sendr','alt','reg')): return 'Electrical'
    return 'Other'

def parse(path):
    r=PdfReader(path)
    if r.is_encrypted:
        try: r.decrypt("")
        except Exception: return {}
    parts={}; assembly=''; prev=''
    for p in r.pages:
        try: txt=p.extract_text() or ""
        except Exception: continue
        for ln in txt.split("\n"):
            ln=ln.rstrip()
            if re.search(r'PART\s*NO',ln,re.I) and re.search(r'DESC',ln,re.I):
                if prev and not ROW.match(prev): assembly=prev.strip()[:60]
                prev=ln; continue
            m=ROW.match(ln)
            if m:
                qty,pn,desc=m.group(1),m.group(2).strip(),m.group(3).strip()
                if re.search(r'\d',pn) and len(pn)>=4 and pn not in parts:
                    parts[pn]={'name':desc[:80],'qty':int(qty) if qty.isdigit() else 1,'assembly':assembly}
            prev=ln
    return parts

def clean_ratio(parts):
    if not parts: return 0,0
    good=sum(1 for pn in parts if CLEAN.match(norm(pn)))
    return good, good/len(parts)

def download(url):
    dst='/tmp/_hf_'+re.sub(r'\W+','_',url.rsplit('/',1)[-1])[:50]+'.pdf'
    rq=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0 (Macintosh)'})
    with urllib.request.urlopen(rq) as resp, open(dst,'wb') as f: f.write(resp.read())
    return dst

def load(model, parts, src):
    mid=req('POST','/rest/v1/machines?on_conflict=make,model&select=id',
            {'make':'Hagie','model':model,'type':'Sprayer'},'resolution=merge-duplicates,return=representation')[0]['id']
    items=list(parts.items()); idn={}
    for i in range(0,len(items),200):
        chunk=[{'part_number':pn,'pn_norm':norm(pn),'name':v['name'],'category':cat(v['name'])} for pn,v in items[i:i+200]]
        for row in req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm',chunk,'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']]=row['id']
    rows=[{'machine_id':mid,'part_id':idn.get(norm(pn)),'position':v['assembly'] or None,'qty':v['qty'],
           'verified':False,'source':'hagie/'+src,'confidence':0.85} for pn,v in items]
    rows=[r for r in rows if r['part_id']]
    for i in range(0,len(rows),200):
        req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',rows[i:i+200],'resolution=ignore-duplicates,return=minimal')
    return len(rows)

h=open('/tmp/hagie_manuals.html',encoding='utf-8',errors='ignore').read()
paths=sorted(set(html.unescape(p) for p in re.findall(r'/files/Manuals/[^"\'> ]+\.pdf', h)))
by={}
for p in paths:
    md=urllib.parse.unquote(re.match(r'/files/Manuals/([^/]+)/',p).group(1))
    by.setdefault(md,[]).append('https://www.hagie.com'+p)
todo={m:u for m,u in by.items() if m not in ALREADY}
print(f"Models to attempt: {len(todo)}\n")
total=0
def yr(u):
    m=re.search(r'(19|20)\d{2}',u); return int(m.group()) if m else 0
for model in sorted(todo):
    urls=sorted(todo[model], key=yr, reverse=True)[:4]  # newest first, cap tries
    best=None
    for u in urls:
        try: pp=parse(download(u))
        except Exception as e: continue
        good,ratio=clean_ratio(pp)
        if good>=15 and ratio>=0.7:
            best=(pp,u); break
    if best:
        pp,u=best
        # keep only clean part numbers
        pp={pn:v for pn,v in pp.items() if CLEAN.match(norm(pn))}
        n=load(model,pp,u.rsplit('/',1)[-1])
        print(f"  ok {model}: {n} parts"); total+=len(pp)
    else:
        print(f"  !! {model}: no clean parts manual (scanned/garbled/operator-only)")
print(f"\nDONE. additional Hagie parts parsed: {total}")

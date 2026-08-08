#!/usr/bin/env python3
"""
OCR the 5 SCANNED Redekop parts manuals (no text layer) via Claude vision and
upsert parts + fitment into Supabase. Complements load_redekop.py (which handles
the text-layer manuals). Paid — uses the Anthropic API.

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
"""
import os, re, io, json, base64
from pypdf import PdfReader, PdfWriter
import anthropic

URL, SVC = os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY']
client = anthropic.Anthropic()
MODEL = os.environ.get('OCR_MODEL', 'claude-sonnet-4-6')  # strong vision OCR, cost-sane
CHUNK = 8
norm = lambda s: re.sub(r'[\s-]', '', str(s).upper())

# (make, model, local scanned pdf)   — combine each Redekop chopper fits
JOBS = [
    ('CLAAS Lexion', 'CAT Lexion (Redekop MAV)',        '/tmp/rkpdfs/CC008-01_R1.pdf'),
    ('John Deere',   'Complete Chopper (Redekop MAV)',  '/tmp/rkpdfs/CD0308-01_R1.pdf'),
    ('John Deere',   'Housing Upgrade (Redekop MAV)',   '/tmp/rkpdfs/CD0309-01_R2.pdf'),
    ('Case IH',      'Case IH (Redekop MAV)',           '/tmp/rkpdfs/CS0145-02_V3.pdf'),
    ('Case IH',      'Case IH (Redekop MAV)',           '/tmp/rkpdfs/CS0145-03_R1.pdf'),
]

PROMPT = ("This is a scanned Redekop {make} straw-chopper / residue-management parts manual "
  "(exploded diagrams with a balloon number, part number, description and quantity per part). "
  "Extract EVERY part. CRITICAL: transcribe each part_number EXACTLY as printed, character by "
  "character — do NOT guess or normalize; if illegible, omit that row. Return part_number, "
  "qty (integer, default 1), description, and assembly (the diagram/section heading if visible). "
  'Return ONLY a JSON array: [{{"part_number":"...","qty":1,"description":"...","assembly":"..."}}]. '
  "No prose, no code fence. If a page has no parts, contribute nothing.")

def req(method, path, body=None, prefer=None):
    import urllib.request
    h={'apikey':SVC,'Authorization':'Bearer '+SVC,'Content-Type':'application/json'}
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(URL+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw=resp.read().decode(); return json.loads(raw) if raw else None

def cat(d):
    d=(d or '').lower()
    if any(k in d for k in('blade','knife','paddle','flail')): return 'Blades'
    if 'bearing' in d: return 'Bearings'
    if any(k in d for k in('seal','o-ring','gasket')): return 'Seals'
    if any(k in d for k in('bolt','nut','screw','washer','pin')): return 'Hardware'
    if any(k in d for k in('hose','hyd','fit')): return 'Hydraulics'
    if any(k in d for k in('rotor','vane','housing','floor','sidewall','hood','shroud')): return 'Chopper Body'
    return 'Other'

def chunks(path):
    r=PdfReader(path)
    if r.is_encrypted: r.decrypt("")
    n=len(r.pages)
    for s in range(0,n,CHUNK):
        w=PdfWriter()
        for i in range(s,min(s+CHUNK,n)): w.add_page(r.pages[i])
        buf=io.BytesIO(); w.write(buf)
        yield base64.standard_b64encode(buf.getvalue()).decode()

def extract(make, b64):
    msg=client.messages.create(model=MODEL, max_tokens=16000,
        messages=[{"role":"user","content":[
            {"type":"document","source":{"type":"base64","media_type":"application/pdf","data":b64}},
            {"type":"text","text":PROMPT.format(make=make)}]}])
    txt="".join(b.text for b in msg.content if b.type=="text")
    m=re.search(r'\[.*\]', txt, re.S)
    if not m: return []
    try: return json.loads(m.group(0))
    except Exception: return []

def load(make, model, parts, src):
    parts={norm(p['part_number']):p for p in parts
           if p.get('part_number') and re.search(r'\d',str(p['part_number'])) and len(norm(p['part_number']))>=3}
    if not parts: return 0
    mid=req('POST','/rest/v1/machines?on_conflict=make,model&select=id',
            {'make':make,'model':model,'type':'Combine'},'resolution=merge-duplicates,return=representation')[0]['id']
    items=list(parts.values()); idn={}
    for i in range(0,len(items),200):
        chunk=[{'part_number':str(p['part_number'])[:40],'pn_norm':norm(p['part_number']),
                'name':str(p.get('description',''))[:80] or str(p['part_number']),'category':cat(p.get('description'))}
               for p in items[i:i+200]]
        for row in req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm',chunk,'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']]=row['id']
    def _q(p):
        v=str(p.get('qty',1)); return int(v) if v.isdigit() else 1
    rows=[{'machine_id':mid,'part_id':idn.get(norm(p['part_number'])),'position':str(p.get('assembly') or '')[:60] or None,
           'qty':_q(p),'verified':False,'source':'redekop-vision/'+src,'confidence':0.75} for p in items]
    rows=[r for r in rows if r['part_id']]
    for i in range(0,len(rows),200):
        req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',rows[i:i+200],'resolution=ignore-duplicates,return=minimal')
    return len(rows)

if __name__=='__main__':
    total=0
    for make,model,path in JOBS:
        if not os.path.exists(path): print('  !! missing', path); continue
        allp=[]
        for i,b64 in enumerate(chunks(path)):
            try: allp+=extract(make,b64)
            except Exception as e: print(f"    {os.path.basename(path)} chunk {i} err: {str(e)[:70]}")
        n=load(make,model,allp,os.path.basename(path))
        print(f"  ok  {n:4d} parts  [{make} / {model}]  {os.path.basename(path)}")
        total+=n
    print(f"\nDONE: {total} scanned parts added via vision.")

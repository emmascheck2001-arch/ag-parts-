#!/usr/bin/env python3
# Extract parts from SCANNED (image-only) parts manuals via Haiku vision.
# Chunks the PDF (output caps at 16k tokens), OCRs each chunk, inserts parts.
# Paid (Haiku $1/$5) — for manuals with no usable text layer.
import os, re, io, json, base64, urllib.request
from pypdf import PdfReader, PdfWriter
import anthropic

URL, SVC = os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY']
client = anthropic.Anthropic()  # ANTHROPIC_API_KEY from env
norm = lambda s: re.sub(r'[\s-]', '', str(s).upper())
CHUNK = 12

PROMPT = ("This is a scanned parts manual for the Hagie {model}. Read the parts "
  "tables and extract EVERY part. CRITICAL: transcribe each part_number EXACTLY, "
  "character by character, as printed — do NOT guess, infer, or normalize digits; "
  "if a character is illegible, omit that row rather than guess. For each row "
  "return part_number, qty (integer, default 1), description, and assembly (the "
  "section/diagram heading if visible, else empty). Return ONLY a JSON array: "
  '[{{"part_number":"...","qty":1,"description":"...","assembly":"..."}}]. '
  "No prose, no code fence. If a page has no parts table, contribute nothing.")

def req(method, path, body=None, prefer=None):
    h={'apikey':SVC,'Authorization':'Bearer '+SVC,'Content-Type':'application/json'}
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(URL+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw=resp.read().decode(); return json.loads(raw) if raw else None

def cat(d):
    d=(d or '').lower()
    if 'filter' in d: return 'Filters'
    if 'hose' in d: return 'Hose'
    if 'bearing' in d: return 'Bearings'
    if any(k in d for k in('seal','o-ring','gasket')): return 'Seals'
    if any(k in d for k in('bolt','nut','screw','washer')): return 'Hardware'
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

def extract(model, b64):
    msg=client.messages.create(model="claude-opus-4-8", max_tokens=16000,
        messages=[{"role":"user","content":[
            {"type":"document","source":{"type":"base64","media_type":"application/pdf","data":b64}},
            {"type":"text","text":PROMPT.format(model=model)}]}])
    txt="".join(b.text for b in msg.content if b.type=="text")
    m=re.search(r'\[.*\]', txt, re.S)
    if not m: return []
    try: return json.loads(m.group(0))
    except Exception: return []

def load(model, parts, src):
    parts={norm(p['part_number']):p for p in parts if p.get('part_number') and re.search(r'\d',str(p['part_number'])) and len(norm(p['part_number']))>=3}
    if not parts: return 0
    mid=req('POST','/rest/v1/machines?on_conflict=make,model&select=id',
            {'make':'Hagie','model':model,'type':'Sprayer'},'resolution=merge-duplicates,return=representation')[0]['id']
    items=list(parts.values()); idn={}
    for i in range(0,len(items),200):
        chunk=[{'part_number':str(p['part_number'])[:40],'pn_norm':norm(p['part_number']),'name':str(p.get('description',''))[:80] or str(p['part_number']),'category':cat(p.get('description'))} for p in items[i:i+200]]
        for row in req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm',chunk,'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']]=row['id']
    def _q(p):
        v=str(p.get('qty',1)); return int(v) if v.isdigit() else 1
    rows=[{'machine_id':mid,'part_id':idn.get(norm(p['part_number'])),'position':str(p.get('assembly') or '')[:60] or None,
           'qty':_q(p),'verified':False,'source':'hagie-vision-opus/'+src,'confidence':0.8} for p in items]
    rows=[r for r in rows if r['part_id']]
    for i in range(0,len(rows),200):
        req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',rows[i:i+200],'resolution=ignore-duplicates,return=minimal')
    return len(rows)

JOBS=[("440 Hi-Tractor","/tmp/v440.pdf"),("8400","/tmp/v8400.pdf"),("470","/tmp/v470.pdf"),
      ("647-S, 647 SX","/tmp/v647.pdf"),("8500","/tmp/v8500.pdf")]
total=0
for model,path in JOBS:
    allp=[]
    try:
        for i,b64 in enumerate(chunks(path)):
            try: allp+=extract(model,b64)
            except Exception as e: print(f"    chunk {i} err: {str(e)[:60]}")
        n=load(model,allp,os.path.basename(path))
        print(f"  ok {model}: {n} parts (vision)"); total+=n
    except Exception as e:
        print(f"  !! {model}: {str(e)[:70]}")
print(f"\nDONE. vision parts loaded: {total}")

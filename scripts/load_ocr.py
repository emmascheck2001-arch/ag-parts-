#!/usr/bin/env python3
"""
General vision-OCR parts loader for diagram/scanned catalogs (any manufacturer).
Reads each PDF chunk with Claude, extracts parts, upserts to Supabase.
Usage: python3 scripts/load_ocr.py <pdf_url_or_path> "<Make>" "<Model>" ["<Type>"]
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
"""
import os, re, io, sys, json, base64, urllib.request, ssl
from pypdf import PdfReader, PdfWriter
import anthropic

URL, SVC = os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY']
client = anthropic.Anthropic()
MODEL = os.environ.get('OCR_MODEL', 'claude-sonnet-4-6')
CHUNK = 8
CTX = ssl.create_default_context(); CTX.check_hostname=False; CTX.verify_mode=ssl.CERT_NONE
norm = lambda s: re.sub(r'[\s-]', '', str(s).upper())

PROMPT = ("This is a scanned/diagram parts catalog for the {make} {model}. Extract EVERY part. "
  "CRITICAL: transcribe each part_number EXACTLY as printed, character by character — do NOT guess "
  "or normalize; if illegible, omit that row. Ignore page/form numbers and dates. For each part "
  "return part_number, qty (integer, default 1), and description. Return ONLY a JSON array: "
  '[{{"part_number":"...","qty":1,"description":"..."}}]. No prose, no code fence.')

def cat(d):
    d=(d or '').lower()
    if 'bearing' in d: return 'Bearings'
    if any(k in d for k in('seal','o-ring','gasket')): return 'Seals'
    if any(k in d for k in('bolt','nut','screw','washer','pin')): return 'Hardware'
    if any(k in d for k in('hose','hyd','cylinder','valve')): return 'Hydraulics'
    if any(k in d for k in('tooth','tine','blade','tine')): return 'Ground-Engaging'
    if any(k in d for k in('bushing','sprocket','chain','shaft','hub')): return 'Drive'
    return 'Other'

def req(method, path, body=None, prefer=None):
    h={'apikey':SVC,'Authorization':'Bearer '+SVC,'Content-Type':'application/json'}
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(URL+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw=resp.read().decode(); return json.loads(raw) if raw else None

def get_pdf(src):
    if src.startswith('http'):
        p='/tmp/ocr_'+re.sub(r'\W+','_',src.split('/')[-1])[:50]
        open(p,'wb').write(urllib.request.urlopen(urllib.request.Request(src,headers={'User-Agent':'Mozilla/5.0'}),timeout=90,context=CTX).read())
        return p
    return src

def chunks(path):
    r=PdfReader(path)
    if r.is_encrypted: r.decrypt("")
    n=len(r.pages)
    for s in range(0,n,CHUNK):
        w=PdfWriter()
        for i in range(s,min(s+CHUNK,n)): w.add_page(r.pages[i])
        buf=io.BytesIO(); w.write(buf)
        yield base64.standard_b64encode(buf.getvalue()).decode()

def extract(make, model, b64):
    m=client.messages.create(model=MODEL, max_tokens=16000, messages=[{"role":"user","content":[
        {"type":"document","source":{"type":"base64","media_type":"application/pdf","data":b64}},
        {"type":"text","text":PROMPT.format(make=make,model=model)}]}])
    t="".join(b.text for b in m.content if b.type=="text")
    mm=re.search(r'\[.*\]', t, re.S)
    if not mm: return []
    try: return json.loads(mm.group(0))
    except Exception: return []

def main():
    src, make, model = sys.argv[1], sys.argv[2], sys.argv[3]
    mtype = sys.argv[4] if len(sys.argv)>4 else 'Implement'
    path=get_pdf(src)
    allp=[]
    for i,b64 in enumerate(chunks(path)):
        try: allp+=extract(make,model,b64)
        except Exception as e: print(f"   chunk {i} err: {str(e)[:60]}")
    parts={norm(p['part_number']):p for p in allp if p.get('part_number') and re.search(r'\d',str(p['part_number'])) and len(norm(p['part_number']))>=3}
    if not parts: print("  no parts extracted"); return
    idn={}; items=list(parts.values())
    for i in range(0,len(items),200):
        chunk=[{'part_number':str(p['part_number'])[:40],'pn_norm':norm(p['part_number']),
                'name':str(p.get('description',''))[:80] or str(p['part_number']),'category':cat(p.get('description'))} for p in items[i:i+200]]
        for row in req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm',chunk,'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']]=row['id']
    mid=req('POST','/rest/v1/machines?on_conflict=make,model&select=id',{'make':make,'model':model,'type':mtype},'resolution=merge-duplicates,return=representation')[0]['id']
    def q(p):
        v=str(p.get('qty',1)); return int(v) if v.isdigit() else 1
    rows=[{'machine_id':mid,'part_id':idn.get(norm(p['part_number'])),'position':None,'qty':q(p),'verified':False,'source':'vision/'+make.lower(),'confidence':0.75} for p in items]
    rows=[r for r in rows if r['part_id']]
    for i in range(0,len(rows),200):
        req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',rows[i:i+200],'resolution=ignore-duplicates,return=minimal')
    print(f"DONE: {make} {model} — {len(parts)} parts, {len(rows)} fitments (vision).")

if __name__=='__main__':
    main()

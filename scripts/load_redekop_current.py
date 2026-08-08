#!/usr/bin/env python3
"""
Load the CURRENT Redekop catalog from redekopmfg.com (defeats the JS model filter
by hitting the server-side ?_sfm_model_number= param). Covers all ~179 combine
models incl. the full SCU line + newer revisions — the stuff the old strawchopper
portal didn't have. Text manuals parse here; scanned ones are listed for OCR.

Manifest: /tmp/redekop_current_pdfs.json  (url -> [models])  from enum_redekop.py
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   Requires: pypdf
Usage: python3 scripts/load_redekop_current.py [--dry]
"""
import os, re, sys, json, ssl, urllib.request, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from load_redekop import parse_pdf, categorize, norm  # reuse the proven parser

DRY = '--dry' in sys.argv
CTX = ssl.create_default_context(); CTX.check_hostname=False; CTX.verify_mode=ssl.CERT_NONE
BRANDS = ['CaseIH','CAT Challenger','CLAAS Lexion','FENDT','Gleaner','John Deere','Massey Ferguson','New Holland','Versatile']
BRAND_MAKE = {'CaseIH':'Case IH','CAT Challenger':'AGCO','CLAAS Lexion':'CLAAS Lexion','FENDT':'AGCO',
              'Gleaner':'AGCO','John Deere':'John Deere','Massey Ferguson':'AGCO','New Holland':'New Holland','Versatile':'Versatile'}

def get(url):
    rq=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
    return urllib.request.urlopen(rq, timeout=40, context=CTX).read()

def build_model_make():
    m={}
    for b in BRANDS:
        try:
            h=get('https://redekopmfg.com/support/manuals/?_sfm_brand='+urllib.parse.quote(b)).decode('utf-8','ignore')
        except Exception: continue
        sm=re.search(r'_sfm_model_number\[\].*?</select>', h, re.S)
        if not sm: continue
        for o in re.findall(r'<option[^>]*>([^<]{1,40})</option>', sm.group(0)):
            o=o.strip()
            if o and 'select a model' not in o.lower():
                m.setdefault(o, BRAND_MAKE[b])   # first brand claiming the model wins
    return m

def download(url):
    fn=re.sub(r'[^A-Za-z0-9._-]','_', url.split('/')[-1])
    p='/tmp/rkcur/'+fn
    if os.path.exists(p) and os.path.getsize(p)>2000: return p
    os.makedirs('/tmp/rkcur', exist_ok=True)
    open(p,'wb').write(get(url)); return p

def req(method, path, body=None, prefer=None):
    U=os.environ['SUPABASE_URL']; K=os.environ['SUPABASE_SERVICE_ROLE_KEY']
    h={'apikey':K,'Authorization':'Bearer '+K,'Content-Type':'application/json'}
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(U+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw=resp.read().decode(); return json.loads(raw) if raw else None

def main():
    manifest=json.load(open('/tmp/redekop_current_pdfs.json'))   # url -> [models]
    mm=build_model_make()
    print('brand->model map:', len(mm), 'models')
    all_parts={}; fitplan={}; scans=[]; parsed=0
    for url, models in manifest.items():
        try: path=download(url)
        except Exception as e: print('  !! dl', url.split('/')[-1], e); continue
        try: parts=parse_pdf(path)
        except Exception as e: scans.append(url); continue
        if not parts: scans.append(url); continue
        parsed+=1
        for pn,v in parts.items(): all_parts[pn]=v
        # PDFs shown on every model page (>40 models) are "featured"/generic, not
        # model-specific — don't claim their parts fit all 179 combines.
        if len(models) > 40: continue
        for md in models:
            mk=mm.get(md,'Redekop')
            fitplan.setdefault((mk,md), set()).update(parts.keys())
    uniq=len(all_parts); fits=sum(len(s) for s in fitplan.values())
    print(f'\nCURRENT catalog: {parsed} text manuals parsed | {len(scans)} need OCR '
          f'| {uniq} unique parts | {fits} fitment rows | {len(fitplan)} (make,model) machines')
    print('scans needing OCR:', len(scans))
    if DRY:
        json.dump(scans, open('/tmp/redekop_current_scans.json','w'))
        print('DRY — wrote scans list, no writes.'); return
    # write parts
    idn={}; items=list(all_parts.items())
    for i in range(0,len(items),200):
        chunk=[{'part_number':pn[:40],'pn_norm':norm(pn),'name':v['name'],'category':categorize(v['name'])} for pn,v in items[i:i+200]]
        for row in req('POST','/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm',chunk,'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']]=row['id']
    total=0
    for (mk,md),pns in fitplan.items():
        mid=req('POST','/rest/v1/machines?on_conflict=make,model&select=id',{'make':mk,'model':md,'type':'Combine'},'resolution=merge-duplicates,return=representation')[0]['id']
        rows=[{'machine_id':mid,'part_id':idn.get(norm(pn)),'position':None,'qty':all_parts[pn]['qty'],'verified':False,'source':'redekop-current/redekopmfg.com','confidence':0.85} for pn in pns]
        rows=[r for r in rows if r['part_id']]
        for i in range(0,len(rows),200):
            req('POST','/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',rows[i:i+200],'resolution=ignore-duplicates,return=minimal')
        total+=len(rows)
    json.dump(scans, open('/tmp/redekop_current_scans.json','w'))
    print(f'\nDONE: {uniq} parts, {total} fitments. {len(scans)} scans queued for OCR.')

if __name__=='__main__':
    main()

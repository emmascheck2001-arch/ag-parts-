#!/usr/bin/env python3
"""
Load Country Clipper parts manuals (AES-encrypted, text-layer PDFs) into the
index — free, no AI. CC table format is: REF  PART#  QTY  DESCRIPTION, with
hyphenated part numbers (e.g. 617-355W). One machine per manual.

Usage: python3 scripts/load_cc_manual.py   (reads /tmp/cc_manuals.html)
Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   Requires: pypdf, cryptography
"""
import os, re, json, socket, urllib.request
socket.setdefaulttimeout(45)
from pypdf import PdfReader

URL, SVC = os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY']
norm = lambda s: re.sub(r'[\s-]', '', str(s).upper())
ROW = re.compile(r'^\s*(?:\d{1,3}|-{1,2})\s+([A-Za-z0-9][A-Za-z0-9\-]{2,})\s+(\d{1,3})\s+(.+\S)\s*$')

def is_title(s):
    s = s.strip()
    if not s or len(s) < 4 or len(s) > 50: return False
    if any(k in s for k in ('COUNTRY CLIPPER', 'REF', 'DESCRIP', 'DECRIP')): return False
    return bool(re.match(r'^[A-Z0-9][A-Z0-9 &.,"/\-]+$', s))

def categorize(d):
    d = d.lower()
    if 'filter' in d: return 'Filters'
    if 'belt' in d: return 'Belts'
    if 'blade' in d: return 'Blades'
    if 'bearing' in d: return 'Bearings'
    if any(k in d for k in ('seal', 'o-ring', 'gasket')): return 'Seals'
    if any(k in d for k in ('bolt', 'nut', 'screw', 'washer', 'pin', 'hhcs')): return 'Hardware'
    if any(k in d for k in ('spindle', 'pulley', 'idler', 'spacer')): return 'Drive'
    if any(k in d for k in ('switch', 'cable', 'wire', 'solenoid', 'battery')): return 'Electrical'
    if any(k in d for k in ('tire', 'wheel', 'caster')): return 'Wheels'
    if any(k in d for k in ('decal', 'panel', 'fender', 'seat', 'cover')): return 'Body'
    return 'Other'

def req(method, path, body=None, prefer=None):
    h = {'apikey': SVC, 'Authorization': 'Bearer ' + SVC, 'Content-Type': 'application/json'}
    if prefer: h['Prefer'] = prefer
    r = urllib.request.Request(URL + path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw = resp.read().decode(); return json.loads(raw) if raw else None

def parse(path):
    r = PdfReader(path)
    if r.is_encrypted: r.decrypt("")
    parts = {}; assembly = ''
    for p in r.pages:
        for ln in (p.extract_text() or "").split("\n"):
            ln = ln.rstrip()
            m = ROW.match(ln)
            if m:  # part row first — never treat as a title
                pn, qty, desc = m.group(1).strip(), m.group(2), m.group(3).strip()
                if re.search(r'\d', pn) and not set(pn) <= set('-') and len(pn) >= 4 and pn not in parts:
                    parts[pn] = {'name': desc[:80], 'qty': int(qty), 'assembly': assembly}
            elif is_title(ln):
                assembly = ln.strip()[:60]
    return parts

def model_from_url(url):
    fn = url.rsplit('/', 1)[-1][:-4]
    fn = re.sub(r'[-_ ]P-?\d+.*$', '', fn)
    fn = re.sub(r'[-_ ]Parts?([-_ ]Manual)?$', '', fn, flags=re.I)
    fn = re.sub(r'^\d{4}(-\d{2,4})?[-_ ]', '', fn)
    return fn.replace('_', '/').replace('-', ' ').strip()[:60] or 'Unknown'

def load(url, model):
    dst = '/tmp/_cc_' + re.sub(r'\W+', '_', url.rsplit('/', 1)[-1])[:50]
    rq = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh)'})
    with urllib.request.urlopen(rq) as resp, open(dst, 'wb') as f: f.write(resp.read())
    parts = parse(dst)
    if not parts:
        print(f"  !! {model}: 0 parts (skipped)"); return 0
    mid = req('POST', '/rest/v1/machines?on_conflict=make,model&select=id',
              {'make': 'Country Clipper', 'model': model, 'type': 'Mower'},
              'resolution=merge-duplicates,return=representation')[0]['id']
    items = list(parts.items()); idn = {}
    for i in range(0, len(items), 200):
        chunk = [{'part_number': pn, 'pn_norm': norm(pn), 'name': v['name'], 'category': categorize(v['name'])} for pn, v in items[i:i+200]]
        for row in req('POST', '/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm', chunk, 'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']] = row['id']
    rows = [{'machine_id': mid, 'part_id': idn.get(norm(pn)), 'position': v['assembly'] or None,
             'qty': v['qty'], 'verified': False, 'source': 'countryclipper/' + os.path.basename(dst), 'confidence': 0.85}
            for pn, v in items]
    rows = [r for r in rows if r['part_id']]
    for i in range(0, len(rows), 200):
        req('POST', '/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to', rows[i:i+200], 'resolution=ignore-duplicates,return=minimal')
    print(f"  ok {model}: {len(parts)} parts")
    return len(parts)

if __name__ == '__main__':
    html = open('/tmp/cc_manuals.html', encoding='utf-8', errors='ignore').read()
    urls = sorted(set(re.findall(r'https?://www\.countryclipper\.com/wp-content/uploads/[^"\'> ]+\.pdf', html)))
    parts_urls = [u for u in urls if 'part' in u.lower() and 'operator' not in u.lower()]
    by_model = {}
    for u in parts_urls:
        by_model.setdefault(model_from_url(u), u)  # one per model label
    print(f"Country Clipper: {len(parts_urls)} parts manuals -> {len(by_model)} distinct models\n")
    total = 0
    for model, u in sorted(by_model.items()):
        try: total += load(u, model)
        except Exception as e: print(f"  !! {model}: ERROR {str(e)[:70]}")
    print(f"\nDONE. Country Clipper parts parsed: {total}")

#!/usr/bin/env python3
"""
Load a full parts catalog from an OEM parts-manual PDF that has a text layer —
for FREE (no AI). Parses the standard "DET QTY PART NO DESCRIPTION" tables,
groups parts by assembly, and writes machine + parts + fitments into Supabase.

Originally built for Hagie manuals (hagie.com publishes them publicly), but
works on any parts manual with the same table shape and an extractable text
layer.

Usage:
  python3 scripts/load_parts_manual.py <pdf_path_or_url> "<make>" "<model>" [model2 ...]

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Requires: pypdf  (pip install pypdf)
"""
import os, re, sys, json, socket, urllib.request, urllib.parse
socket.setdefaulttimeout(30)  # never hang forever on a stalled download

ROW = re.compile(r'^\s*\d+\s+(\d+)\s+([A-Z0-9][A-Z0-9\-]{3,})\s+(.+\S)\s*$')

def norm(pn): return re.sub(r'[\s-]', '', pn.upper())

def categorize(d):
    d = d.lower()
    if 'filter' in d: return 'Filters'
    if 'hose' in d: return 'Hose'
    if 'valve' in d: return 'Valve'
    if 'bearing' in d: return 'Bearings'
    if any(k in d for k in ('seal','o-ring','gasket')): return 'Seals'
    if any(k in d for k in ('bolt','nut','screw','washer','clamp')): return 'Hardware'
    if 'pump' in d: return 'Pumps'
    if any(k in d for k in ('switch','relay','cable','wire','breaker','sensor','sendr','light')): return 'Electrical'
    if 'hyd' in d: return 'Hydraulics'
    if any(k in d for k in ('tube','fitting','ftg')): return 'Fittings'
    return 'Other'

def parse_pdf(path):
    from pypdf import PdfReader
    r = PdfReader(path)
    parts = {}
    assembly = ''
    prev = ''
    for page in r.pages:
        for ln in (page.extract_text() or '').split('\n'):
            ln = ln.rstrip()
            if re.search(r'PART\s*NO', ln, re.I) and re.search(r'DESC', ln, re.I):
                if prev and not ROW.match(prev):
                    assembly = prev.strip()[:60]
                prev = ln; continue
            m = ROW.match(ln)
            if m:
                qty, pn, desc = m.group(1), m.group(2).strip(), m.group(3).strip()
                if re.search(r'\d', pn) and len(pn) >= 4 and pn not in parts:
                    parts[pn] = {'name': desc[:80], 'qty': int(qty) if qty.isdigit() else 1,
                                 'assembly': assembly}
            prev = ln
    return parts

# ---- Supabase REST helpers ----
URL = os.environ['SUPABASE_URL']; SVC = os.environ['SUPABASE_SERVICE_ROLE_KEY']
def req(method, path, body=None, prefer=None):
    h = {'apikey': SVC, 'Authorization': 'Bearer ' + SVC, 'Content-Type': 'application/json'}
    if prefer: h['Prefer'] = prefer
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + path, data=data, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else None

def upsert_machine(make, model):
    d = req('POST', '/rest/v1/machines?on_conflict=make,model&select=id',
            {'make': make, 'model': model, 'type': 'Sprayer'},
            'resolution=merge-duplicates,return=representation')
    return d[0]['id']

def load(pdf, make, models):
    src_path = pdf
    if pdf.startswith('http'):
        src_path = '/tmp/_pm_' + re.sub(r'\W+', '_', pdf.split('/')[-1])[:60] + '.pdf'
        rq = urllib.request.Request(pdf, headers={'User-Agent': 'Mozilla/5.0 (Macintosh)'})
        with urllib.request.urlopen(rq) as resp, open(src_path, 'wb') as f:
            f.write(resp.read())
    parts = parse_pdf(src_path)
    if not parts:
        print(f"  !! {', '.join(models)}: no text-layer parts found (scanned?) — skipped")
        return 0
    # bulk upsert parts
    id_by_norm = {}
    items = list(parts.items())
    for i in range(0, len(items), 200):
        chunk = [{'part_number': pn, 'pn_norm': norm(pn), 'name': v['name'],
                  'category': categorize(v['name'])} for pn, v in items[i:i+200]]
        d = req('POST', '/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm', chunk,
                'resolution=merge-duplicates,return=representation')
        for row in d or []:
            id_by_norm[row['pn_norm']] = row['id']
    # fitments for each model the manual covers
    src = 'hagie/' + os.path.basename(src_path)
    total_fit = 0
    for model in models:
        mid = upsert_machine(make, model)
        rows = [{'machine_id': mid, 'part_id': id_by_norm.get(norm(pn)),
                 'position': v['assembly'] or None, 'qty': v['qty'], 'verified': False,
                 'source': src, 'confidence': 0.9} for pn, v in items]
        rows = [r for r in rows if r['part_id']]
        for i in range(0, len(rows), 200):
            req('POST', '/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to',
                rows[i:i+200], 'resolution=ignore-duplicates,return=minimal')
        total_fit += len(rows)
    print(f"  ok {', '.join(models)}: {len(parts)} parts -> {total_fit} fitments")
    return len(parts)

if __name__ == '__main__':
    pdf, make = sys.argv[1], sys.argv[2]
    models = sys.argv[3:]
    load(pdf, make, models)

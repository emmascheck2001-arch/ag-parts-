#!/usr/bin/env python3
"""
Batch-ingest MacDon's primary parts catalogs (headers + windrowers) from their
public CloudFront/S3 bucket. Reuses the proven MacDon parser + footer/serial/qty
cleanup. One machine per model. No prices.  Env: SUPABASE_URL, SERVICE_ROLE_KEY.
"""
import os, re, sys, json, urllib.request
sys.argv = ['x', 'placeholder']          # satisfy load_macdon_d60 module-level argv
sys.path.insert(0, os.path.dirname(__file__))
from load_macdon_d60 import parse, categorize, norm, req

CF = "https://dz7yasdqa53ew.cloudfront.net/"
# curated: clean model -> catalog file (latest rev, English, primary PC only)
CATS = {
    "FD75":     "FD75-PC_214324_C.pdf",
    "CA20":     "CA20-PC_169011_RevG.pdf",
    "C-Series": "C-Series_PC_393322_RevA.pdf",
    "FC FlexCorn": "FC_PC_393202_RevA.pdf",
    "D2":       "D2_SP_PC_262675_A.pdf",
    "FD2":      "FD2_FM200_PC_262654_RevB_Case_MD.pdf",
    "M1170NT":  "M1170NT_M1170NT5_PC_215984_RevB.pdf",
    "M1240":    "M1240_PC_215950_RevB.pdf",
    "M155":     "M155-PC_262948_RevA.pdf",
    "M155E4":   "M155E4_PC_262106_A.pdf",
    "M205":     "M205-PC_214604_RevB.pdf",
    "M2170":    "M2170_M2170NT-PC_262666_RevA.pdf",
    "M2260":    "M2260_PC_393099_RevB.pdf",
    "PW8":      "PW8_PC_262859_A.pdf",
    "R216":     "R216_SP_PC_393103_RevC.pdf",
    "R113 R116":"R113_R116_SP_PC_393128_A.pdf",
    "TR25":     "TR25_PC_262892_RevA.pdf",
}
PREFIX = "pdf/Parts-Catalogs/English-Parts-Catalogues/"

def download(fn):
    dst = "/tmp/mac_" + re.sub(r'[^A-Za-z0-9._-]', '_', fn)
    if os.path.exists(dst) and os.path.getsize(dst) > 5000:
        return dst
    url = CF + PREFIX + fn
    data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'}), timeout=120).read()
    open(dst, 'wb').write(data)
    return dst

def load(model, parts):
    idn = {}; items = list(parts.items())
    for i in range(0, len(items), 200):
        chunk = [{'part_number': pn, 'pn_norm': norm(pn), 'name': d, 'category': categorize(d)} for pn, d in items[i:i+200]]
        for row in req('POST', '/rest/v1/parts?on_conflict=pn_norm&select=id,pn_norm', chunk, 'resolution=merge-duplicates,return=representation') or []:
            idn[row['pn_norm']] = row['id']
    mid = req('POST', '/rest/v1/machines?on_conflict=make,model&select=id',
              {'make': 'MacDon', 'model': model, 'type': 'Header'}, 'resolution=merge-duplicates,return=representation')[0]['id']
    rows = [{'machine_id': mid, 'part_id': idn.get(norm(pn)), 'position': None, 'qty': 1, 'verified': True,
             'source': 'macdon-official', 'confidence': 1.0} for pn in parts]
    rows = [r for r in rows if r['part_id']]
    for i in range(0, len(rows), 200):
        req('POST', '/rest/v1/fitments?on_conflict=machine_id,part_id,serial_from,serial_to', rows[i:i+200], 'resolution=ignore-duplicates,return=minimal')
    return len(rows)

if __name__ == '__main__':
    total = 0
    for model, fn in CATS.items():
        try:
            path = download(fn)
            parts = parse(path)
            if not parts:
                print(f"  !! {model}: 0 parts (scan?) — {fn}"); continue
            n = load(model, parts)
            total += n
            print(f"  ok  MacDon {model:<12} {n:5d} parts  ({fn})")
        except Exception as e:
            print(f"  !! {model}: {str(e)[:70]}")
    print(f"\nBATCH DONE: {total} parts across {len(CATS)} MacDon catalogs.")

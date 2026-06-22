#!/usr/bin/env python3
"""Extract exploded-diagram pages from a parts manual and map each part number
to the page it appears on, so the app can show "your part is on this diagram".

Renders only the pages that actually contain one of the machine's parts (not the
whole manual), writes PNGs to public/diagrams/<slug>/p<N>.png, and a manifest
public/diagrams/<slug>.json = {title, partToPage:{pn:page}, pages:[...]}.

  python3 scripts/extract_diagrams.py <manual.pdf> <slug> <title> <pns.json>
"""
import sys, os, re, json
import fitz  # PyMuPDF

manual, slug, title, pns_file = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
pns = json.load(open(pns_file))
norm = lambda s: re.sub(r"[\s-]", "", str(s)).upper()
want = {norm(p): p for p in pns}                       # normalized -> original

doc = fitz.open(manual)
TOKEN = re.compile(r"[A-Z0-9][A-Z0-9\-]{4,}")          # candidate part tokens

part_to_page = {}                                       # original pn -> first page (1-based)
pages_with_parts = set()
for i, page in enumerate(doc):
    text = page.get_text("text").upper()
    hits = {want[norm(t)] for t in TOKEN.findall(text) if norm(t) in want}
    if hits:
        pages_with_parts.add(i)
        for pn in hits:
            part_to_page.setdefault(pn, i + 1)          # first page wins

print(f"{len(part_to_page)}/{len(pns)} parts located across {len(pages_with_parts)} diagram pages")

# Render the diagram pages (the ones holding our parts) to PNG.
outdir = f"public/diagrams/{slug}"
os.makedirs(outdir, exist_ok=True)
mat = fitz.Matrix(1.6, 1.6)                              # ~115 dpi — readable, compact
rendered = []
for i in sorted(pages_with_parts):
    pix = doc[i].get_pixmap(matrix=mat)
    pix.save(f"{outdir}/p{i + 1}.png")
    rendered.append(i + 1)

manifest = {"title": title, "slug": slug, "pages": rendered, "partToPage": part_to_page}
json.dump(manifest, open(f"public/diagrams/{slug}.json", "w"))
print(f"rendered {len(rendered)} pages -> {outdir}/, manifest -> public/diagrams/{slug}.json")

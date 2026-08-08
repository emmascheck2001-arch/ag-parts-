#!/usr/bin/env python3
"""Build a review-only staging bundle from Degelman's Pro-Till parts manual.

The source PDF is deliberately not copied into public application assets. This
builder verifies the locally pinned file by SHA-256, extracts source mentions
from the illustrated parts section, and emits catalog_staging-shaped JSON. It
does not connect to Supabase and cannot promote records into ``catalog``.
"""

from __future__ import annotations

import hashlib
import json
import re
import uuid
from collections import Counter, defaultdict
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[2]
PDF = ROOT / "catalogs/diagrams/degelman-pro-till-20-26-ptl4652.pdf"
OUT = ROOT / "data/catalog-staging/degelman-pro-till-ptl4652.json"
NS = uuid.UUID("7683da8c-ad80-56dc-9c36-df6c8400714d")

SOURCE_URL = (
    "https://degelman.com/pub/resources/manuals/pro-till/pro-till-2026/"
    "sn-ptl4652-and-up/143433-Pro-Till-20-26.pdf"
)
SOURCE_SHA256 = "b45316d414efb9f9f4a7de0d9de9c00294fbf9dd1ff9e716769695c1857cb4ed"
DOCUMENT_NUMBER = "143433"
DOCUMENT_REVISION = "v1.3"
PARSER_VERSION = "1.0.0"

VARIANTS = ("20", "20HD", "26", "26HD")
TWENTY_VARIANTS = ("20", "20HD")
TWENTY_SIX_VARIANTS = ("26", "26HD")

# Every title below is transcribed from the manual table of contents or printed
# page heading. The controlled system/subsystem names are EZPARTS taxonomy, not
# claims that they are Degelman terminology.
PAGE_MAP = {
    32: ("Hitch Pole / Front Frame Components", "Frame & Hitch", "Hitch and Front Frame", VARIANTS),
    33: ("Hitch Pole / Front Frame Components", "Frame & Hitch", "Hitch and Front Frame", VARIANTS),
    34: ("Wheel & Rockshaft Components", "Frame & Hitch", "Wheels and Rockshaft", VARIANTS),
    35: ("Center Frame Components", "Frame & Hitch", "Center Frame", VARIANTS),
    36: ("Wing Frame Components — 20 ft", "Frame & Hitch", "Wing Frames", TWENTY_VARIANTS),
    37: ("Wing Frame Components — 26 ft", "Frame & Hitch", "Wing Frames", TWENTY_SIX_VARIANTS),
    38: ("Deflector Assembly Components", "Soil Management", "Dirt Deflector", VARIANTS),
    39: ("Disc Gang Components — 20 & 20HD", "Ground Engagement", "Disc Gangs", TWENTY_VARIANTS),
    40: ("Disc Gang Components — 26 & 26HD", "Ground Engagement", "Disc Gangs", TWENTY_SIX_VARIANTS),
    41: ("Disc Gang Components", "Ground Engagement", "Disc Components", VARIANTS),
    42: ("Disc Options", "Ground Engagement", "Disc Options", VARIANTS),
    43: ("Roller Mounting Frame Components", "Finishing System", "Roller Mounting Frames", VARIANTS),
    44: ("Roller Mounting Frame Positioning", "Finishing System", "Roller Mounting Frames", VARIANTS),
    45: ("Single Roller & Roller Frame Assemblies", "Finishing System", "Single Rollers", VARIANTS),
    46: ("Single Roller Part Components", "Finishing System", "Single Rollers", VARIANTS),
    47: ("Scraper Components", "Finishing System", "Roller Scrapers", VARIANTS),
    48: ("Double Cage Roller & Roller Frame Assemblies", "Finishing System", "Double Cage Rollers", VARIANTS),
    49: ("Hydraulic Layout 1 — Depth", "Hydraulics", "Depth Circuit", VARIANTS),
    50: ("Hydraulic Layout 2 — Wings", "Hydraulics", "Wing Circuit", VARIANTS),
    51: ("Hydraulic Layout 3 — Transport", "Hydraulics", "Transport Circuit", VARIANTS),
    52: ("Hydraulic Layout 4 — Jack", "Hydraulics", "Jack Circuit", VARIANTS),
    53: ("Cylinders & Depth Stop Components", "Hydraulics", "Cylinders and Depth Stops", VARIANTS),
    54: ("Hydraulic Schematic — Depth Circuit", "Hydraulics", "Depth Circuit", VARIANTS),
    55: ("Hydraulic Schematic — Wing / Transport / Jack", "Hydraulics", "Hydraulic Schematics", VARIANTS),
    56: ("Light Routing — Standard", "Electrical", "Lighting", VARIANTS),
}

# These labels are directly readable in the pinned pages but are not paired
# with their labels in the PDF text layer. Keeping the small explicit map makes
# the extraction deterministic without pretending OCR supplied evidence.
SOURCE_LABEL_OVERRIDES = {
    "143550": '18" End Disc - Straight',
    "143553": '20" Double-V Notched Disc',
    "143557": '20" Notched Disc',
    "143562": '22" Straight Disc',
    "143563": '22" Notched Disc',
    "143565": '24" Notched Disc',
    "143566": '22" Double-V Notched Disc',
    "143567": '20" Straight Economy Disc',
    "143568": '20" Notched Economy Disc',
    "143576": '26" Notched Disc',
    "143577": '26" Double-V Notched Disc',
    "572370": "Deflector Mount Arm",
    "572649": "Max-Life LSTX Blade Kit — 20 ft",
    "572650": "Max-Life LSTX Blade Kit — 26 ft",
    "572676": "Standard LSTX Blade Kit — 20 ft",
    "572678": "Standard LSTX Blade Kit — 26 ft",
}

PART_NUMBER = re.compile(r"(?<!\d)(\d{6})(?!\d)")
QUANTITY = re.compile(r"\((\d+|Qty)\)", re.I)
ALLOWED_PREFIXES = ("11", "12", "13", "14", "24", "57", "78")


def sid(kind: str, *values: object) -> str:
    value = ":".join([kind, *(str(item).strip().casefold() for item in values)])
    return str(uuid.uuid5(NS, value))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_number(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\u00ad", "")).strip()


def candidate_description(after: str, before: str) -> str | None:
    value = after.strip(" :-–")
    value = re.split(
        r"\s+(?:mounts with|comes with|also requires|important|note)\s*:?",
        value,
        maxsplit=1,
        flags=re.I,
    )[0]
    value = re.split(r"\s*\(Seal Kit\s*:?", value, maxsplit=1, flags=re.I)[0]
    quantity = QUANTITY.search(value)
    if quantity:
        value = value[: quantity.start()]
    value = clean_text(value).strip(" :-–,")
    if not re.search(r"[A-Za-z]", value) or len(value) < 3:
        if re.search(r"Seal Kit\s*:?$", before, re.I):
            return "Seal Kit"
        return None
    if value.casefold().startswith(("model", "models")):
        return None
    return value[:240]


def canonical_description(number: str, descriptions: list[str]) -> str | None:
    if not descriptions:
        return SOURCE_LABEL_OVERRIDES.get(number)
    counts = Counter(descriptions)
    def score(item: str) -> tuple[int, int, str]:
        incomplete = bool(re.search(r"(?:,|\b(?:x|with|and|of|the|for|c/w))$", item, re.I))
        specificity = min(len(item), 100) + (counts[item] * 4) - (80 if incomplete else 0)
        return (-specificity, len(item), item.casefold())
    return sorted(counts, key=score)[0]


def description_needs_review(value: str | None) -> bool:
    if value is None or len(value) < 9:
        return True
    return bool(re.search(r"(?:,|\b(?:x|with|and|of|the|for|c/w))$", value, re.I))


def variant_scope(page: int, number: str, raw_text: str, bbox: list[float]) -> tuple[list[str], str]:
    base = list(PAGE_MAP[page][3])
    text = raw_text.casefold()
    if page in (45, 46, 47, 48):
        has_twenty = bool(re.search(r"\b(?:20\s*(?:ft|')|3m)\b", text))
        has_twenty_six = bool(re.search(r"\b(?:26\s*(?:ft|')|4m)\b", text))
        if has_twenty and not has_twenty_six:
            return list(TWENTY_VARIANTS), "inline_width_scope"
        if has_twenty_six and not has_twenty:
            return list(TWENTY_SIX_VARIANTS), "inline_width_scope"
    if page == 47 and bbox[1] >= 560:
        return list(TWENTY_SIX_VARIANTS), "4m_only_source_subsection"
    if page == 56 and number == "573194":
        return list(TWENTY_VARIANTS), "inline_20ft_scope"
    if page == 56 and number == "573193":
        return list(TWENTY_SIX_VARIANTS), "inline_26ft_scope"
    if len(base) == 4:
        return base, "combined_manual_shared_scope_needs_review"
    return base, "explicit_page_variant_scope"


def extract_mentions(document: fitz.Document) -> list[dict]:
    mentions: list[dict] = []
    for page in PAGE_MAP:
        pdf_page = document[page - 1]
        blocks = pdf_page.get_text("blocks")
        row = 0
        for block_index, block in enumerate(blocks, 1):
            raw_text = clean_text(block[4])
            raw_text = re.sub(r"(?<!\d)(\d)\s+(\d{5})(?!\d)", r"\1\2", raw_text)
            matches = [
                match for match in PART_NUMBER.finditer(raw_text)
                if match.group() != DOCUMENT_NUMBER and match.group().startswith(ALLOWED_PREFIXES)
            ]
            for mention_index, match in enumerate(matches, 1):
                row += 1
                end = matches[mention_index].start() if mention_index < len(matches) else len(raw_text)
                start = matches[mention_index - 2].end() if mention_index > 1 else 0
                before = raw_text[start : match.start()]
                after = raw_text[match.end() : end]
                quantity = QUANTITY.search(after)
                number = normalize_number(match.group())
                bbox = [round(float(value), 3) for value in block[:4]]
                variants, scope_basis = variant_scope(page, number, raw_text, bbox)
                mentions.append({
                    "page": page,
                    "printedPage": page - 6,
                    "row": row,
                    "blockIndex": block_index,
                    "mentionIndex": mention_index,
                    "bbox": bbox,
                    "number": number,
                    "rawText": raw_text,
                    "descriptionCandidate": candidate_description(after, before),
                    "quantityText": quantity.group(1) if quantity else None,
                    "variants": variants,
                    "variantScopeBasis": scope_basis,
                })
    return mentions


def add_candidate(candidates: list[dict], raw_id: str, entity_type: str,
                  candidate_key: str, payload: dict, status: str = "unresolved",
                  confidence: float | None = None) -> str:
    candidate_id = sid("candidate", raw_id, entity_type, candidate_key)
    candidates.append({
        "id": candidate_id,
        "raw_record_id": raw_id,
        "entity_type": entity_type,
        "candidate_key": candidate_key,
        "canonical_payload": payload,
        "resolution_status": status,
        "confidence": confidence,
    })
    return candidate_id


def build_bundle() -> dict:
    if not PDF.exists():
        raise SystemExit(f"Missing pinned source PDF: {PDF}")
    actual_hash = sha256(PDF)
    if actual_hash != SOURCE_SHA256:
        raise SystemExit(f"Source PDF SHA-256 mismatch: expected {SOURCE_SHA256}, got {actual_hash}")

    document = fitz.open(PDF)
    if document.page_count != 59:
        raise SystemExit(f"Expected 59 PDF pages, found {document.page_count}")
    mentions = extract_mentions(document)
    descriptions: dict[str, list[str]] = defaultdict(list)
    for mention in mentions:
        if mention["descriptionCandidate"]:
            descriptions[mention["number"]].append(mention["descriptionCandidate"])
    canonical = {
        number: canonical_description(number, descriptions[number])
        for number in sorted({mention["number"] for mention in mentions})
    }

    job_id = sid("import-job", SOURCE_SHA256, PARSER_VERSION)
    file_id = sid("import-file", job_id, SOURCE_SHA256)
    raw_records: list[dict] = []
    candidates: list[dict] = []
    issues: list[dict] = []

    def issue(raw_id: str, code: str, severity: str, message: str, details: dict | None = None) -> None:
        issues.append({
            "id": sid("issue", job_id, raw_id, code, json.dumps(details or {}, sort_keys=True)),
            "raw_record_id": raw_id,
            "entity_candidate_id": None,
            "issue_code": code,
            "severity": severity,
            "field_name": None,
            "message": message,
            "details": details or {},
        })

    control_raw_id = sid("raw", job_id, "document-control")
    raw_records.append({
        "id": control_raw_id,
        "import_file_id": file_id,
        "source_record_key": "document-control",
        "page_number": 1,
        "row_number": 1,
        "raw_payload": {
            "document_number": DOCUMENT_NUMBER,
            "revision": DOCUMENT_REVISION,
            "models": list(VARIANTS),
            "serial_scope": "PTL4652 and above",
            "source_url": SOURCE_URL,
            "source_sha256": SOURCE_SHA256,
        },
        "raw_text": "Pro-Till 20 | 26 | 20HD | 26HD — Serial Numbers PTL4652 and above",
        "parse_status": "parsed",
    })
    add_candidate(candidates, control_raw_id, "manufacturer", "degelman", {"name": "Degelman", "slug": "degelman"}, "new", 1.0)
    add_candidate(candidates, control_raw_id, "machine_type", "high-speed-disc", {"name": "High-Speed Disc", "slug": "high-speed-disc"}, "new", 0.95)
    add_candidate(candidates, control_raw_id, "model", "degelman:pro-till", {"manufacturer_key": "degelman", "model_code": "Pro-Till", "name": "Pro-Till"}, "new", 1.0)
    for variant in VARIANTS:
        variant_key = f"degelman:pro-till:{variant.casefold()}"
        add_candidate(candidates, control_raw_id, "variant", variant_key, {
            "model_key": "degelman:pro-till", "variant_code": variant, "name": f"Pro-Till {variant}"
        }, "new", 1.0)
        add_candidate(candidates, control_raw_id, "serial_range", f"{variant_key}:ptl4652-plus", {
            "variant_key": variant_key, "serial_from": "PTL4652", "serial_to": None,
            "label": "PTL4652 and above", "source_document_number": DOCUMENT_NUMBER,
        }, "new", 1.0)
    for variant in TWENTY_SIX_VARIANTS:
        variant_key = f"degelman:pro-till:{variant.casefold()}"
        add_candidate(candidates, control_raw_id, "serial_range", f"{variant_key}:ptl5988-plus", {
            "variant_key": variant_key, "serial_from": "PTL5988", "serial_to": None,
            "label": "PTL5988 and above — 4 m scraper center clamp",
            "source_document_number": DOCUMENT_NUMBER, "source_page": 41,
        }, "new", 1.0)
    issue(control_raw_id, "SOURCE_PAGE_REUSE_PERMISSION_UNCONFIRMED", "info",
          "The official source may be used for provenance, but manual page images must not be shipped until reuse permission is confirmed.",
          {"source_url": SOURCE_URL, "page_images_in_bundle": False})

    section_ids: dict[tuple[int, str], str] = {}
    for page, (title, system, subsystem, page_variants) in PAGE_MAP.items():
        raw_id = sid("raw", job_id, "section", page)
        raw_records.append({
            "id": raw_id, "import_file_id": file_id, "source_record_key": f"section:pdf-{page}",
            "page_number": page, "row_number": 1,
            "raw_payload": {"printed_page": page - 6, "title": title, "system": system,
                            "subsystem": subsystem, "variant_scope": list(page_variants)},
            "raw_text": title, "parse_status": "parsed",
        })
        system_key = f"degelman:pro-till:system:{system.casefold().replace(' ', '-')}"
        subsystem_key = f"{system_key}:subsystem:{subsystem.casefold().replace(' ', '-')}"
        assembly_key = f"{subsystem_key}:assembly:{page}:{title.casefold().replace(' ', '-')}"
        add_candidate(candidates, raw_id, "system", system_key, {"name": system}, "new", 0.95)
        add_candidate(candidates, raw_id, "subsystem", subsystem_key, {"system_key": system_key, "name": subsystem}, "new", 0.95)
        add_candidate(candidates, raw_id, "assembly", assembly_key, {"subsystem_key": subsystem_key, "name": title}, "new", 1.0)
        for variant in page_variants:
            section_key = f"degelman:pro-till:{variant.casefold()}:p{page}"
            section_ids[(page, variant)] = section_key
            add_candidate(candidates, raw_id, "catalog_section", section_key, {
                "variant_key": f"degelman:pro-till:{variant.casefold()}",
                "assembly_key": assembly_key, "section_key": f"manual-{DOCUMENT_NUMBER}-p{page - 6}",
                "title": title, "source_document_number": DOCUMENT_NUMBER,
                "source_pdf_page": page, "source_printed_page": page - 6,
            }, "new", 1.0)
        if len(page_variants) == 4 and page not in (32, 33, 34, 35, 38, 41, 42, 43, 44, 49, 50, 51, 52, 53, 54, 55, 56):
            issue(raw_id, "VARIANT_SCOPE_REVIEW_REQUIRED", "warning",
                  "The combined page contains mixed width labels; each occurrence scope must be confirmed during review.")

    for mention in mentions:
        record_key = f"mention:p{mention['page']}:b{mention['blockIndex']}:m{mention['mentionIndex']}"
        raw_id = sid("raw", job_id, record_key)
        description = canonical[mention["number"]]
        parse_status = "parsed" if description else "warning"
        provenance = {
            "source_url": SOURCE_URL,
            "source_sha256": SOURCE_SHA256,
            "document_number": DOCUMENT_NUMBER,
            "document_revision": DOCUMENT_REVISION,
            "pdf_page": mention["page"],
            "printed_page": mention["printedPage"],
            "bbox_points": mention["bbox"],
            "block_index": mention["blockIndex"],
            "mention_index": mention["mentionIndex"],
        }
        raw_records.append({
            "id": raw_id, "import_file_id": file_id, "source_record_key": record_key,
            "page_number": mention["page"], "row_number": mention["row"],
            "raw_payload": {
                "part_number": mention["number"],
                "description_candidate": mention["descriptionCandidate"],
                "canonical_description_candidate": description,
                "quantity_text": mention["quantityText"],
                "variant_scope": mention["variants"],
                "variant_scope_basis": mention["variantScopeBasis"],
                "provenance": provenance,
            },
            "raw_text": mention["rawText"], "parse_status": parse_status,
        })
        identity_key = f"degelman:{mention['number']}"
        add_candidate(candidates, raw_id, "part_number", identity_key, {
            "issuer_manufacturer_key": "degelman", "number": mention["number"],
            "normalized_number": mention["number"], "number_type": "oem",
            "part_key": f"part:{identity_key}", "source": provenance,
        }, "unresolved", 1.0)
        add_candidate(candidates, raw_id, "part", f"part:{identity_key}", {
            "primary_description": description, "manufacturer_scoped_number_key": identity_key,
        }, "unresolved", 0.98 if description else 0.5)
        for variant in mention["variants"]:
            section_key = section_ids[(mention["page"], variant)]
            occurrence_key = f"{section_key}:{record_key}"
            serial_key = f"degelman:pro-till:{variant.casefold()}:ptl4652-plus"
            if mention["page"] == 47 and mention["bbox"][1] >= 560 and variant in TWENTY_SIX_VARIANTS:
                serial_key = f"degelman:pro-till:{variant.casefold()}:ptl5988-plus"
            add_candidate(candidates, raw_id, "part_occurrence", occurrence_key, {
                "catalog_section_key": section_key, "part_key": f"part:{identity_key}",
                "part_number_key": identity_key, "serial_range_key": serial_key,
                "quantity_text": mention["quantityText"], "source": provenance,
                "variant_scope_basis": mention["variantScopeBasis"],
            }, "unresolved", 0.9 if "needs_review" not in mention["variantScopeBasis"] else 0.75)
        if not description:
            issue(raw_id, "PART_DESCRIPTION_UNRESOLVED", "blocking",
                  "The source text layer exposed a part number without a reliable description.",
                  {"part_number_key": identity_key, "raw_text": mention["rawText"]})

    for number, description in sorted(canonical.items()):
        if not description_needs_review(description):
            continue
        matching_raw = next(record for record in raw_records
                            if record["raw_payload"].get("part_number") == number)
        issue(matching_raw["id"], "PART_DESCRIPTION_REVIEW_REQUIRED", "warning",
              "The extracted source label is short or appears truncated; confirm it against the pinned diagram before promotion.",
              {"part_number_key": f"degelman:{number}", "description": description})

    # Report label disagreements without choosing a semantic merge. The stable
    # manufacturer-scoped number still prevents duplicate master identities.
    for number, labels in sorted(descriptions.items()):
        distinct = sorted(set(labels))
        if len(distinct) < 2:
            continue
        matching_raw = next(record for record in raw_records
                            if record["raw_payload"].get("part_number") == number)
        issue(matching_raw["id"], "SOURCE_LABEL_VARIANTS", "warning",
              "The same manufacturer-scoped number has multiple extracted source labels; review before promotion.",
              {"part_number_key": f"degelman:{number}", "labels": distinct[:20]})

    summary = {
        "pdf_pages": document.page_count,
        "parts_section_pdf_pages": len(PAGE_MAP),
        "source_mentions": len(mentions),
        "unique_manufacturer_scoped_part_numbers": len(canonical),
        "raw_records": len(raw_records),
        "entity_candidates": len(candidates),
        "part_occurrence_candidates": sum(item["entity_type"] == "part_occurrence" for item in candidates),
        "validation_issues": len(issues),
        "blocking_issues": sum(item["severity"] == "blocking" for item in issues),
        "page_images_in_bundle": 0,
    }
    document.close()
    return {
        "schema_version": "ezparts.catalog-staging.bundle.v1",
        "status": "needs_review",
        "promotion_attempted": False,
        "database_write_performed": False,
        "import_job": {
            "id": job_id, "importer_name": f"degelman-pro-till-manual@{PARSER_VERSION}",
            "source_label": "Degelman Pro-Till 20/26/20HD/26HD manual 143433",
            "status": "needs_review",
        },
        "import_files": [{
            "id": file_id, "file_name": "143433-Pro-Till-20-26.pdf",
            "media_type": "application/pdf", "storage_uri": SOURCE_URL,
            "content_sha256": SOURCE_SHA256, "byte_size": PDF.stat().st_size,
            "redistribution_status": "manual-page reuse permission unconfirmed",
        }],
        "raw_records": raw_records,
        "entity_candidates": candidates,
        "validation_issues": issues,
        "promotion_batches": [],
        "summary": summary,
    }


def main() -> None:
    bundle = build_bundle()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(bundle, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(OUT.relative_to(ROOT)), **bundle["summary"]}, indent=2))


if __name__ == "__main__":
    main()

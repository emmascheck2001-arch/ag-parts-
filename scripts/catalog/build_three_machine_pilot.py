#!/usr/bin/env python3
"""Build the source-backed Hagie 2100 / MacDon D60 / FD70 pilot catalog.

This is deliberately a build step, not a production importer. It reads pinned
manuals, emits stable normalized identities plus record-level provenance, and
fails closed when a catalog section cannot be mapped to the controlled browse
hierarchy. The generated JSON is a read-only application snapshot; the same
records can later be promoted through catalog_staging into the catalog schema.
"""

from __future__ import annotations

import hashlib
import io
import json
import re
import sys
import uuid
from collections import Counter, defaultdict
from pathlib import Path

import fitz
from PIL import Image
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/catalog/three-machine-pilot.json"
REPORT = ROOT / "catalogs/pilot/three-machine-report.json"
HAGIE_PDF = ROOT / "catalogs/diagrams/hagie-2100-parts.pdf"
MACDON_PDF = ROOT / "catalogs/diagrams/macdon-d50-d60-fd70-rev-e.pdf"
NS = uuid.UUID("6e93098a-5e38-4f2e-aabc-cfd72d0f7087")


def sid(kind: str, *values: object) -> str:
    key = ":".join([kind, *(str(v).strip().casefold() for v in values)])
    return str(uuid.uuid5(NS, key))


def norm_identifier(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", value.upper())


def clean_text(value: str) -> str:
    value = value.replace("\u00ad", "").replace("\n", " ")
    value = re.sub(r"\.{3,}", " ", value)
    value = re.sub(r"\s+", " ", value).strip(" .")
    return value


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def title_key(title: str) -> str:
    value = re.sub(r"\s*\(Continued\)\s*$", "", title, flags=re.I)
    return clean_text(value).upper()


def browse_path(title: str, brand: str) -> tuple[str, str]:
    """Map source assembly headings into the controlled farmer vocabulary."""
    t = title.upper()
    if brand == "Hagie":
        rules = [
            (("SOLUTION", "SPRAY", "BOOM", "FOAM", "RINSE", "CHEMICAL", "QUICK FILL", "PRESSURE WASH", "AGITATOR", "LIFTARM", "LIFT CYLINDER", "TRANSOM"), ("Spray System", "Liquid Application")),
            (("HYDRAULIC SCHEMATIC", "SUNDSTRAND", "LOOP FLUSH", "HI-PRESS FILTER", "HYD TANK", "HYDRAULIC", "FLOW DIVIDER", "RELIEF", "HYD.HOSE", "WHEEL MOTOR", "RETURN TEE", "HYDROSTATIC"), ("Hydraulics & Propulsion", "Hydraulic Power")),
            (("STEER", "TREAD", "LEG ASSEMBLY", "TIE ROD"), ("Steering & Suspension", "Steering and Tread")),
            (("ENGINE", "A/C COMPRESSOR", "MUFFLER", "AIR CLEANER", "RADIATOR", "COOLING"), ("Engine & Powertrain", "Engine Support")),
            (("WIRING", "BATTERY", "LIGHT", "FUSE", "INSTRUMENT", "SWITCH PANEL"), ("Electrical", "Electrical Distribution")),
            (("CAB", "CONSOLE", "SEAT", "WINDSHIELD", "AIR CONDITION", "HEATER", "DOOR", "THROTTLE LEVER"), ("Operator Station", "Cab and Controls")),
            (("TIRE", "RIM", "MAINFRAME", "SHEET METAL", "LADDER", "PLATFORM", "FUEL TANK", "DECAL"), ("Chassis & Body", "Frame and Exterior")),
            (("AIR WET", "AIR REGULATOR", "AIR TANK"), ("Pneumatics", "Air Supply")),
        ]
    else:
        rules = [
            (("FRAME", "ENDSHIELD", "WING BALANCE"), ("Frame & Structure", "Header Frame")),
            (("GUARD", "KNIFE", "CUTTER", "CROP LIFTER"), ("Cutting System", "Knife and Guards")),
            (("DRAPER",), ("Draper System", "Draper Drive and Decks")),
            (("REEL",), ("Reel System", "Reel and Reel Drive")),
            (("HYDRAULIC", "CASE DRAIN"), ("Hydraulics", "Header Hydraulics")),
            (("ELECTRICAL",), ("Electrical", "Header Electrical")),
            (("DECAL", "PAINT", "PRODUCT IDENTIFICATION"), ("Identification & Safety", "Decals and Markings")),
            (("TRANSPORT", "STABILIZER", "HITCH", "WHEEL"), ("Transport", "Transport Equipment")),
            (("SKID", "ROCK RETARDER", "FORMING ROD", "SWATH DEFLECTOR", "RICE DIVIDER", "UPPER CROSS AUGER", "FORE-AFT KIT"), ("Attachments & Options", "Crop Handling Options")),
        ]
    for needles, path in rules:
        if any(needle in t for needle in needles):
            return path
    raise ValueError(f"Unmapped {brand} catalog section: {title}")


def hagie_title(text: str, page: int) -> str:
    overrides = {
        105: "Chemical Inductor & Quick Fill Manifold Assemblies",
        107: "2100 Decals",
        37: "Foam Marker Tank Assembly",
        109: "2100 Hydraulic Schematic S1",
        111: "2100 Hydraulic Schematic S2",
        113: "2100 Hydraulic Schematic S3",
        115: "2100 Wiring Diagram Sheet 1",
        116: "2100 Wiring Diagram Sheet 1 Harnesses",
        117: "2100 Wiring Diagram Sheet 2",
        118: "2100 Wiring Diagram Sheet 2 Harnesses",
        119: "2100 Wiring Diagram Sheet 3",
        120: "2100 Wiring Diagram Sheet 3 Harnesses",
        121: "2100 Wiring Diagram Sheet 4",
        122: "2100 Wiring Diagram Valve Harnesses",
        123: "2100 Wiring Diagram Sheet 5",
    }
    if page in overrides:
        return overrides[page]
    lines = [clean_text(line) for line in text.splitlines()]
    header = next((i for i, line in enumerate(lines) if "PART NO. DESCRIPTION" in line), -1)
    if header >= 0:
        for line in reversed(lines[:header]):
            if (5 <= len(line) <= 100 and re.search(r"[A-Z]{3}", line)
                    and not line.startswith(("NOTE", "TO ", "FROM ", "REVISION"))
                    and not re.fullmatch(r"[A-Z]", line)):
                return line.title()
    raise ValueError(f"No Hagie title found on PDF page {page}")


HAGIE_ROW = re.compile(r"(?<!\S)(\d{1,3})\s+(\d+)\s+([A-Z0-9][A-Z0-9-]{3,})\s+(.+?)(?=\s{2,}\d{1,3}\s+\d+\s+[A-Z0-9][A-Z0-9-]{3,}\s+|$)")


def parse_hagie() -> list[dict]:
    rows: list[dict] = []
    reader = PdfReader(str(HAGIE_PDF))
    for page_index, pdf_page in enumerate(reader.pages):
        page = page_index + 1
        text = pdf_page.extract_text() or ""
        line_rows = []
        strict_wiring_row = re.compile(r"^\s*(\d{1,3})\s+(\d+)\s+(\d{6})\s+(.+)$")
        for line in text.splitlines():
            matches = ([strict_wiring_row.match(line)] if 115 <= page <= 123
                       else list(HAGIE_ROW.finditer(line)))
            for match in (candidate for candidate in matches if candidate):
                ref, qty, number, description = match.groups()
                description = clean_text(description)
                description = re.sub(r"\s+206\d{3}\s+\d+$", "", description)
                if number.isdigit() and len(number) >= 4 and description:
                    line_rows.append({
                        "ref": ref,
                        "quantity": int(qty),
                        "quantityText": qty,
                        "number": number,
                        "description": description,
                        "serial": None,
                    })
        # The decal list uses QTY / PART NO / DESCRIPTION / LOCATION and the
        # wiring sheets omit the usual header, but retain the same row shape.
        if page == 107:
            decal = re.compile(r"^\s*(\d+)\s+(\d{6})\s+(.+?)(?=\s{2,}[A-Z0-9]|$)")
            line_rows = []
            for line in text.splitlines():
                m = decal.match(line)
                if m:
                    qty, number, description = m.groups()
                    line_rows.append({"ref": None, "quantity": int(qty), "quantityText": qty,
                                      "number": number, "description": clean_text(description), "serial": None})
        if 115 <= page <= 123:
            seen_numbers = {row["number"] for row in line_rows}
            labelled = re.compile(r"^\s*(29\d{4})\s+-\s+(.+)$")
            for line in text.splitlines():
                match = labelled.search(line)
                if not match or match.group(1) in seen_numbers:
                    continue
                number, description = match.groups()
                description = clean_text(description)
                if description:
                    line_rows.append({"ref": "DIAGRAM", "quantity": None, "quantityText": "REF",
                                      "number": number, "description": description, "serial": None})
                    seen_numbers.add(number)
        if not line_rows:
            continue
        title = hagie_title(text, page)
        system, subsystem = browse_path(title, "Hagie")
        for index, row in enumerate(line_rows, 1):
            row.update({
                "brand": "Hagie", "models": ["2100"], "page": page,
                "diagramPage": page, "title": title_key(title), "system": system,
                "subsystem": subsystem, "recordKey": f"p{page}-r{index}",
            })
            rows.append(row)
    return rows


PART_TOKEN = re.compile(r"^[A-Z]?\d{4,7}$")
REF_TOKEN = re.compile(r"^(?:\d{1,3}[A-Z]?|[A-Z])$")


def macdon_title(lines: list[str]) -> str:
    try:
        rev = lines.index("Revision E")
        ref = lines.index("REF", rev + 1)
    except ValueError as exc:
        raise ValueError("MacDon table headings not found") from exc
    title = [line for line in lines[rev + 1:ref] if not line.isdigit()]
    return clean_text(" ".join(title))


def model_scope(title: str, description: str) -> list[str]:
    t, d = title.upper(), description.upper()
    if "D50 REEL" in t:
        return []
    if "D50 & D60" in t:
        return ["D60"]
    if "FD70" in t:
        return ["FD70"]
    flags = {model for model in ("D60", "FD70") if model in d}
    if flags:
        return sorted(flags)
    if "D50 ONLY" in d:
        return []
    return ["D60", "FD70"]


def parse_segmented_knife_page(text: str) -> list[dict]:
    """Parse the width-by-width knife tables that do not use normal columns."""
    parsed = []
    width = None
    standard = re.compile(r"^\s*(?:(\d+[A-Za-z]?|[A-Z])\s+)?([A-Z]?\d{4,6})\s{2,}(.+?)\s*$")
    item = re.compile(r"Item\s+(\d+[A-Za-z]?)\s+([A-Z]?\d{4,6})\s+(.+?)\s+Qty\.?\s*(\d+)", re.I)
    for source_line in text.splitlines():
        line = clean_text(source_line)
        width_match = re.match(r"^(\d{2})[’']\s+Item", line)
        if width_match:
            width = f"{width_match.group(1)} ft header"
        matched_item = False
        for match in item.finditer(line):
            matched_item = True
            ref, number, description, quantity = match.groups()
            parsed.append({
                "ref": ref, "quantity": int(quantity), "quantityText": quantity,
                "number": number, "description": clean_text(f"{description} ({width or 'header configuration'})"),
                "serial": width,
            })
        if matched_item or line.startswith(("NOTE", "*", "**")):
            continue
        match = standard.match(source_line)
        if not match:
            continue
        ref, number, description = match.groups()
        description = clean_text(description)
        if not description or "PACK or" in description:
            continue
        parsed.append({
            "ref": ref, "quantity": None, "quantityText": "REF",
            "number": number, "description": description, "serial": None,
        })
    # Preserve repeated parts for different widths, but eliminate PDF duplicate
    # text fragments for the same source row.
    unique = []
    seen = set()
    for row in parsed:
        key = (row["ref"], row["number"], row["description"], row["quantityText"], row["serial"])
        if key not in seen:
            seen.add(key)
            unique.append(row)
    return unique


def parse_macdon() -> list[dict]:
    rows: list[dict] = []
    document = fitz.open(MACDON_PDF)
    source_reader = PdfReader(str(MACDON_PDF))
    current_title = None
    for page_index, page_obj in enumerate(document):
        page = page_index + 1
        lines = [clean_text(line) for line in page_obj.get_text("text").splitlines() if clean_text(line)]
        if "PART" not in lines or "NUMBER" not in lines or "DESCRIPTION" not in lines:
            continue
        try:
            raw_title = macdon_title(lines)
        except ValueError:
            continue
        title = title_key(raw_title)
        if title == "RICE DIVIDER KIT" or "RICE DIVIDER" in raw_title.upper():
            title = "RICE DIVIDER KIT"
        if "DECALS & REFLECTORS" in raw_title.upper():
            title = "DECALS & REFLECTORS"
        if "(CONTINUED)" in raw_title.upper() and current_title:
            title = current_title
        current_title = title
        system, subsystem = browse_path(title, "MacDon")

        all_words = page_obj.get_text("words")
        description_headers = [w[1] for w in all_words if w[4] == "DESCRIPTION"]
        if not description_headers:
            continue
        header_y = min(description_headers)
        grouped: dict[int, list[tuple]] = defaultdict(list)
        for word in all_words:
            # Text fragments on the same printed row may be split into separate
            # PDF blocks and differ by a few tenths of a point in Y position.
            grouped[int(word[1] + 0.5)].append(word)
        page_rows = []
        last_ref = None
        last = None
        for line_key in sorted(grouped, key=lambda key: min(word[1] for word in grouped[key])):
            words = sorted(grouped[line_key], key=lambda word: word[0])
            y = min(word[1] for word in words)
            if y <= header_y + 5:
                continue
            candidates = [w for w in words if 99 <= w[0] < 162 and PART_TOKEN.fullmatch(w[4])]
            if candidates:
                part_word = candidates[0]
                number = part_word[4]
                refs = [w[4] for w in words if 68 <= w[0] < 108 and REF_TOKEN.fullmatch(w[4])]
                if refs:
                    last_ref = refs[0]
                desc_words = [w[4] for w in words if 148 <= w[0] < 480]
                description = clean_text(" ".join(desc_words))
                qty_words = [w[4] for w in words if 450 <= w[0] < 515]
                serial_words = [w[4] for w in words if w[0] >= 515]
                qty_text = clean_text(" ".join(qty_words)) or "REF"
                qty_serial = re.match(r"^(.*?)(See\s+Note.*)$", qty_text, re.I)
                if qty_serial:
                    qty_text = clean_text(qty_serial.group(1)) or "REF"
                    serial_words = qty_serial.group(2).split() + serial_words
                numeric_qty = int(qty_text) if qty_text.isdigit() and int(qty_text) > 0 else None
                serial = clean_text(" ".join(serial_words)) or None
                last = {
                    "ref": last_ref, "quantity": numeric_qty, "quantityText": qty_text,
                    "number": number, "description": description, "serial": serial,
                }
                page_rows.append(last)
                continue
            # A wrapped description begins in the description column. Preserve
            # fitment qualifiers (width, model, configuration) on the row.
            if last and words and 148 <= words[0][0] < 480 and y - last.get("_y", y) <= 15:
                continuation = clean_text(" ".join(w[4] for w in words if 148 <= w[0] < 515))
                if continuation and not continuation.startswith(("Continued", "NOTE:")):
                    last["description"] = clean_text(last["description"] + " " + continuation)
            if last:
                last["_y"] = y

        # Pages with matrix quantities have no single QTY column. Retaining REF
        # is safer than pretending one kit/header configuration applies to all.
        if page in (33, 35):
            page_rows = parse_segmented_knife_page(source_reader.pages[page_index].extract_text() or "")
        diagram_page = page if page >= 132 else max(1, page - 1)
        for index, row in enumerate(page_rows, 1):
            row.pop("_y", None)
            models = model_scope(title, row["description"])
            if not models:
                continue
            row.update({
                "brand": "MacDon", "models": models, "page": page,
                "diagramPage": diagram_page, "title": title, "system": system,
                "subsystem": subsystem, "recordKey": f"p{page}-r{index}",
            })
            rows.append(row)
    return rows


def build_snapshot(rows: list[dict]) -> dict:
    manufacturers = [
        {"id": sid("manufacturer", brand), "name": brand, "slug": brand.lower()}
        for brand in ("Hagie", "MacDon")
    ]
    machine_types = [
        {"id": sid("machine-type", "Self-Propelled Sprayer"), "name": "Self-Propelled Sprayer", "slug": "self-propelled-sprayer"},
        {"id": sid("machine-type", "Header"), "name": "Header", "slug": "header"},
    ]
    machine_specs = [
        ("Hagie", "Self-Propelled Sprayer", "2100", "Hagie 2100", "U1400000001", "U1400000100"),
        ("MacDon", "Header", "D60", "MacDon D60", None, None),
        ("MacDon", "Header", "FD70", "MacDon FD70 FlexDraper Header", None, None),
    ]
    machines, variants, serial_ranges = [], [], []
    model_ids, variant_ids = {}, {}
    for brand, machine_type, code, display, start, end in machine_specs:
        model_id = sid("model", brand, machine_type, code)
        variant_id = sid("variant", model_id, "catalog-coverage")
        model_ids[(brand, code)] = model_id
        variant_ids[(brand, code)] = variant_id
        machines.append({
            "id": model_id, "manufacturerId": sid("manufacturer", brand),
            "machineTypeId": sid("machine-type", machine_type), "modelCode": code,
            "displayName": display,
        })
        variants.append({
            "id": variant_id, "modelId": model_id, "variantCode": "catalog-coverage",
            "displayName": "Parts manual coverage", "configuration": {"sourceBacked": True},
        })
        serial_ranges.append({
            "id": sid("serial-range", variant_id, start or "all", end or "all"),
            "modelVariantId": variant_id,
            "rangeCode": f"{start}-{end}" if start else "all-published-serials",
            "serialFrom": start, "serialTo": end, "isAllSerials": start is None,
            "applicabilityNote": "Manual explicitly covers this serial range" if start else "No machine-wide serial boundary stated in this catalog revision",
        })

    docs = {
        "Hagie": {
            "id": sid("document", sha256(HAGIE_PDF)), "organizationId": sid("source-org", "Hagie Manufacturing"),
            "title": "Hagie 2100 Parts Manual", "documentNumber": None, "revision": None,
            "contentSha256": sha256(HAGIE_PDF), "localPath": str(HAGIE_PDF.relative_to(ROOT)),
            "sourceUrl": None,
        },
        "MacDon": {
            "id": sid("document", sha256(MACDON_PDF)), "organizationId": sid("source-org", "MacDon Industries"),
            "title": "D50, D60 and FD70 Parts Catalog", "documentNumber": "169008", "revision": "E",
            "contentSha256": sha256(MACDON_PDF), "localPath": str(MACDON_PDF.relative_to(ROOT)),
            "sourceUrl": "https://www.macdon.com/resources/d50-d60-and-fd70-parts-catalog-169008-revision-e-2",
        },
    }

    systems_by_name, subsystems_by_key, assemblies_by_key = {}, {}, {}
    sections, occurrences, provenance = [], [], []
    part_descriptions: dict[tuple[str, str], Counter] = defaultdict(Counter)
    for row in rows:
        part_descriptions[(row["brand"], norm_identifier(row["number"]))][row["description"]] += 1
    parts, part_numbers, aliases = [], [], []
    part_ids = {}
    for (brand, number), descriptions in sorted(part_descriptions.items()):
        canonical = sorted(descriptions.items(), key=lambda item: (-item[1], -len(item[0]), item[0]))[0][0]
        part_id = sid("part", brand, number)
        part_ids[(brand, number)] = part_id
        parts.append({"id": part_id, "canonicalName": canonical, "partKind": "component", "lifecycleStatus": "unknown"})
        part_numbers.append({
            "id": sid("part-number", brand, number), "partId": part_id,
            "issuerManufacturerId": sid("manufacturer", brand), "number": number,
            "normalizedNumber": number, "numberType": "oem", "isPrimary": True,
        })
        seen_aliases = set()
        for alias in sorted(descriptions):
            alias_key = clean_text(alias).casefold()
            if alias_key in seen_aliases:
                continue
            seen_aliases.add(alias_key)
            if alias_key != clean_text(canonical).casefold():
                aliases.append({"id": sid("part-alias", part_id, alias), "partId": part_id, "alias": alias,
                                "sourceDocumentId": docs[brand]["id"]})

    section_ids = {}
    occurrence_seen = set()
    fitment_seen = set()
    fitments = []
    for row in rows:
        system_id = sid("system", row["system"])
        systems_by_name.setdefault(row["system"], {"id": system_id, "name": row["system"]})
        subsystem_id = sid("subsystem", system_id, row["subsystem"])
        subsystems_by_key.setdefault((row["system"], row["subsystem"]), {
            "id": subsystem_id, "systemId": system_id, "name": row["subsystem"],
        })
        assembly_id = sid("assembly", subsystem_id, row["title"])
        assemblies_by_key.setdefault((row["brand"], row["title"]), {
            "id": assembly_id, "subsystemId": subsystem_id, "name": row["title"].title(),
        })
        part_id = part_ids[(row["brand"], norm_identifier(row["number"]))]
        for model in row["models"]:
            variant_id = variant_ids[(row["brand"], model)]
            section_key = (variant_id, docs[row["brand"]]["id"], row["page"], assembly_id)
            if section_key not in section_ids:
                section_id = sid("section", *section_key)
                section_ids[section_key] = section_id
                sections.append({
                    "id": section_id, "modelVariantId": variant_id, "assemblyId": assembly_id,
                    "sourceDocumentId": docs[row["brand"]]["id"], "sectionKey": f"page-{row['page']}",
                    "title": row["title"].title(), "sortOrder": row["page"], "pageNumber": row["page"],
                    "diagramPageNumber": row["diagramPage"],
                    "diagramUrl": (f"/diagrams/hagie-2100/p{row['diagramPage']}.png" if row["brand"] == "Hagie"
                                   else f"/diagrams/macdon-d60-fd70-rev-e/p{row['diagramPage']}.webp"),
                })
            section_id = section_ids[section_key]
            occurrence_key = (section_id, row["recordKey"], row["number"])
            if occurrence_key in occurrence_seen:
                continue
            occurrence_seen.add(occurrence_key)
            occurrence_id = sid("occurrence", *occurrence_key)
            source_location_id = sid("source-location", docs[row["brand"]]["id"], row["page"], model, row["recordKey"])
            occurrences.append({
                "id": occurrence_id, "catalogSectionId": section_id, "partId": part_id,
                "occurrenceKey": f"{row['recordKey']}-{norm_identifier(row['number'])}",
                "illustrationReference": row["ref"], "quantity": row["quantity"],
                "quantityText": row["quantityText"], "positionName": row["description"],
                "serialApplicability": row["serial"], "occurrenceStatus": "verified",
                "sourceLocationId": source_location_id,
            })
            provenance.append({
                "id": source_location_id, "sourceDocumentId": docs[row["brand"]]["id"],
                "pageNumber": row["page"], "sectionHeading": row["title"],
                "sourceRecordKey": f"{model}:{row['recordKey']}",
                "sourcePayload": {k: row[k] for k in ("ref", "quantityText", "number", "description", "serial")},
            })
            fitment_key = (part_id, variant_id, row["serial"] or "all")
            if fitment_key not in fitment_seen:
                fitment_seen.add(fitment_key)
                fitments.append({
                    "id": sid("fitment", *fitment_key), "partId": part_id,
                    "modelVariantId": variant_id, "serialRangeText": row["serial"],
                    "applicabilityType": "fits", "verificationStatus": "verified",
                    "notes": f"Verified occurrence in {row['title']}, source page {row['page']}",
                })

    return {
        "schemaVersion": 1,
        "pilotNotice": "Source-backed pilot catalog. Legacy and backup catalogs were not migrated.",
        "sourceOrganizations": [
            {"id": sid("source-org", "Hagie Manufacturing"), "name": "Hagie Manufacturing", "type": "manufacturer"},
            {"id": sid("source-org", "MacDon Industries"), "name": "MacDon Industries", "type": "manufacturer"},
        ],
        "sourceDocuments": list(docs.values()), "manufacturers": manufacturers,
        "machineTypes": machine_types, "models": machines, "modelVariants": variants,
        "serialRanges": serial_ranges, "systems": list(systems_by_name.values()),
        "subsystems": list(subsystems_by_key.values()), "assemblies": list(assemblies_by_key.values()),
        "catalogSections": sections, "parts": parts, "partNumbers": part_numbers,
        "partNameAliases": aliases, "partOccurrences": occurrences, "fitments": fitments,
        "sourceLocations": provenance,
    }


def validate(snapshot: dict) -> dict:
    def ids(name: str) -> set[str]:
        values = [row["id"] for row in snapshot[name]]
        if len(values) != len(set(values)):
            raise ValueError(f"Duplicate IDs in {name}")
        return set(values)

    tables = {name: ids(name) for name, value in snapshot.items() if isinstance(value, list) and value and "id" in value[0]}
    if len(snapshot["models"]) != 3:
        raise ValueError("Pilot must contain exactly three models")
    number_keys = [(row["issuerManufacturerId"], row["normalizedNumber"]) for row in snapshot["partNumbers"]]
    if len(number_keys) != len(set(number_keys)):
        raise ValueError("Duplicate manufacturer-scoped part number")
    for row in snapshot["partOccurrences"]:
        if row["partId"] not in tables["parts"] or row["catalogSectionId"] not in tables["catalogSections"]:
            raise ValueError("Broken occurrence foreign key")
        if not row["sourceLocationId"] in tables["sourceLocations"]:
            raise ValueError("Occurrence missing provenance")
    counts = {}
    for model in snapshot["models"]:
        variant = next(v for v in snapshot["modelVariants"] if v["modelId"] == model["id"])
        section_ids = {s["id"] for s in snapshot["catalogSections"] if s["modelVariantId"] == variant["id"]}
        occurrences = [o for o in snapshot["partOccurrences"] if o["catalogSectionId"] in section_ids]
        counts[model["displayName"]] = {
            "systems": len({next(subsystem["systemId"] for subsystem in snapshot["subsystems"]
                                 if subsystem["id"] == next(a["subsystemId"] for a in snapshot["assemblies"] if a["id"] == s["assemblyId"]))
                            for s in snapshot["catalogSections"] if s["id"] in section_ids}),
            "assemblies": len({s["assemblyId"] for s in snapshot["catalogSections"] if s["id"] in section_ids}),
            "occurrences": len(occurrences), "uniqueParts": len({o["partId"] for o in occurrences}),
        }
    return {
        "status": "valid", "machines": counts,
        "totals": {name: len(value) for name, value in snapshot.items() if isinstance(value, list)},
        "manufacturerScopedPartNumbersUnique": True,
        "everyOccurrenceHasSourceLocation": True,
        "legacyCatalogMigrated": False,
    }


def render_diagrams(snapshot: dict) -> None:
    """Render the exact pinned source page used by each browse section."""
    sources = {"Hagie": fitz.open(HAGIE_PDF), "MacDon": fitz.open(MACDON_PDF)}
    jobs = set()
    for section in snapshot["catalogSections"]:
        brand = "Hagie" if "hagie-2100" in section["diagramUrl"] else "MacDon"
        jobs.add((brand, section["diagramPageNumber"], section["diagramUrl"]))
    for brand, page_number, url in sorted(jobs):
        destination = ROOT / "public" / url.lstrip("/")
        if destination.exists():
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        page = sources[brand][page_number - 1]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.35, 1.35), alpha=False)
        if destination.suffix == ".webp":
            image = Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB")
            image.save(destination, "WEBP", quality=80, method=6)
        else:
            pixmap.save(destination)


def main() -> int:
    for source in (HAGIE_PDF, MACDON_PDF):
        if not source.exists():
            raise FileNotFoundError(source)
    rows = parse_hagie() + parse_macdon()
    snapshot = build_snapshot(rows)
    report = validate(snapshot)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n")
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    render_diagrams(snapshot)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"pilot build failed: {exc}", file=sys.stderr)
        raise

#!/usr/bin/env python3
"""Integrity checks for the review-only Degelman Pro-Till staging bundle."""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BUNDLE_PATH = ROOT / "data/catalog-staging/degelman-pro-till-ptl4652.json"
EXPECTED_SHA256 = "b45316d414efb9f9f4a7de0d9de9c00294fbf9dd1ff9e716769695c1857cb4ed"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    bundle = json.loads(BUNDLE_PATH.read_text(encoding="utf-8"))
    require(bundle["status"] == "needs_review", "bundle must remain needs_review")
    require(bundle["promotion_attempted"] is False, "promotion must not be attempted")
    require(bundle["database_write_performed"] is False, "builder must not write a database")
    require(bundle["promotion_batches"] == [], "builder must not create a promotion batch")
    require(bundle["import_files"][0]["content_sha256"] == EXPECTED_SHA256, "source hash drift")
    require(bundle["import_files"][0]["storage_uri"].startswith("https://degelman.com/"), "source must be official")
    require(bundle["summary"]["page_images_in_bundle"] == 0, "manual images must not ship")

    raw_records = bundle["raw_records"]
    candidates = bundle["entity_candidates"]
    issues = bundle["validation_issues"]
    require(len({row["id"] for row in raw_records}) == len(raw_records), "duplicate raw-record ID")
    require(len({row["source_record_key"] for row in raw_records}) == len(raw_records), "duplicate raw-record key")
    require(len({row["id"] for row in candidates}) == len(candidates), "duplicate candidate ID")
    require(len({row["id"] for row in issues}) == len(issues), "duplicate issue ID")
    require(not any(row["resolution_status"] in {"approved", "promoted"} for row in candidates),
            "staging candidates cannot be approved/promoted by the builder")
    require(not any(row["severity"] == "blocking" for row in issues), "unexpected blocking issue")

    by_type = defaultdict(list)
    for candidate in candidates:
        by_type[candidate["entity_type"]].append(candidate)
    variants = {row["canonical_payload"]["variant_code"] for row in by_type["variant"]}
    require(variants == {"20", "20HD", "26", "26HD"}, "combined manual variants were flattened or changed")
    require(len(by_type["serial_range"]) == 6, "expected four PTL4652+ and two PTL5988+ ranges")
    ptl5988 = [row for row in by_type["serial_range"] if row["canonical_payload"]["serial_from"] == "PTL5988"]
    require({row["canonical_payload"]["variant_key"].split(":")[-1] for row in ptl5988} == {"26", "26hd"},
            "PTL5988+ 4 m range must be scoped to 26/26HD")

    mention_records = [row for row in raw_records if row["source_record_key"].startswith("mention:")]
    require(len(mention_records) == 725, "pinned extraction mention count drift")
    require(all(row["page_number"] in range(32, 57) for row in mention_records), "mention outside parts section")
    require(all(row["raw_payload"]["provenance"]["source_sha256"] == EXPECTED_SHA256 for row in mention_records),
            "record-level source hash missing")
    require(all(row["raw_payload"]["provenance"]["pdf_page"] == row["page_number"] for row in mention_records),
            "record page/provenance mismatch")
    require(all(len(row["raw_payload"]["provenance"]["bbox_points"]) == 4 for row in mention_records),
            "source bounding box missing")

    number_keys = {row["candidate_key"] for row in by_type["part_number"]}
    part_keys = {row["candidate_key"] for row in by_type["part"]}
    require(len(number_keys) == 376, "manufacturer-scoped part-number count drift")
    require(len(part_keys) == 376, "master part candidates must deduplicate by Degelman number")
    require(all(key.startswith("degelman:") and key.split(":", 1)[1].isalnum() for key in number_keys),
            "part-number identity is not manufacturer-scoped and normalized")
    require(all(row["canonical_payload"]["issuer_manufacturer_key"] == "degelman" for row in by_type["part_number"]),
            "part-number issuer scope missing")

    sections = {row["candidate_key"] for row in by_type["catalog_section"]}
    occurrence_counts = Counter()
    occurrence_sections = defaultdict(set)
    for row in by_type["part_occurrence"]:
        payload = row["canonical_payload"]
        require(payload["catalog_section_key"] in sections, "occurrence points to unknown section")
        require(payload["part_key"] in part_keys, "occurrence points to unknown master part")
        require(payload["part_number_key"] in number_keys, "occurrence points to unknown part number")
        occurrence_counts[payload["part_key"]] += 1
        occurrence_sections[payload["part_key"]].add(payload["catalog_section_key"])
    require(any(count > 4 for count in occurrence_counts.values()),
            "repeated parts were flattened instead of represented as occurrences")
    require(any(len(section_keys) > 4 for section_keys in occurrence_sections.values()),
            "shared master part is not represented across multiple assemblies/variants")
    require(len(by_type["part_occurrence"]) == bundle["summary"]["part_occurrence_candidates"],
            "occurrence summary mismatch")

    ptl5988_occurrences = [
        row for row in by_type["part_occurrence"]
        if row["canonical_payload"]["serial_range_key"].endswith(":ptl5988-plus")
    ]
    require(ptl5988_occurrences, "PTL5988+ scraper occurrences missing")
    require(all(":p47:" in row["candidate_key"] for row in ptl5988_occurrences),
            "PTL5988+ scope leaked outside source page 41/PDF page 47")
    require(all(any(token in row["canonical_payload"]["serial_range_key"] for token in (":26:", ":26hd:"))
                for row in ptl5988_occurrences), "PTL5988+ occurrence assigned to a 20 ft variant")

    print(json.dumps({
        "status": "passed",
        "source_mentions": len(mention_records),
        "master_part_identities": len(number_keys),
        "occurrence_candidates": len(by_type["part_occurrence"]),
        "validation_issues_retained": len(issues),
        "promotion_attempted": False,
    }, indent=2))


if __name__ == "__main__":
    main()

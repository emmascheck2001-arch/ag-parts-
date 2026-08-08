#!/usr/bin/env python3
"""Integrity checks for the source-backed three-machine pilot snapshot."""

import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = ROOT / "public/catalog/three-machine-pilot.json"


def main() -> None:
    catalog = json.loads(SNAPSHOT.read_text())
    assert len(catalog["models"]) == 3

    ids = {}
    for name, rows in catalog.items():
        if isinstance(rows, list) and rows and "id" in rows[0]:
            values = [row["id"] for row in rows]
            assert len(values) == len(set(values)), f"duplicate ID in {name}"
            ids[name] = set(values)

    scoped_numbers = [(row["issuerManufacturerId"], row["normalizedNumber"]) for row in catalog["partNumbers"]]
    assert len(scoped_numbers) == len(set(scoped_numbers)), "duplicate manufacturer-scoped number"

    sections = {row["id"]: row for row in catalog["catalogSections"]}
    placements = defaultdict(set)
    occurrence_keys = set()
    for occurrence in catalog["partOccurrences"]:
        assert occurrence["partId"] in ids["parts"]
        assert occurrence["catalogSectionId"] in ids["catalogSections"]
        assert occurrence["sourceLocationId"] in ids["sourceLocations"]
        identity = (occurrence["catalogSectionId"], occurrence["occurrenceKey"])
        assert identity not in occurrence_keys, "duplicate section occurrence key"
        occurrence_keys.add(identity)
        placements[occurrence["partId"]].add(sections[occurrence["catalogSectionId"]]["assemblyId"])

    assert any(len(assemblies) > 1 for assemblies in placements.values()), "no repeated part across assemblies"
    for section in catalog["catalogSections"]:
        diagram = ROOT / "public" / section["diagramUrl"].lstrip("/")
        assert diagram.exists(), f"missing diagram {diagram}"

    variants = {row["modelId"]: row["id"] for row in catalog["modelVariants"]}
    for model in catalog["models"]:
        section_ids = {row["id"] for row in catalog["catalogSections"] if row["modelVariantId"] == variants[model["id"]]}
        occurrences = [row for row in catalog["partOccurrences"] if row["catalogSectionId"] in section_ids]
        assert occurrences, f"no occurrences for {model['displayName']}"
        assert len({sections[row["catalogSectionId"]]["assemblyId"] for row in occurrences}) >= 40

    hagie = next(row for row in catalog["models"] if row["modelCode"] == "2100")
    hagie_range = next(row for row in catalog["serialRanges"] if row["modelVariantId"] == variants[hagie["id"]])
    assert hagie_range["serialFrom"] == "U1400000001"
    assert hagie_range["serialTo"] == "U1400000100"

    print(f"Pilot integrity passed: 3 machines, {len(catalog['parts'])} master parts, {len(catalog['partOccurrences'])} sourced occurrences.")


if __name__ == "__main__":
    main()

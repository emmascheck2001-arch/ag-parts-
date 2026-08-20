import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { UIIcon } from "../components/icons";
import { resolveDiagramAssetUrl } from "../lib/diagram-assets";
import { getManualDiagramHotspot } from "../lib/diagram-hotspot-overrides";
import { resolveMachineManual } from "../lib/machine-manual";
import { detectDiagramCallouts, normalizeCalloutRef } from "../lib/hardware-measure";
import { isHarvestFocusMachine, marketFocusLabel } from "../lib/market-focus";
import { expandPilotQuery, loadPilotCatalog } from "../lib/pilot-catalog";
import { buildSearchTermGroups } from "../lib/search-language";

const Arrow = () => <span className="pilot-arrow">›</span>;

// How many other manual pages we will probe looking for an illustration when the
// current page turns out to be a parts table. Each probe is a network round trip.
const MAX_VISUAL_PAGE_PROBES = 4;

function compareCalloutRefs(a, b) {
  const aa = String(a || "").trim();
  const bb = String(b || "").trim();
  const an = /^\d+$/.test(aa) ? Number(aa) : null;
  const bn = /^\d+$/.test(bb) ? Number(bb) : null;
  if (an != null && bn != null) return an - bn;
  if (an != null) return -1;
  if (bn != null) return 1;
  return aa.localeCompare(bb, undefined, { numeric: true, sensitivity: "base" });
}

function sanitizeCalloutRef(value) {
  const normalized = normalizeCalloutRef(value);
  return normalized || null;
}

function looksLikeCalloutCandidate(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed.length > 12) return false;
  if (!/[A-Za-z0-9]/.test(trimmed)) return false;
  const alphaOnly = trimmed.replace(/[^A-Za-z]/g, "");
  return alphaOnly.length <= 3;
}

function calloutRefForOccurrence(occurrence) {
  const direct = sanitizeCalloutRef(occurrence?.illustrationReference);
  if (direct) return direct;
  if (looksLikeCalloutCandidate(occurrence?.positionName)) {
    return sanitizeCalloutRef(occurrence.positionName);
  }
  return null;
}

function collectOccurrenceRefs(occurrences = []) {
  return [...new Set(occurrences.map((occurrence) => calloutRefForOccurrence(occurrence)).filter(Boolean))]
    .sort(compareCalloutRefs);
}

function occurrenceMatchesRef(occurrence, ref) {
  return calloutRefForOccurrence(occurrence) === ref;
}

function groupOccurrencesByPart(index, occurrences = []) {
  const grouped = new Map();
  for (const occurrence of occurrences) {
    const value = grouped.get(occurrence.partId) || { partId: occurrence.partId, occurrences: [] };
    value.occurrences.push(occurrence);
    grouped.set(occurrence.partId, value);
  }
  return [...grouped.values()].sort((a, b) =>
    index.parts.get(a.partId).canonicalName.localeCompare(index.parts.get(b.partId).canonicalName));
}

function buildPrimaryHaystack(part, number, aliases = []) {
  return `${part.canonicalName} ${number?.number || ""} ${aliases.join(" ")}`.toLowerCase();
}

function buildContextHaystack(assemblyValue) {
  const sectionNames = assemblyValue.sections.map((section) => section.title).join(" ");
  return `${assemblyValue.assembly.name} ${assemblyValue.subsystem.name} ${assemblyValue.system.name} ${sectionNames}`.toLowerCase();
}

function matchPilotSearch(primaryHaystack, contextHaystack, group) {
  const primaryMatch = group.some((variant) => primaryHaystack.includes(variant));
  const contextMatch = group.some((variant) => contextHaystack.includes(variant));
  return { primaryMatch, contextMatch, matched: primaryMatch || contextMatch };
}

function countLabel(count, noun) {
  return `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;
}

function compactList(values = [], limit = 3) {
  const unique = [...new Set(values.filter(Boolean))];
  if (unique.length <= limit) return unique.join(" · ");
  return `${unique.slice(0, limit).join(" · ")} +${unique.length - limit} more`;
}

function partNumberTypeLabel(number) {
  return number?.numberType === "aftermarket" ? "Aftermarket" : "OEM";
}

function primarySourceDocument(raw) {
  const documents = raw?.sourceDocuments || [];
  return documents.find((document) => document.documentType === "parts_catalog") || documents[0] || null;
}

function sanitizeAssemblyLabel(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= 120) return normalized;
  const itemMarker = normalized.search(/\sItem\s+\d+\b/i);
  if (itemMarker > 0) return normalized.slice(0, itemMarker).trim();
  return normalized;
}

function dedupeHotspots(hotspots) {
  const seen = new Set();
  return hotspots.filter((hotspot) => {
    const key = [
      hotspot.ref,
      Math.round((hotspot.x || 0) * 1000),
      Math.round((hotspot.y || 0) * 1000),
      Math.round((hotspot.width || 0) * 1000),
      Math.round((hotspot.height || 0) * 1000),
    ].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collapseNearbyHotspots(hotspots) {
  const collapsed = [];
  for (const hotspot of hotspots) {
    const centerX = (Number(hotspot.x) || 0) + ((Number(hotspot.width) || 0) / 2);
    const centerY = (Number(hotspot.y) || 0) + ((Number(hotspot.height) || 0) / 2);
    const duplicate = collapsed.find((value) => {
      if (value.ref !== hotspot.ref) return false;
      const valueCenterX = (Number(value.x) || 0) + ((Number(value.width) || 0) / 2);
      const valueCenterY = (Number(value.y) || 0) + ((Number(value.height) || 0) / 2);
      return Math.abs(centerX - valueCenterX) <= 0.035 && Math.abs(centerY - valueCenterY) <= 0.035;
    });
    if (!duplicate) collapsed.push(hotspot);
  }
  return collapsed;
}

function classifyHotspotLayout(hotspots = []) {
  if (hotspots.length === 0) return { layout: "unknown", hotspots: [] };
  const centers = hotspots.map((hotspot) => ({
    hotspot,
    x: (Number(hotspot.x) || 0) + ((Number(hotspot.width) || 0) / 2),
    y: (Number(hotspot.y) || 0) + ((Number(hotspot.height) || 0) / 2),
  })).sort((a, b) => a.y - b.y);

  const summarize = (values) => {
    const xs = values.map((value) => value.x);
    const ys = values.map((value) => value.y);
    return {
      averageX: xs.reduce((sum, value) => sum + value, 0) / xs.length,
      averageY: ys.reduce((sum, value) => sum + value, 0) / ys.length,
      xSpread: Math.max(...xs) - Math.min(...xs),
      ySpread: Math.max(...ys) - Math.min(...ys),
    };
  };

  let widestGap = 0;
  let splitIndex = -1;
  for (let index = 1; index < centers.length; index += 1) {
    const gap = centers[index].y - centers[index - 1].y;
    if (gap > widestGap) {
      widestGap = gap;
      splitIndex = index;
    }
  }

  if (widestGap >= 0.1 && splitIndex > 1 && splitIndex < centers.length) {
    const upper = centers.slice(0, splitIndex);
    const lower = centers.slice(splitIndex);
    const upperStats = summarize(upper);
    const lowerStats = summarize(lower);
    const lowerLooksLikeTable =
      lower.length >= 2 &&
      lowerStats.averageY >= 0.58 &&
      lowerStats.averageY - upperStats.averageY >= 0.2;
    const upperLooksLikeIllustration = upper.length >= 2;
    if (lowerLooksLikeTable && upperLooksLikeIllustration) {
      return { layout: "visual", hotspots: upper.map((value) => value.hotspot) };
    }
  }

  if (hotspots.length < 4) return { layout: "visual", hotspots };
  const { averageX, xSpread, ySpread } = summarize(centers);
  const leftColumn = centers.filter((value) => value.x <= 0.28);
  const centerBand = centers.filter((value) => value.x > 0.28 && value.x < 0.62);
  const farRight = centers.filter((value) => value.x >= 0.62);
  const mostlyLeftColumn =
    leftColumn.length >= Math.ceil(centers.length * 0.7) &&
    ySpread >= 0.28 &&
    centerBand.length <= 2 &&
    farRight.length <= 2;
  const tightlyStackedLeftColumn = averageX <= 0.24 && xSpread <= 0.08 && ySpread >= 0.18;
  return { layout: mostlyLeftColumn || tightlyStackedLeftColumn ? "table" : "visual", hotspots };
}

function scoreIllustrationHotspot(hotspot) {
  if (!hotspot) return Number.NEGATIVE_INFINITY;
  const centerX = (Number(hotspot.x) || 0) + ((Number(hotspot.width) || 0) / 2);
  const centerY = (Number(hotspot.y) || 0) + ((Number(hotspot.height) || 0) / 2);
  const width = Math.max(Number(hotspot.width) || 0, 0.001);
  const height = Math.max(Number(hotspot.height) || 0, 0.001);

  let score = 0;

  // Real diagram callouts are rarely parked in the left table column.
  if (centerX <= 0.20) score -= 4;
  else if (centerX <= 0.25) score -= 2.5;
  else if (centerX >= 0.34) score += 1.5;
  else score += 0.4;

  // Lower-page illustrations are valid, but deep lower-left hits usually come from the parts table.
  if (centerX <= 0.24 && centerY >= 0.54) score -= 4.5;
  else if (centerX <= 0.28 && centerY >= 0.64) score -= 2.5;
  else if (centerY <= 0.68) score += 0.8;

  // Prefer moderately sized labels over tiny OCR fragments.
  if (width >= 0.016 && height >= 0.016) score += 0.6;
  if (width <= 0.008 || height <= 0.008) score -= 1.5;

  return score;
}

function centeredBackgroundPercent(center, scale) {
  if (!Number.isFinite(center) || !Number.isFinite(scale) || scale <= 1) return 50;
  const value = ((0.5 - (center * scale)) / (1 - scale)) * 100;
  return Math.max(0, Math.min(100, value));
}

function derivePreviewFrameFromHotspot(hotspot) {
  if (!hotspot) return null;
  const centerX = (Number(hotspot.x) || 0) + ((Number(hotspot.width) || 0) / 2);
  const centerY = (Number(hotspot.y) || 0) + ((Number(hotspot.height) || 0) / 2);
  const width = Math.max(Number(hotspot.width) || 0, 0.001);
  const height = Math.max(Number(hotspot.height) || 0, 0.001);

  return {
    centerX: centerX + Math.max(-0.16, Math.min(0.16, (0.60 - centerX) * 0.8)),
    centerY: centerY + Math.max(-0.12, Math.min(0.18, (0.54 - centerY) * 0.95)),
    scale: Math.max(2.4, Math.min(4.2, 0.11 / Math.max(width, height))),
  };
}

function hotspotForRef(diagramUrl, ref, hotspots = []) {
  const detected = hotspots
    .filter((hotspot) => hotspot.ref === ref)
    .sort((left, right) => scoreIllustrationHotspot(right) - scoreIllustrationHotspot(left))[0] || null;
  if (detected) return detected;
  return getManualDiagramHotspot(diagramUrl, ref);
}

export function PilotCatalog({ modelId, initialQuery = "", onBack, onScan }) {
  const [index, setIndex] = useState(null);
  const [error, setError] = useState("");
  const [systemId, setSystemId] = useState(null);
  const [subsystemId, setSubsystemId] = useState(null);
  const [assemblyId, setAssemblyId] = useState(null);
  const [partId, setPartId] = useState(null);
  const [partRef, setPartRef] = useState(null);
  const [partHotspot, setPartHotspot] = useState(null);
  const [partSectionId, setPartSectionId] = useState(null);
  const [query, setQuery] = useState("");
  const [searchRequest, setSearchRequest] = useState("");
  const [showAssemblies, setShowAssemblies] = useState(false);
  const [limit, setLimit] = useState(80);
  const searchInputRef = useRef(null);
  const scrollRef = useRef(null);
  const scrollViewKey = `${modelId}:${systemId || "root"}:${subsystemId || "root"}:${assemblyId || "root"}:${partId || "root"}:${partRef || "all"}:${searchRequest || ""}:${showAssemblies ? "browse" : "default"}`;

  useEffect(() => {
    let live = true;
    setIndex(null);
    setError("");
    loadPilotCatalog(modelId).then((value) => live && setIndex(value)).catch((reason) => live && setError(reason.message));
    return () => { live = false; };
  }, [modelId]);

  useEffect(() => setLimit(80), [assemblyId, query]);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollViewKey]);

  useEffect(() => {
    setQuery(initialQuery || "");
    setSearchRequest(initialQuery || "");
    setShowAssemblies(false);
    setPartId(null);
    setPartRef(null);
    setPartHotspot(null);
    setPartSectionId(null);
    setAssemblyId(null);
    setSubsystemId(null);
    setSystemId(null);
  }, [initialQuery, modelId]);

  const view = useMemo(() => {
    if (!index) return null;
    const machine = index.machineById.get(modelId) || index.machines.find((item) => item.id === modelId);
    if (!machine) return null;
    const sourceDocument = primarySourceDocument(index.raw);
    const sections = index.sectionsByVariant.get(machine.variantId) || [];
    const assemblies = new Map();
    for (const section of sections) {
      const assembly = index.assemblies.get(section.assemblyId);
      const subsystem = index.subsystems.get(assembly.subsystemId);
      const system = index.systems.get(subsystem.systemId);
      const assemblyName = sanitizeAssemblyLabel(assembly.name);
      const assemblyKey = `${subsystem.id}:${assemblyName.toLowerCase()}`;
      const value = assemblies.get(assemblyKey) || {
        assembly: { ...assembly, id: assemblyKey, name: assemblyName },
        subsystem,
        system,
        sections: [],
        occurrences: [],
      };
      value.sections.push({
        ...section,
        title: sanitizeAssemblyLabel(section.title) || assemblyName,
      });
      value.occurrences.push(...(index.occurrencesBySection.get(section.id) || []));
      assemblies.set(assemblyKey, value);
    }
    const assemblyValues = [...assemblies.values()];
    const systems = [...new Map(assemblyValues.map((value) => [value.system.id, value.system])).values()]
      .map((system) => ({
        ...system,
        assemblies: assemblyValues.filter((value) => value.system.id === system.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { machine: { ...machine, sourceDocument }, assemblies, systems };
  }, [index, modelId]);

  if (error) return <div className="screen active"><TopBar title="Verified catalog" onBack={onBack} /><div className="pilot-state">{error}</div></div>;
  if (!view) return <div className="screen active"><TopBar title="Verified catalog" onBack={onBack} /><div className="pilot-state">Loading source-backed catalog…</div></div>;

  const currentSystem = view.systems.find((system) => system.id === systemId);
  const currentSubsystem = index.subsystems.get(subsystemId);
  const currentAssembly = view.assemblies.get(assemblyId);
  const currentPart = index.parts.get(partId);
  const currentNumber = index.numbersByPart.get(partId);
  const terms = buildSearchTermGroups(searchRequest);

  const resetBelow = (level) => {
    if (level === "machine") setSystemId(null);
    if (["machine", "system"].includes(level)) setSubsystemId(null);
    if (["machine", "system", "subsystem"].includes(level)) setAssemblyId(null);
    setPartId(null);
    setPartRef(null);
    setPartHotspot(null);
    setPartSectionId(null);
    setQuery("");
    setSearchRequest("");
    setShowAssemblies(true);
  };

  const clearPart = () => {
    setPartId(null);
    setPartRef(null);
    setPartHotspot(null);
    setPartSectionId(null);
  };

  const openPart = (assemblyValue, occurrence, preview = null) => {
    setSystemId(assemblyValue.system.id);
    setSubsystemId(assemblyValue.subsystem.id);
    setAssemblyId(assemblyValue.assembly.id);
    setPartId(occurrence.partId);
    setPartRef(calloutRefForOccurrence(occurrence));
    setPartHotspot(preview?.hotspot || null);
    setPartSectionId(preview?.sectionId || occurrence.catalogSectionId || null);
    setQuery("");
    setSearchRequest("");
  };

  const openAssembly = (assemblyValue) => {
    setSystemId(assemblyValue.system.id);
    setSubsystemId(assemblyValue.subsystem.id);
    setAssemblyId(assemblyValue.assembly.id);
    setPartId(null);
    setPartRef(null);
    setPartHotspot(null);
    setPartSectionId(null);
    setQuery("");
    setSearchRequest("");
  };

  const submitSearch = () => {
    const value = query.trim();
    if (!value) {
      searchInputRef.current?.focus();
      return;
    }
    setSearchRequest(value);
    setShowAssemblies(false);
    setPartId(null);
    setPartRef(null);
    setPartHotspot(null);
    setPartSectionId(null);
    setAssemblyId(null);
    setSubsystemId(null);
    setSystemId(null);
  };

  const groupedParts = (assemblyValue) => groupOccurrencesByPart(index, assemblyValue.occurrences);

  const searchResults = terms.length ? [...view.assemblies.values()].flatMap((assemblyValue) =>
    groupedParts(assemblyValue).flatMap((value) => {
      const part = index.parts.get(value.partId);
      const number = index.numbersByPart.get(value.partId);
      const aliases = index.aliasesByPart.get(value.partId) || [];
      const primaryHaystack = `${buildPrimaryHaystack(part, number, aliases)} ${expandPilotQuery(buildPrimaryHaystack(part, number, aliases)).join(" ")}`;
      const contextHaystack = `${buildContextHaystack(assemblyValue)} ${expandPilotQuery(buildContextHaystack(assemblyValue)).join(" ")}`;
      const matches = terms.map((group) => matchPilotSearch(primaryHaystack, contextHaystack, group));
      const allMatched = matches.every((match) => match.matched);
      const primaryHits = matches.filter((match) => match.primaryMatch).length;
      if (!allMatched || primaryHits === 0) return [];
      return [{
        ...value,
        assemblyValue,
        primaryHits,
        contextHits: matches.filter((match) => match.contextMatch && !match.primaryMatch).length,
      }];
    })
  ).sort((a, b) =>
    b.primaryHits - a.primaryHits ||
    a.contextHits - b.contextHits ||
    index.parts.get(a.partId).canonicalName.localeCompare(index.parts.get(b.partId).canonicalName)
  ) : [];

  const machineBack = () => {
    if (partId) {
      setPartId(null);
      setPartRef(null);
      setPartHotspot(null);
      setPartSectionId(null);
      return;
    }
    if (assemblyId || subsystemId || systemId) {
      setAssemblyId(null);
      setSubsystemId(null);
      setSystemId(null);
      setShowAssemblies(true);
      return;
    }
    onBack();
  };

  let title = view.machine.displayName;
  if (currentSystem) title = currentSystem.name;
  if (currentSubsystem) title = currentSubsystem.name;
  if (currentAssembly) title = currentAssembly.assembly.name;
  if (currentPart) title = currentNumber.number;

  const isMachineLanding = !partId && !currentAssembly && !searchRequest && !showAssemblies;

  return (
    <div className="screen active pilot-catalog">
      <TopBar title={title} onBack={machineBack} right="✓" />
      <div className="scroll" ref={scrollRef} key={scrollViewKey}>
        <div className="pilot-wrap">
          {/* Only the levels that are real destinations get a crumb. The browse
              view lists every system at once, so manufacturer / type / system /
              subsystem are machine identity, not places you can navigate to —
              they read as static context. */}
          {!isMachineLanding && (
            <nav className="pilot-breadcrumbs" aria-label="Catalog path">
              <span className="pilot-breadcrumbs__context">
                {view.machine.manufacturer} · {view.machine.machineType} · {view.machine.modelCode}
              </span>

              <span aria-hidden="true">›</span>
              {currentAssembly || partId || terms.length > 0
                ? <button onClick={() => resetBelow("machine")}>All assemblies</button>
                : <span aria-current="page">All assemblies</span>}

              {currentAssembly && (
                <>
                  <span aria-hidden="true">›</span>
                  {partId
                    ? <button onClick={clearPart}>{sanitizeAssemblyLabel(currentAssembly.assembly.name)}</button>
                    : <span aria-current="page">{sanitizeAssemblyLabel(currentAssembly.assembly.name)}</span>}
                </>
              )}

              {partId && currentNumber && (
                <>
                  <span aria-hidden="true">›</span>
                  <span aria-current="page">{currentNumber.number}</span>
                </>
              )}
            </nav>
          )}

          {isMachineLanding ? (
            <MachineWorkspace
              machine={view.machine}
              query={query}
              searchInputRef={searchInputRef}
              onQuery={setQuery}
              onSearch={submitSearch}
              onScan={() => onScan(view.machine.displayName)}
              onBrowse={() => { setQuery(""); setSearchRequest(""); setShowAssemblies(true); }}
              onChangeMachine={onBack}
            />
          ) : !partId && (
            <div className="pilot-findbar">
              <div className="pilot-search">
                <UIIcon.search width="20" height="20" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && submitSearch()}
                  placeholder="Part name or OEM number"
                  aria-label={`Search ${view.machine.displayName}`}
                  autoFocus={Boolean(initialQuery)}
                />
                {query && <button onClick={() => { setQuery(""); setSearchRequest(""); }}>Clear</button>}
              </div>
              <button className="pilot-find-button" onClick={submitSearch}>Find</button>
              <button className="pilot-scan" onClick={() => onScan(view.machine.displayName)}><UIIcon.camera width="20" height="20" /><strong>Photo</strong></button>
            </div>
          )}

          {terms.length > 0 && !partId ? (
            <section>
              <div className="pilot-heading"><div><span className="pilot-kicker">Across this machine</span><h2>Search results</h2></div><strong>{searchResults.length}</strong></div>
              <div className="pilot-list">
                {searchResults.slice(0, limit).map((value) => {
                  const part = index.parts.get(value.partId);
                  const number = index.numbersByPart.get(value.partId);
                  return <button key={`${value.assemblyValue.assembly.id}-${value.partId}`} className="pilot-row" onClick={() => openPart(value.assemblyValue, value.occurrences[0])}>
                    <span className="pilot-row-main"><strong>{part.canonicalName}</strong><small>{number.number} · {value.assemblyValue.assembly.name}</small></span><Arrow />
                  </button>;
                })}
                {!searchResults.length && <div className="pilot-empty">No verified match on this machine. Try the OEM number or a shorter part name.</div>}
              </div>
            </section>
          ) : partId ? (
            <PartView
              index={index}
              view={view}
              assemblyValue={currentAssembly}
              part={currentPart}
              number={currentNumber}
              selectedRef={partRef}
              initialHotspot={partHotspot}
              initialSectionId={partSectionId}
              onBack={() => {
                setPartId(null);
                setPartRef(null);
                setPartHotspot(null);
                setPartSectionId(null);
              }}
            />
          ) : currentAssembly ? (
            <AssemblyView index={index} assemblyValue={currentAssembly} groups={groupedParts(currentAssembly)} limit={limit}
              onMore={() => setLimit((value) => value + 80)} onPart={(occurrence, preview) => openPart(currentAssembly, occurrence, preview)} />
          ) : showAssemblies ? (
            <FastMachineBrowse view={view} groupedParts={groupedParts} onAssembly={openAssembly} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MachineWorkspace({ machine, query, searchInputRef, onQuery, onSearch, onScan, onBrowse, onChangeMachine }) {
  const nicheLabel = marketFocusLabel(machine);
  const manual = resolveMachineManual(machine);
  return <section className="fast-machine-hero pilot-machine-workspace" aria-label={`${machine.displayName} part finder`}>
    <div className="fast-step"><span>1</span> Your machine</div>
    <div className="fast-machine-hero__title">
      <div className="fast-machine-icon"><UIIcon.tractor width="30" height="30" /></div>
      <div>
        <h1>{machine.displayName}</h1>
        <p>{machine.manufacturer} · {machine.machineType}</p>
      </div>
      <button onClick={onChangeMachine}>Change</button>
    </div>
    <div className="pilot-machine-meta">
      <span>{nicheLabel}</span>
      <strong>{machine.partCount.toLocaleString()} verified parts</strong>
      <strong>{machine.assemblyCount} assemblies</strong>
    </div>
    <div className="pilot-source-strip">
      <span>
        <strong>Source</strong>
        <small>{manual.title || "Pinned source catalog"}</small>
      </span>
      {manual.available
        ? <a href={manual.url} target="_blank" rel="noreferrer">Open PDF</a>
        : <em className="pilot-source-strip__pending">Manual not published yet</em>}
    </div>

    <div className="fast-step fast-step--second"><span>2</span> What part do you need?</div>
    <div className="fast-part-search">
      <UIIcon.search width="20" height="20" />
      <input
        ref={searchInputRef}
        type="search"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && onSearch()}
        placeholder="Part name or OEM number"
        aria-label={`Search ${machine.displayName}`}
      />
      <button onClick={onSearch}>Find</button>
    </div>
    <div className="fast-actions">
      <button className="fast-action fast-action--primary" onClick={onScan}>
        <UIIcon.camera width="23" height="23" />
        <span><strong>Use a photo</strong><small>Photograph the part or tag</small></span>
      </button>
      <button className="fast-action" onClick={onBrowse}>
        <UIIcon.grid width="23" height="23" />
        <span><strong>Browse assemblies</strong><small>Manual diagrams and parts</small></span>
      </button>
    </div>
  </section>;
}

function FastMachineBrowse({ view, groupedParts, onAssembly }) {
  return <section className="pilot-fast-browse">
    <div className="pilot-machine-summary">
      <span className="pilot-kicker">{isHarvestFocusMachine(view.machine) ? "Harvest machine selected" : "Machine selected"}</span>
      <h2>{view.machine.displayName}</h2>
      <p>{view.machine.manufacturer} · {view.machine.machineType}</p>
      <div><span>1</span> Pick the exact assembly below to keep the part list short and machine-specific.</div>
    </div>
    <div className="pilot-heading pilot-heading--browse"><div><span className="pilot-kicker">Manual browse</span><h2>Assemblies by system</h2><p>Subsystems are shown for context—no extra screen required.</p></div></div>
    <div className="pilot-system-groups">
      {view.systems.map((system) => (
        <section key={system.id} className="pilot-system-group">
          <header><div><span>Major system</span><h3>{system.name}</h3></div><strong>{countLabel(system.assemblies.length, "assembly")}</strong></header>
          <div className="pilot-list">
            {[...system.assemblies]
              .sort((a, b) => a.assembly.name.localeCompare(b.assembly.name))
              .map((assemblyValue) => (
                <button key={assemblyValue.assembly.id} className="pilot-row" onClick={() => onAssembly(assemblyValue)}>
                  <span className="pilot-row-main">
                    <strong>{assemblyValue.assembly.name}</strong>
                    <small>{assemblyValue.subsystem.name} · {countLabel(groupedParts(assemblyValue).length, "part")} · page {assemblyValue.sections[0].pageNumber}</small>
                  </span>
                  <Arrow />
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  </section>;
}

function AssemblyView({ index, assemblyValue, groups, limit, onMore, onPart }) {
  const sections = useMemo(
    () => [...assemblyValue.sections].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0) || a.title.localeCompare(b.title)),
    [assemblyValue.sections],
  );
  const [sectionId, setSectionId] = useState(() => sections.find((section) => section.diagramUrl)?.id || sections[0]?.id || null);
  const [activeRef, setActiveRef] = useState(null);
  const [diagramHotspots, setDiagramHotspots] = useState([]);
  const [diagramHint, setDiagramHint] = useState("");
  const [diagramLayout, setDiagramLayout] = useState("unknown");
  const [autoPickVisualSection, setAutoPickVisualSection] = useState(true);
  const [searchingVisualPage, setSearchingVisualPage] = useState(false);

  useEffect(() => {
    setSectionId(sections.find((section) => section.diagramUrl)?.id || sections[0]?.id || null);
    setActiveRef(null);
    setDiagramLayout("unknown");
    setAutoPickVisualSection(true);
  }, [assemblyValue.assembly.id, sections]);

  const currentSection = sections.find((section) => section.id === sectionId) || sections[0] || null;
  const sectionOccurrences = useMemo(
    () => assemblyValue.occurrences.filter((item) => item.catalogSectionId === currentSection?.id),
    [assemblyValue.occurrences, currentSection?.id],
  );
  const sectionGroups = useMemo(() => groupOccurrencesByPart(index, sectionOccurrences), [index, sectionOccurrences]);
  const availableRefs = useMemo(
    () => collectOccurrenceRefs(sectionOccurrences),
    [sectionOccurrences],
  );
  const availableRefKey = useMemo(() => availableRefs.join("|"), [availableRefs]);

  useEffect(() => {
    let live = true;
    setDiagramHotspots([]);
    setDiagramHint("");
    setDiagramLayout("unknown");
    setSearchingVisualPage(false);

    if (!currentSection?.diagramUrl || availableRefs.length === 0) return () => { live = false; };

    const refByNormalized = new Map();
    for (const ref of availableRefs) {
      const normalized = normalizeCalloutRef(ref);
      if (normalized && !refByNormalized.has(normalized)) refByNormalized.set(normalized, ref);
    }

    detectDiagramCallouts({ diagramUrl: currentSection.diagramUrl, refs: availableRefs })
      .then((result) => {
        if (!live) return;
        setDiagramHint(result.notes || "");
        const mapped = dedupeHotspots((result.callouts || []).map((item, index) => {
          const resolvedRef = refByNormalized.get(item.normalizedRef || normalizeCalloutRef(item.ref)) || item.ref;
          if (!resolvedRef) return null;
          return {
            id: `${resolvedRef}:${index}:${item.x}:${item.y}`,
            ref: resolvedRef,
            x: Number(item.x) || 0,
            y: Number(item.y) || 0,
            width: Number(item.width) || 0,
            height: Number(item.height) || 0,
          };
        }).filter(Boolean));
        const classified = classifyHotspotLayout(collapseNearbyHotspots(mapped));
        setDiagramLayout(classified.layout);
        setDiagramHotspots(classified.hotspots);
        if (classified.layout === "table" && autoPickVisualSection && sections.length > 1) {
          // This probes other manual pages one at a time looking for an
          // illustration rather than a parts table. Each probe is a network
          // round trip, so cap it and tell the user it is happening instead of
          // stalling silently on a machine with many pages.
          setSearchingVisualPage(true);
          (async () => {
            let probes = 0;
            for (const section of sections) {
              if (section.id === currentSection?.id || !section.diagramUrl) continue;
              if (probes >= MAX_VISUAL_PAGE_PROBES) break;
              probes += 1;
              const sectionRefs = collectOccurrenceRefs(
                assemblyValue.occurrences.filter((item) => item.catalogSectionId === section.id),
              );
              if (sectionRefs.length === 0) continue;

              const altRefByNormalized = new Map();
              for (const ref of sectionRefs) {
                const normalized = normalizeCalloutRef(ref);
                if (normalized && !altRefByNormalized.has(normalized)) altRefByNormalized.set(normalized, ref);
              }

              try {
                const altResult = await detectDiagramCallouts({ diagramUrl: section.diagramUrl, refs: sectionRefs });
                if (!live) return;
                const altMapped = dedupeHotspots((altResult.callouts || []).map((item, index) => {
                  const resolvedRef = altRefByNormalized.get(item.normalizedRef || normalizeCalloutRef(item.ref)) || item.ref;
                  if (!resolvedRef) return null;
                  return {
                    id: `${resolvedRef}:${index}:${item.x}:${item.y}`,
                    ref: resolvedRef,
                    x: Number(item.x) || 0,
                    y: Number(item.y) || 0,
                    width: Number(item.width) || 0,
                    height: Number(item.height) || 0,
                  };
                }).filter(Boolean));
                const altClassified = classifyHotspotLayout(collapseNearbyHotspots(altMapped));
                if (altClassified.layout === "visual") {
                  setSectionId(section.id);
                  setAutoPickVisualSection(false);
                  setSearchingVisualPage(false);
                  return;
                }
              } catch {
                if (!live) return;
              }
            }
            if (live) {
              setAutoPickVisualSection(false);
              setSearchingVisualPage(false);
            }
          })();
        }
      })
      .catch(() => {
        if (!live) return;
        setDiagramHotspots([]);
        setDiagramLayout("unknown");
      });

    return () => { live = false; };
  }, [assemblyValue.occurrences, autoPickVisualSection, availableRefKey, availableRefs, currentSection?.diagramUrl, currentSection?.id, sections]);

  const hasDiagramImage = Boolean(currentSection?.diagramUrl);
  const currentSectionDiagramSrc = resolveDiagramAssetUrl(currentSection?.diagramUrl);
  const hasVisualDiagram = hasDiagramImage && diagramLayout !== "table";
  const hasTableOnlySourcePage = hasDiagramImage && diagramLayout === "table";
  const pickerRefs = availableRefs;
  const pickerRefKey = useMemo(() => pickerRefs.join("|"), [pickerRefs]);
  const requiresRefSelection = pickerRefs.length > 0;
  const visibleGroups = useMemo(() => {
    if (!activeRef && requiresRefSelection) return [];
    if (!activeRef) return sectionGroups;
    return sectionGroups.filter((value) =>
      value.occurrences.some((item) => occurrenceMatchesRef(item, activeRef)),
    );
  }, [activeRef, requiresRefSelection, sectionGroups]);

  useEffect(() => {
    if (activeRef && !pickerRefs.includes(activeRef)) setActiveRef(null);
  }, [activeRef, pickerRefKey, pickerRefs]);

  return <section>
    <div className="pilot-heading">
      <div>
        <span className="pilot-kicker">Assembly / component group</span>
        <h2>{assemblyValue.assembly.name}</h2>
        <p>
          {groups.length.toLocaleString()} unique parts across {countLabel(sections.length, "manual page")}.
          {pickerRefs.length > 0
            ? hasTableOnlySourcePage
              ? " This source page is a numbered parts table, so use the callout list below to open the exact row."
              : " Use the callout list below to narrow to the exact row(s)."
            : " This source has no structured callout refs on this page yet."}
        </p>
      </div>
    </div>

    {sections.length > 1 && (
      <div className="pilot-section-tabs" role="tablist" aria-label={`${assemblyValue.assembly.name} manual pages`}>
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={currentSection?.id === section.id}
            className={currentSection?.id === section.id ? "active" : ""}
            onClick={() => {
              setAutoPickVisualSection(false);
              setSectionId(section.id);
              setActiveRef(null);
            }}
          >
            <strong>Page {section.diagramPageNumber || section.pageNumber}</strong>
            <small>{section.title}</small>
          </button>
        ))}
      </div>
    )}

    {hasDiagramImage && (
      <div className="pilot-diagram">
        <div className="pilot-diagram__stage">
          <img src={currentSectionDiagramSrc} alt={`${assemblyValue.assembly.name} source diagram`} loading="lazy" />
        </div>
        <span>Source diagram · page {currentSection.diagramPageNumber || currentSection.pageNumber}</span>
      </div>
    )}

    {hasTableOnlySourcePage && (
      <div className="pilot-diagram-status">
        <strong>Numbered parts table page</strong>
        <small>
          {searchingVisualPage
            ? "Checking the other manual pages for the matching illustration…"
            : "This source page is still shown above. Use the ref buttons below to jump to the correct part row without stacking labels on the image."}
        </small>
      </div>
    )}

    {diagramHint && !hasTableOnlySourcePage && <div className="pilot-diagram-hint">{diagramHint}</div>}

    {pickerRefs.length > 0 && (
      <div className="pilot-callout-picker">
        <div className="pilot-callout-picker__head">
          <strong>{hasTableOnlySourcePage ? "Refs on this source page" : "Callouts on this page"}</strong>
          {activeRef ? <button type="button" onClick={() => setActiveRef(null)}>Clear</button> : <span>{pickerRefs.length} refs</span>}
        </div>
        <div className="pilot-callout-picker__grid">
          {pickerRefs.map((ref) => (
            <button
              key={ref}
              type="button"
              className={activeRef === ref ? "active" : ""}
              onClick={() => setActiveRef((value) => value === ref ? null : ref)}
            >
              {ref}
            </button>
          ))}
        </div>
      </div>
    )}

    {!activeRef && requiresRefSelection && (
      <div className="pilot-empty">Choose a callout above to load only the matching part row(s).</div>
    )}

    <div className="pilot-list">{visibleGroups.slice(0, limit).map((value) => {
      const part = index.parts.get(value.partId);
      const number = index.numbersByPart.get(value.partId);
      const occurrence = activeRef
        ? value.occurrences.find((item) => occurrenceMatchesRef(item, activeRef)) || value.occurrences[0]
        : value.occurrences[0];
      const refs = collectOccurrenceRefs(value.occurrences);
      const previewHotspot = activeRef
        ? hotspotForRef(currentSection?.diagramUrl, activeRef, diagramHotspots)
        : null;
      return <button key={`${currentSection?.id || "section"}:${value.partId}`} className="pilot-row pilot-part-row" onClick={() => onPart(occurrence, {
        hotspot: previewHotspot,
        sectionId: currentSection?.id || null,
      })}>
        <span className="pilot-callout">{refs[0] || "•"}</span><span className="pilot-row-main"><strong>{part.canonicalName}</strong><small>{partNumberTypeLabel(number)} {number.number} · Qty {occurrence.quantityText}{value.occurrences.length > 1 ? ` · ${value.occurrences.length} placements` : ""}</small>{refs.length > 1 && <small>Refs {refs.join(", ")}</small>}{occurrence.serialApplicability && <em>Serial {occurrence.serialApplicability}</em>}</span><Arrow />
      </button>;
    })}</div>
    {visibleGroups.length === 0 && <div className="pilot-empty">No part rows are mapped to callout {activeRef} on this page.</div>}
    {visibleGroups.length > limit && <button className="pilot-more" onClick={onMore}>Show {Math.min(80, visibleGroups.length - limit)} more parts</button>}
  </section>;
}

function PartView({ index, view, assemblyValue, part, number, selectedRef, initialHotspot = null, initialSectionId = null, onBack }) {
  const occurrences = assemblyValue.occurrences.filter((item) => item.partId === part.id);
  const aliases = index.aliasesByPart.get(part.id) || [];
  const occurrenceRefs = useMemo(
    () => collectOccurrenceRefs(occurrences),
    [occurrences],
  );
  const primaryRef = selectedRef && occurrenceRefs.includes(selectedRef) ? selectedRef : occurrenceRefs[0] || null;
  const preferredOccurrence = primaryRef
    ? occurrences.find((item) => occurrenceMatchesRef(item, primaryRef)) || occurrences[0]
    : occurrences[0];
  const diagramSection = assemblyValue.sections.find((section) =>
    section.id === initialSectionId && occurrences.some((item) => item.catalogSectionId === section.id) && section.diagramUrl,
  ) || assemblyValue.sections.find((section) =>
    section.id === preferredOccurrence?.catalogSectionId && section.diagramUrl,
  ) || assemblyValue.sections.find((section) =>
    occurrences.some((item) => item.catalogSectionId === section.id) && section.diagramUrl,
  ) || assemblyValue.sections.find((section) => section.diagramUrl) || null;
  const [calloutPreviewHotspot, setCalloutPreviewHotspot] = useState(() =>
    initialHotspot && (!primaryRef || initialHotspot.ref === primaryRef) ? initialHotspot : null,
  );
  const [showSourcePage, setShowSourcePage] = useState(false);
  const hasDiagramEvidence = Boolean(diagramSection?.diagramUrl);
  const diagramSectionDiagramSrc = resolveDiagramAssetUrl(diagramSection?.diagramUrl);
  const compiledResearchSource = (index.raw.sourceDocuments || []).some((document) => document.documentType === "compiled_research_dataset");
  const proofTitle = hasDiagramEvidence ? "Source verified" : compiledResearchSource ? "Compiled machine fitment" : "Catalog fitment";
  const proofBody = hasDiagramEvidence
    ? "Placed from the pinned manufacturer catalog."
    : compiledResearchSource
      ? "Searchable machine data compiled from curated research rows. Diagram callouts are not loaded yet."
      : "Mapped to this machine, but diagram evidence is not loaded yet.";
  const sourcePages = [...new Set(occurrences.map((item) => index.sourceLocations.get(item.sourceLocationId)?.pageNumber).filter(Boolean))];
  const allFitments = index.raw.fitments.filter((fitment) => fitment.partId === part.id).map((fitment) => {
    return index.machineByVariantId.get(fitment.modelVariantId)?.displayName;
  }).filter(Boolean);
  const fitmentSummary = compactList(allFitments, 2);
  const aliasSummary = compactList(aliases, 3);
  const occurrenceRefKey = useMemo(() => occurrenceRefs.join("|"), [occurrenceRefs]);

  useEffect(() => {
    let live = true;
    const seededHotspot = initialHotspot && primaryRef && initialHotspot.ref === primaryRef
      ? initialHotspot
      : null;
    setCalloutPreviewHotspot(seededHotspot);
    if (seededHotspot || !diagramSection?.diagramUrl || !primaryRef) {
      if (diagramSection?.diagramUrl && primaryRef) {
        setCalloutPreviewHotspot(seededHotspot || getManualDiagramHotspot(diagramSection.diagramUrl, primaryRef));
      }
      return () => { live = false; };
    }

    const refByNormalized = new Map([[normalizeCalloutRef(primaryRef), primaryRef]]);

    detectDiagramCallouts({ diagramUrl: diagramSection.diagramUrl, refs: [primaryRef] })
      .then((result) => {
        if (!live) return;
        const mapped = collapseNearbyHotspots(dedupeHotspots((result.callouts || []).map((item, index) => {
          const resolvedRef = refByNormalized.get(item.normalizedRef || normalizeCalloutRef(item.ref)) || item.ref;
          if (!resolvedRef) return null;
          return {
            id: `${resolvedRef}:${index}:${item.x}:${item.y}`,
            ref: resolvedRef,
            x: Number(item.x) || 0,
            y: Number(item.y) || 0,
            width: Number(item.width) || 0,
            height: Number(item.height) || 0,
          };
        }).filter(Boolean)));
        setCalloutPreviewHotspot(hotspotForRef(diagramSection.diagramUrl, primaryRef, mapped));
      })
      .catch(() => {
        if (!live) return;
        setCalloutPreviewHotspot(getManualDiagramHotspot(diagramSection?.diagramUrl, primaryRef));
      });

    return () => { live = false; };
  }, [diagramSection?.diagramUrl, initialHotspot, primaryRef]);

  useEffect(() => {
    setShowSourcePage(false);
  }, [part.id, primaryRef, diagramSection?.diagramUrl]);

  const focusRingStyle = calloutPreviewHotspot ? {
    left: `${((calloutPreviewHotspot.x + (calloutPreviewHotspot.width / 2)) * 100).toFixed(3)}%`,
    top: `${((calloutPreviewHotspot.y + (calloutPreviewHotspot.height / 2)) * 100).toFixed(3)}%`,
  } : null;
  const derivedPreviewFrame = calloutPreviewHotspot ? derivePreviewFrameFromHotspot(calloutPreviewHotspot) : null;
  const previewCenterX = calloutPreviewHotspot?.previewCenterX
    ?? derivedPreviewFrame?.centerX
    ?? (calloutPreviewHotspot ? (calloutPreviewHotspot.x + (calloutPreviewHotspot.width / 2)) : 0.5);
  const previewCenterY = calloutPreviewHotspot?.previewCenterY
    ?? derivedPreviewFrame?.centerY
    ?? (calloutPreviewHotspot ? (calloutPreviewHotspot.y + (calloutPreviewHotspot.height / 2)) : 0.32);
  const cropScale = calloutPreviewHotspot
    ? (calloutPreviewHotspot.previewScale
      || derivedPreviewFrame?.scale
      || Math.min(10, Math.max(5.5, 0.18 / Math.max(calloutPreviewHotspot.width || 0.001, calloutPreviewHotspot.height || 0.001))))
    : 5.5;
  const cropPreviewStyle = calloutPreviewHotspot && diagramSection?.diagramUrl ? {
    backgroundImage: `url(${diagramSectionDiagramSrc})`,
    backgroundPosition: `${centeredBackgroundPercent(previewCenterX, cropScale).toFixed(2)}% ${centeredBackgroundPercent(previewCenterY, cropScale).toFixed(2)}%`,
    backgroundSize: `${(cropScale * 100).toFixed(2)}% auto`,
  } : null;
  const sectionPreviewStyle = !calloutPreviewHotspot && diagramSection?.diagramUrl ? {
    backgroundImage: `url(${diagramSectionDiagramSrc})`,
    backgroundPosition: `${centeredBackgroundPercent(0.52, 1.95).toFixed(2)}% ${centeredBackgroundPercent(0.34, 1.95).toFixed(2)}%`,
    backgroundSize: `${(1.95 * 100).toFixed(2)}% auto`,
  } : null;
  const activePreviewStyle = cropPreviewStyle || sectionPreviewStyle;

  return <section className="pilot-part-detail">
    <button className="pilot-inline-back" onClick={onBack}>‹ Back to {assemblyValue.assembly.name}</button>
    <span className="pilot-kicker">Verified individual part</span><h2>{part.canonicalName}</h2>
    <div className="pilot-part-answer">
      <div className="pilot-number"><small>{partNumberTypeLabel(number)} part number</small><strong>{number.number}</strong></div>
      <div className="pilot-answer-callout">
        <small>{calloutPreviewHotspot ? "Source callout" : "Source page"}</small>
        <strong>{primaryRef ? `Callout ${primaryRef}` : (occurrenceRefs.join(", ") || "Listed")}</strong>
        <small className="pilot-answer-callout__note">
          {calloutPreviewHotspot
            ? "Showing the exact callout area from the source diagram."
            : "Showing the source illustration zoom. Exact callout highlighting is not pinned for this page yet."}
        </small>
      </div>
    </div>
    {activePreviewStyle && <div className="pilot-callout-crop">
      <div className="pilot-callout-crop__head">
        <small>{calloutPreviewHotspot ? "Callout close-up" : "Source illustration zoom"}</small>
        {diagramSection?.diagramUrl && <button type="button" onClick={() => setShowSourcePage((value) => !value)}>
          {showSourcePage ? "Hide full page" : "Show full page"}
        </button>}
      </div>
      <div className="pilot-callout-crop__image" style={activePreviewStyle}>
      </div>
    </div>}
    {diagramSection?.diagramUrl && (!calloutPreviewHotspot || showSourcePage) && <div className="pilot-diagram pilot-diagram--answer">
      <div className="pilot-diagram__stage">
        <img src={diagramSectionDiagramSrc} alt={`${part.canonicalName} source catalog diagram`} />
        {focusRingStyle && <div className="pilot-diagram-focus-ring" style={focusRingStyle} aria-hidden="true" />}
      </div>
      <span>{calloutPreviewHotspot ? "Selected callout highlighted on source page" : "Exact source diagram"} · manual page {diagramSection.diagramPageNumber || diagramSection.pageNumber}</span>
    </div>}
    <div className="pilot-proof"><span>✓</span><div><strong>{proofTitle}</strong><small>{proofBody}</small></div></div>
    <dl className="pilot-facts">
      <div><dt>Machine</dt><dd>{view.machine.displayName}</dd></div>
      <div><dt>Assembly</dt><dd>{assemblyValue.assembly.name}</dd></div>
      <div><dt>Callout</dt><dd>{occurrenceRefs.join(", ") || "Listed part"}</dd></div>
      <div><dt>Quantity</dt><dd>{[...new Set(occurrences.map((item) => item.quantityText))].join(", ")}</dd></div>
      <div><dt>Source page</dt><dd>{sourcePages.length ? sourcePages.join(", ") : "Not pinned yet"}</dd></div>
      {occurrences.some((item) => item.serialApplicability) && <div><dt>Serial</dt><dd>{[...new Set(occurrences.map((item) => item.serialApplicability).filter(Boolean))].join(", ")}</dd></div>}
    </dl>
    {aliases.length > 0 && <div className="pilot-note"><strong>Also described as</strong>{aliasSummary}</div>}
    {fitmentSummary && <div className="pilot-note"><strong>Verified fitment</strong>{fitmentSummary}</div>}
  </section>;
}

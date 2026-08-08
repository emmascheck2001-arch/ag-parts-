import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { UIIcon } from "../components/icons";
import { expandPilotQuery, loadPilotCatalog } from "../lib/pilot-catalog";

const Arrow = () => <span className="pilot-arrow">›</span>;

function countLabel(count, noun) {
  return `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;
}

export function PilotCatalog({ modelId, initialQuery = "", onBack, onScan }) {
  const [index, setIndex] = useState(null);
  const [error, setError] = useState("");
  const [systemId, setSystemId] = useState(null);
  const [subsystemId, setSubsystemId] = useState(null);
  const [assemblyId, setAssemblyId] = useState(null);
  const [partId, setPartId] = useState(null);
  const [query, setQuery] = useState("");
  const [searchRequest, setSearchRequest] = useState("");
  const [showAssemblies, setShowAssemblies] = useState(false);
  const [limit, setLimit] = useState(80);
  const searchInputRef = useRef(null);

  useEffect(() => {
    let live = true;
    loadPilotCatalog().then((value) => live && setIndex(value)).catch((reason) => live && setError(reason.message));
    return () => { live = false; };
  }, []);

  useEffect(() => setLimit(80), [assemblyId, query]);

  useEffect(() => {
    setQuery(initialQuery || "");
    setSearchRequest(initialQuery || "");
    setShowAssemblies(false);
    setPartId(null);
    setAssemblyId(null);
    setSubsystemId(null);
    setSystemId(null);
  }, [initialQuery, modelId]);

  const view = useMemo(() => {
    if (!index) return null;
    const machine = index.machines.find((item) => item.id === modelId);
    if (!machine) return null;
    const sections = index.sectionsByVariant.get(machine.variantId) || [];
    const assemblies = new Map();
    for (const section of sections) {
      const assembly = index.assemblies.get(section.assemblyId);
      const subsystem = index.subsystems.get(assembly.subsystemId);
      const system = index.systems.get(subsystem.systemId);
      const value = assemblies.get(assembly.id) || { assembly, subsystem, system, sections: [], occurrences: [] };
      value.sections.push(section);
      value.occurrences.push(...(index.occurrencesBySection.get(section.id) || []));
      assemblies.set(assembly.id, value);
    }
    const assemblyValues = [...assemblies.values()];
    const systems = [...new Map(assemblyValues.map((value) => [value.system.id, value.system])).values()]
      .map((system) => ({
        ...system,
        assemblies: assemblyValues.filter((value) => value.system.id === system.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { machine, assemblies, systems };
  }, [index, modelId]);

  if (error) return <div className="screen active"><TopBar title="Verified catalog" onBack={onBack} /><div className="pilot-state">{error}</div></div>;
  if (!view) return <div className="screen active"><TopBar title="Verified catalog" onBack={onBack} /><div className="pilot-state">Loading source-backed catalog…</div></div>;

  const currentSystem = view.systems.find((system) => system.id === systemId);
  const currentSubsystem = index.subsystems.get(subsystemId);
  const currentAssembly = view.assemblies.get(assemblyId);
  const currentPart = index.parts.get(partId);
  const currentNumber = index.numbersByPart.get(partId);
  const terms = expandPilotQuery(searchRequest);

  const resetBelow = (level) => {
    if (level === "machine") setSystemId(null);
    if (["machine", "system"].includes(level)) setSubsystemId(null);
    if (["machine", "system", "subsystem"].includes(level)) setAssemblyId(null);
    setPartId(null);
    setQuery("");
    setSearchRequest("");
    setShowAssemblies(true);
  };

  const openPart = (assemblyValue, occurrence) => {
    setSystemId(assemblyValue.system.id);
    setSubsystemId(assemblyValue.subsystem.id);
    setAssemblyId(assemblyValue.assembly.id);
    setPartId(occurrence.partId);
    setQuery("");
    setSearchRequest("");
  };

  const openAssembly = (assemblyValue) => {
    setSystemId(assemblyValue.system.id);
    setSubsystemId(assemblyValue.subsystem.id);
    setAssemblyId(assemblyValue.assembly.id);
    setPartId(null);
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
    setAssemblyId(null);
    setSubsystemId(null);
    setSystemId(null);
  };

  const groupedParts = (assemblyValue) => {
    const grouped = new Map();
    for (const occurrence of assemblyValue.occurrences) {
      const value = grouped.get(occurrence.partId) || { partId: occurrence.partId, occurrences: [] };
      value.occurrences.push(occurrence);
      grouped.set(occurrence.partId, value);
    }
    return [...grouped.values()].sort((a, b) =>
      index.parts.get(a.partId).canonicalName.localeCompare(index.parts.get(b.partId).canonicalName));
  };

  const searchResults = terms.length ? [...view.assemblies.values()].flatMap((assemblyValue) =>
    groupedParts(assemblyValue).filter((value) => {
      const part = index.parts.get(value.partId);
      const number = index.numbersByPart.get(value.partId);
      const aliases = index.aliasesByPart.get(value.partId) || [];
      const haystack = `${part.canonicalName} ${number.number} ${aliases.join(" ")} ${assemblyValue.assembly.name}`.toLowerCase();
      const expandedHaystack = `${haystack} ${expandPilotQuery(haystack).join(" ")}`;
      return terms.every((term) => expandedHaystack.includes(term));
    }).map((value) => ({ ...value, assemblyValue }))
  ) : [];

  const machineBack = () => {
    if (partId) return setPartId(null);
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
      <div className="scroll">
        <div className="pilot-wrap">
          <div className="pilot-breadcrumbs" aria-label="Catalog path">
            <button onClick={() => resetBelow("machine")}>{view.machine.manufacturer}</button><span>›</span>
            <button onClick={() => resetBelow("machine")}>{view.machine.machineType}</button><span>›</span>
            <button onClick={() => resetBelow("machine")}>{view.machine.modelCode}</button>
            {currentSystem && <><span>›</span><button onClick={() => resetBelow("machine")}>{currentSystem.name}</button></>}
            {currentSubsystem && <><span>›</span><button onClick={() => resetBelow("machine")}>{currentSubsystem.name}</button></>}
          </div>

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
              <button className="pilot-scan" onClick={() => onScan(view.machine.displayName)}><UIIcon.camera width="20" height="20" /><strong>Picture</strong></button>
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
            <PartView index={index} view={view} assemblyValue={currentAssembly} part={currentPart} number={currentNumber} onBack={() => setPartId(null)} />
          ) : currentAssembly ? (
            <AssemblyView index={index} assemblyValue={currentAssembly} groups={groupedParts(currentAssembly)} limit={limit}
              onMore={() => setLimit((value) => value + 80)} onPart={(occurrence) => openPart(currentAssembly, occurrence)} />
          ) : showAssemblies ? (
            <FastMachineBrowse view={view} groupedParts={groupedParts} onAssembly={openAssembly} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MachineWorkspace({ machine, query, searchInputRef, onQuery, onSearch, onScan, onBrowse, onChangeMachine }) {
  return <section className="fast-machine-hero pilot-machine-workspace" aria-label={`${machine.displayName} part finder`}>
    <div className="fast-step"><span>1</span> Your machine</div>
    <div className="fast-machine-hero__title">
      <div className="fast-machine-icon"><UIIcon.tractor width="30" height="30" /></div>
      <div>
        <h1>{machine.displayName}</h1>
        <p>{machine.machineType} · {machine.partCount.toLocaleString()} verified parts</p>
      </div>
      <button onClick={onChangeMachine}>Change</button>
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
        <span><strong>Use a picture</strong><small>Photograph the part or tag</small></span>
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
      <span className="pilot-kicker">Machine selected</span>
      <h2>{view.machine.displayName}</h2>
      <p>{view.machine.partCount.toLocaleString()} verified OEM parts · {view.machine.assemblyCount} illustrated assemblies</p>
      <div><span>1</span> Search above or tap the exact assembly below.</div>
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
  const diagram = assemblyValue.sections.find((section) => section.diagramUrl)?.diagramUrl;
  return <section>
    <div className="pilot-heading"><div><span className="pilot-kicker">Assembly / component group</span><h2>{assemblyValue.assembly.name}</h2><p>{groups.length.toLocaleString()} unique parts. Repeated callouts share one master part.</p></div></div>
    {diagram && <div className="pilot-diagram"><img src={diagram} alt={`${assemblyValue.assembly.name} source diagram`} loading="lazy" /><span>Source diagram · page {assemblyValue.sections[0].diagramPageNumber}</span></div>}
    <div className="pilot-list">{groups.slice(0, limit).map((value) => {
      const part = index.parts.get(value.partId); const number = index.numbersByPart.get(value.partId); const occurrence = value.occurrences[0];
      const refs = [...new Set(value.occurrences.map((item) => item.illustrationReference).filter(Boolean))];
      return <button key={value.partId} className="pilot-row pilot-part-row" onClick={() => onPart(occurrence)}>
        <span className="pilot-callout">{refs[0] || "•"}</span><span className="pilot-row-main"><strong>{part.canonicalName}</strong><small>OEM {number.number} · Qty {occurrence.quantityText}{value.occurrences.length > 1 ? ` · ${value.occurrences.length} placements` : ""}</small>{occurrence.serialApplicability && <em>Serial {occurrence.serialApplicability}</em>}</span><Arrow />
      </button>;
    })}</div>
    {groups.length > limit && <button className="pilot-more" onClick={onMore}>Show {Math.min(80, groups.length - limit)} more parts</button>}
  </section>;
}

function PartView({ index, view, assemblyValue, part, number, onBack }) {
  const occurrences = assemblyValue.occurrences.filter((item) => item.partId === part.id);
  const aliases = index.aliasesByPart.get(part.id) || [];
  const allFitments = index.raw.fitments.filter((fitment) => fitment.partId === part.id).map((fitment) => {
    const variant = index.variants.get(fitment.modelVariantId);
    return index.machines.find((machine) => machine.id === variant.modelId)?.displayName;
  }).filter(Boolean);
  return <section className="pilot-part-detail">
    <button className="pilot-inline-back" onClick={onBack}>‹ Back to {assemblyValue.assembly.name}</button>
    <span className="pilot-kicker">Verified individual part</span><h2>{part.canonicalName}</h2>
    <div className="pilot-part-answer">
      <div className="pilot-number"><small>OEM part number</small><strong>{number.number}</strong></div>
      <div className="pilot-answer-callout"><small>Diagram callout</small><strong>{[...new Set(occurrences.map((item) => item.illustrationReference).filter(Boolean))].join(", ") || "Listed"}</strong></div>
    </div>
    {assemblyValue.sections[0]?.diagramUrl && <div className="pilot-diagram pilot-diagram--answer"><img src={assemblyValue.sections[0].diagramUrl} alt={`${part.canonicalName} source catalog diagram`} /><span>Exact source diagram · manual page {assemblyValue.sections[0].diagramPageNumber}</span></div>}
    <div className="pilot-proof"><span>✓</span><div><strong>Source verified</strong><small>Placed from the pinned manufacturer catalog—not inferred from a text category.</small></div></div>
    <dl className="pilot-facts">
      <div><dt>Machine</dt><dd>{view.machine.displayName}</dd></div>
      <div><dt>Assembly</dt><dd>{assemblyValue.assembly.name}</dd></div>
      <div><dt>Callout</dt><dd>{[...new Set(occurrences.map((item) => item.illustrationReference).filter(Boolean))].join(", ") || "Listed part"}</dd></div>
      <div><dt>Quantity</dt><dd>{[...new Set(occurrences.map((item) => item.quantityText))].join(", ")}</dd></div>
      <div><dt>Source page</dt><dd>{[...new Set(occurrences.map((item) => index.sourceLocations.get(item.sourceLocationId)?.pageNumber))].join(", ")}</dd></div>
      {occurrences.some((item) => item.serialApplicability) && <div><dt>Serial</dt><dd>{[...new Set(occurrences.map((item) => item.serialApplicability).filter(Boolean))].join(", ")}</dd></div>}
    </dl>
    {aliases.length > 0 && <div className="pilot-note"><strong>Also described as</strong>{aliases.slice(0, 4).join(" · ")}</div>}
    <div className="pilot-note"><strong>Verified pilot fitment</strong>{[...new Set(allFitments)].join(" · ")}</div>
  </section>;
}

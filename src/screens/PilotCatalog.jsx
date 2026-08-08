import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { expandPilotQuery, loadPilotCatalog } from "../lib/pilot-catalog";

const Arrow = () => <span className="pilot-arrow">›</span>;

function countLabel(count, noun) {
  return `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;
}

export function PilotCatalog({ modelId, onBack }) {
  const [index, setIndex] = useState(null);
  const [error, setError] = useState("");
  const [systemId, setSystemId] = useState(null);
  const [subsystemId, setSubsystemId] = useState(null);
  const [assemblyId, setAssemblyId] = useState(null);
  const [partId, setPartId] = useState(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(80);

  useEffect(() => {
    let live = true;
    loadPilotCatalog().then((value) => live && setIndex(value)).catch((reason) => live && setError(reason.message));
    return () => { live = false; };
  }, []);

  useEffect(() => setLimit(80), [assemblyId, query]);

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
  const terms = expandPilotQuery(query);

  const resetBelow = (level) => {
    if (level === "machine") setSystemId(null);
    if (["machine", "system"].includes(level)) setSubsystemId(null);
    if (["machine", "system", "subsystem"].includes(level)) setAssemblyId(null);
    setPartId(null);
    setQuery("");
  };

  const openPart = (assemblyValue, occurrence) => {
    setSystemId(assemblyValue.system.id);
    setSubsystemId(assemblyValue.subsystem.id);
    setAssemblyId(assemblyValue.assembly.id);
    setPartId(occurrence.partId);
    setQuery("");
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
    if (assemblyId) { setAssemblyId(null); return; }
    if (subsystemId) { setSubsystemId(null); return; }
    if (systemId) { setSystemId(null); return; }
    onBack();
  };

  let title = view.machine.displayName;
  if (currentSystem) title = currentSystem.name;
  if (currentSubsystem) title = currentSubsystem.name;
  if (currentAssembly) title = currentAssembly.assembly.name;
  if (currentPart) title = currentNumber.number;

  return (
    <div className="screen active pilot-catalog">
      <TopBar title={title} onBack={machineBack} right="✓" />
      <div className="scroll">
        <div className="pilot-wrap">
          <div className="pilot-breadcrumbs" aria-label="Catalog path">
            <button onClick={() => resetBelow("machine")}>{view.machine.manufacturer}</button><span>›</span>
            <button onClick={() => resetBelow("machine")}>{view.machine.machineType}</button><span>›</span>
            <button onClick={() => resetBelow("machine")}>{view.machine.modelCode}</button>
            {currentSystem && <><span>›</span><button onClick={() => resetBelow("system")}>{currentSystem.name}</button></>}
            {currentSubsystem && <><span>›</span><button onClick={() => resetBelow("subsystem")}>{currentSubsystem.name}</button></>}
          </div>

          {!partId && (
            <div className="pilot-search">
              <span>⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${view.machine.modelCode} parts or OEM number`} />
              {query && <button onClick={() => setQuery("")}>Clear</button>}
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
          ) : currentSubsystem ? (
            <BrowseList kicker={currentSystem.name} title={currentSubsystem.name} items={currentSystem.assemblies.filter((value) => value.subsystem.id === subsystemId)
              .sort((a, b) => a.assembly.name.localeCompare(b.assembly.name))}
              render={(value) => ({ title: value.assembly.name, meta: `${countLabel(new Set(value.occurrences.map((item) => item.partId)).size, "part")} · source page ${value.sections[0].pageNumber}` })}
              onSelect={(value) => setAssemblyId(value.assembly.id)} />
          ) : currentSystem ? (
            <BrowseList kicker="Major system" title="Choose a subsystem" items={[...new Map(currentSystem.assemblies.map((value) => [value.subsystem.id, value.subsystem])).values()].sort((a, b) => a.name.localeCompare(b.name))}
              render={(subsystem) => { const values = currentSystem.assemblies.filter((value) => value.subsystem.id === subsystem.id); return { title: subsystem.name, meta: countLabel(values.length, "assembly") }; }}
              onSelect={(subsystem) => setSubsystemId(subsystem.id)} />
          ) : (
            <BrowseList kicker="Verified parts manual" title="Choose a major system" items={view.systems}
              intro={`${view.machine.partCount.toLocaleString()} unique OEM parts placed in ${view.machine.assemblyCount} source-backed assemblies.`}
              render={(system) => ({ title: system.name, meta: countLabel(system.assemblies.length, "assembly") })}
              onSelect={(system) => setSystemId(system.id)} />
          )}
        </div>
      </div>
    </div>
  );
}

function BrowseList({ kicker, title, intro, items, render, onSelect }) {
  return <section><div className="pilot-heading"><div><span className="pilot-kicker">{kicker}</span><h2>{title}</h2>{intro && <p>{intro}</p>}</div></div>
    <div className="pilot-list">{items.map((item) => { const row = render(item); return <button key={item.id || item.assembly?.id} className="pilot-row" onClick={() => onSelect(item)}>
      <span className="pilot-row-main"><strong>{row.title}</strong><small>{row.meta}</small></span><Arrow />
    </button>; })}</div></section>;
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
    <div className="pilot-number"><small>OEM part number</small><strong>{number.number}</strong></div>
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
    {assemblyValue.sections[0]?.diagramUrl && <div className="pilot-diagram"><img src={assemblyValue.sections[0].diagramUrl} alt="Source catalog page" /><span>Catalog diagram · source page {assemblyValue.sections[0].diagramPageNumber}</span></div>}
  </section>;
}

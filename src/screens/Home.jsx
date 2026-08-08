import { useEffect, useMemo, useState } from "react";
import { UIIcon } from "../components/icons";
import { loadPilotCatalog } from "../lib/pilot-catalog";

const PAGE_SIZE = 40;

export function Home({
  onSelect,
  onNav,
  activePilotModel,
  verifiedFleet = [],
  onRemovePilotMachine,
}) {
  const [pilotCatalog, setPilotCatalog] = useState(null);
  const [search, setSearch] = useState("");
  const [machineType, setMachineType] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let live = true;
    loadPilotCatalog().then((value) => { if (live) setPilotCatalog(value); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const savedMachines = useMemo(() => {
    if (!pilotCatalog) return [];
    const machinesById = new Map(pilotCatalog.machines.map((machine) => [machine.id, machine]));
    return verifiedFleet
      .map((saved) => ({ ...saved, machine: machinesById.get(saved.modelId) }))
      .filter((saved) => saved.machine)
      .sort((a, b) => {
        if (a.modelId === activePilotModel) return -1;
        if (b.modelId === activePilotModel) return 1;
        return String(b.lastUsedAt || "").localeCompare(String(a.lastUsedAt || ""));
      });
  }, [activePilotModel, pilotCatalog, verifiedFleet]);

  const machineTypes = useMemo(
    () => [...new Set(savedMachines.map((saved) => saved.machine.machineType))].sort(),
    [savedMachines],
  );

  const filteredMachines = useMemo(() => {
    const query = search.trim().toLowerCase();
    return savedMachines.filter((saved) => {
      const matchesType = machineType === "all" || saved.machine.machineType === machineType;
      const text = `${saved.nickname} ${saved.location} ${saved.machine.displayName} ${saved.machine.manufacturer} ${saved.machine.machineType}`.toLowerCase();
      return matchesType && (!query || text.includes(query));
    });
  }, [machineType, savedMachines, search]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [machineType, search]);

  return (
    <div className="screen active fleet-home">
      <div className="scroll">
        <main className="home fleet-home__inner">
          <header className="home-head fleet-home__head">
            <div>
              <div className="brand">Ez<span>Parts</span></div>
              <div className="brand-sub">Your equipment. The correct part.</div>
            </div>
            <button className="fleet-add" onClick={() => onNav("machines")}>
              <span aria-hidden="true">＋</span> Add machine
            </button>
          </header>

          <section className="fleet-title">
            <span className="pilot-kicker">Farm equipment</span>
            <div>
              <h1>My Machines</h1>
              <strong>{savedMachines.length.toLocaleString()}</strong>
            </div>
            <p>Choose the exact machine first. Every part search, picture, and assembly stays inside that machine.</p>
          </section>

          {savedMachines.length > 0 ? (
            <>
              <section className="fleet-tools" aria-label="Filter your machines">
                <label className="fleet-search">
                  <UIIcon.search width="19" height="19" />
                  <span className="sr-only">Search your machines</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search model, type, nickname, or location"
                  />
                  {search && <button onClick={() => setSearch("")} aria-label="Clear machine search">×</button>}
                </label>
                {machineTypes.length > 1 && (
                  <label className="fleet-type-filter">
                    <span className="sr-only">Filter by machine type</span>
                    <select value={machineType} onChange={(event) => setMachineType(event.target.value)}>
                      <option value="all">All machine types</option>
                      {machineTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                )}
              </section>

              <div className="fleet-result-head" aria-live="polite">
                <span>{filteredMachines.length.toLocaleString()} machine{filteredMachines.length === 1 ? "" : "s"}</span>
                <small>Recently used first</small>
              </div>

              <section className="fleet-machine-list" aria-label="Your saved machines">
                {filteredMachines.slice(0, visibleCount).map((saved) => {
                  const machine = saved.machine;
                  const isRecent = machine.id === activePilotModel;
                  return (
                    <article key={machine.id} className="fleet-machine-row">
                      <button className="fleet-machine-row__open" onClick={() => onSelect("pilot-machine", machine.id)}>
                        <span className="fast-machine-row__icon"><UIIcon.tractor width="24" height="24" /></span>
                        <span className="fleet-machine-row__main">
                          <span className="fleet-machine-row__name">
                            <strong>{saved.nickname || machine.displayName}</strong>
                            {isRecent && <em>Recent</em>}
                          </span>
                          {saved.nickname && <small>{machine.displayName}</small>}
                          <small>{machine.machineType}{saved.location ? ` · ${saved.location}` : ""}</small>
                          <span>{machine.partCount.toLocaleString()} verified parts · {machine.assemblyCount} assemblies</span>
                        </span>
                        <span className="pilot-arrow" aria-hidden="true">›</span>
                      </button>
                      <button
                        className="fleet-machine-row__remove"
                        onClick={() => onRemovePilotMachine(machine.id)}
                        aria-label={`Remove ${machine.displayName} from My Machines`}
                        title="Remove from My Machines"
                      >×</button>
                    </article>
                  );
                })}
              </section>

              {filteredMachines.length === 0 && (
                <div className="fleet-empty fleet-empty--search">
                  <strong>No saved machines match that search.</strong>
                  <button onClick={() => { setSearch(""); setMachineType("all"); }}>Clear filters</button>
                </div>
              )}

              {filteredMachines.length > visibleCount && (
                <button className="fleet-show-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                  Show {Math.min(PAGE_SIZE, filteredMachines.length - visibleCount)} more machines
                </button>
              )}
            </>
          ) : pilotCatalog ? (
            <section className="fleet-empty">
              <span className="fleet-empty__icon"><UIIcon.tractor width="34" height="34" /></span>
              <h2>Add your first machine</h2>
              <p>Your saved equipment will appear here. EZPARTS will ask you to choose one before searching for a part.</p>
              <button onClick={() => onNav("machines")}>＋ Add a machine</button>
            </section>
          ) : (
            <div className="fast-loading">Loading your machines…</div>
          )}
        </main>
      </div>
    </div>
  );
}

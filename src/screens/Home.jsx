import { useEffect, useMemo, useRef, useState } from "react";
import { UIIcon } from "../components/icons";
import { machineByName } from "../lib/db";
import { loadPilotMachineIndex } from "../lib/pilot-catalog";
import { buildSavedMachines, machineTypesOf } from "../lib/saved-machines";

const PAGE_SIZE = 40;
// How long a remove button stays armed before it disarms itself. A stray tap in
// a shop should not leave a destructive control live indefinitely.
const REMOVE_CONFIRM_MS = 3000;

export function Home({
  onSelect,
  onNav,
  activePilotModel,
  verifiedFleet = [],
  legacyFleet = [],
  onRemoveMachine,
}) {
  const [catalogMachines, setCatalogMachines] = useState([]);
  const [search, setSearch] = useState("");
  const [machineType, setMachineType] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pendingRemoveKey, setPendingRemoveKey] = useState(null);
  const removeTimer = useRef(null);

  useEffect(() => {
    let live = true;
    loadPilotMachineIndex()
      .then((value) => { if (live) setCatalogMachines(value.machines || []); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => () => clearTimeout(removeTimer.current), []);

  const armRemove = (key) => {
    clearTimeout(removeTimer.current);
    setPendingRemoveKey(key);
    removeTimer.current = setTimeout(() => setPendingRemoveKey(null), REMOVE_CONFIRM_MS);
  };

  const savedMachines = useMemo(
    () => buildSavedMachines({
      verifiedFleet,
      legacyFleet,
      catalogMachines,
      lookupLegacy: machineByName,
      activeRef: activePilotModel,
    }),
    [activePilotModel, catalogMachines, legacyFleet, verifiedFleet],
  );

  const machineTypes = useMemo(() => machineTypesOf(savedMachines), [savedMachines]);

  const filteredMachines = useMemo(() => {
    const query = search.trim().toLowerCase();
    return savedMachines.filter((saved) =>
      (machineType === "all" || saved.machineType === machineType) &&
      (!query || saved.searchText.includes(query))
    );
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
            <span className="pilot-kicker">Harvest parts first</span>
            <div>
              <h1>My Machines</h1>
              <strong>{savedMachines.length.toLocaleString()}</strong>
            </div>
            <p>Every search and photo stays locked to the machine you pick.</p>
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
                  const isActive = saved.kind === "verified" && saved.ref === activePilotModel;
                  const isArmed = pendingRemoveKey === saved.key;
                  return (
                    <article key={saved.key} className="fleet-machine-row">
                      <button
                        className="fleet-machine-row__open"
                        onClick={() => onSelect(saved.kind === "verified" ? "pilot-machine" : "machines", saved.ref)}
                      >
                        <span className="fast-machine-row__icon"><UIIcon.tractor width="24" height="24" /></span>
                        <span className="fleet-machine-row__main">
                          <span className="fleet-machine-row__name">
                            <strong>{saved.name}</strong>
                            {isActive && <em>Recent</em>}
                          </span>
                          {saved.subtitle && <small>{saved.subtitle}</small>}
                          <small>{saved.meta}</small>
                          <span>{saved.detail}</span>
                        </span>
                        <span className="pilot-arrow" aria-hidden="true">›</span>
                      </button>
                      <button
                        className={`fleet-machine-row__remove${isArmed ? " is-armed" : ""}`}
                        onClick={() => {
                          if (isArmed) {
                            clearTimeout(removeTimer.current);
                            setPendingRemoveKey(null);
                            onRemoveMachine(saved);
                            return;
                          }
                          armRemove(saved.key);
                        }}
                        aria-label={isArmed
                          ? `Confirm remove ${saved.name} from My Machines`
                          : `Remove ${saved.name} from My Machines`}
                        title={isArmed ? "Tap again to remove" : "Remove from My Machines"}
                      >
                        {isArmed ? "Confirm" : "×"}
                      </button>
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
          ) : (
            <section className="fleet-empty">
              <span className="fleet-empty__icon"><UIIcon.tractor width="34" height="34" /></span>
              <h2>Add your first machine</h2>
              <p>Your saved equipment will appear here.</p>
              <button onClick={() => onNav("machines")}>＋ Add a machine</button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

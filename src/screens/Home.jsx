import { useEffect, useMemo, useRef, useState } from "react";
import { UIIcon } from "../components/icons";
import { loadPilotCatalog } from "../lib/pilot-catalog";


export function Home({
  onSelect,
  onSearch,
  onNav,
  recent = [],
  onClearRecent,
  activePilotModel,
  onPilotSearch,
  onPilotScan,
}) {
  const [pilotCatalog, setPilotCatalog] = useState(null);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    let live = true;
    loadPilotCatalog().then((value) => { if (live) setPilotCatalog(value); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const machines = pilotCatalog?.machines || [];
  const activeMachine = useMemo(
    () => machines.find((machine) => machine.id === activePilotModel) || null,
    [machines, activePilotModel],
  );

  const submitSearch = () => {
    const value = search.trim();
    if (!value) {
      inputRef.current?.focus();
      return;
    }
    if (activeMachine) onPilotSearch(activeMachine.id, value);
    else onSearch(value);
  };

  return (
    <div className="screen active fast-home">
      <div className="scroll">
        <main className="home fast-home__inner">
          <header className="home-head fast-home__head">
            <div>
              <div className="brand">Ez<span>Parts</span></div>
              <div className="brand-sub">Pick your machine. Find the exact part.</div>
            </div>
            <span className="fast-home__verified">Verified catalogs</span>
          </header>

          {activeMachine ? (
            <section className="fast-machine-hero" aria-label="Selected machine">
              <div className="fast-step"><span>1</span> Your machine</div>
              <div className="fast-machine-hero__title">
                <div className="fast-machine-icon"><UIIcon.tractor width="30" height="30" /></div>
                <div>
                  <h1>{activeMachine.displayName}</h1>
                  <p>{activeMachine.machineType} · {activeMachine.partCount.toLocaleString()} verified parts</p>
                </div>
                <button onClick={() => document.getElementById("verified-machine-picker")?.scrollIntoView({ behavior: "smooth" })}>Change</button>
              </div>

              <div className="fast-step fast-step--second"><span>2</span> What part do you need?</div>
              <div className="fast-part-search">
                <UIIcon.search width="20" height="20" />
                <input
                  ref={inputRef}
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && submitSearch()}
                  placeholder="Part name or OEM number"
                  aria-label={`Search ${activeMachine.displayName}`}
                />
                <button onClick={submitSearch}>Find</button>
              </div>
              <div className="fast-actions">
                <button className="fast-action fast-action--primary" onClick={() => onPilotScan(activeMachine.id, activeMachine.displayName)}>
                  <UIIcon.camera width="23" height="23" />
                  <span><strong>Use a picture</strong><small>Photograph the part or tag</small></span>
                </button>
                <button className="fast-action" onClick={() => onSelect("pilot-machine", activeMachine.id)}>
                  <UIIcon.grid width="23" height="23" />
                  <span><strong>Browse assemblies</strong><small>Manual diagrams and parts</small></span>
                </button>
              </div>
            </section>
          ) : (
            <section className="fast-welcome">
              <span className="fast-welcome__eyebrow">Start here</span>
              <h1>Which machine are you working on?</h1>
              <p>Choose it once. Every search and picture will stay scoped to that machine.</p>
            </section>
          )}

          <section id="verified-machine-picker" className="fast-picker">
            <div className="section-head">
              <div>
                <span className="fast-section-label">{activeMachine ? "Change machine" : "Step 1"}</span>
                <h2>{activeMachine ? "Verified machine bank" : "Pick a verified machine"}</h2>
              </div>
            </div>
            <div className="fast-machine-list">
              {machines.map((machine) => {
                const selected = machine.id === activeMachine?.id;
                return (
                  <button
                    key={machine.id}
                    className={`fast-machine-row${selected ? " selected" : ""}`}
                    onClick={() => onSelect("pilot-machine", machine.id)}
                  >
                    <span className="fast-machine-row__icon"><UIIcon.tractor width="24" height="24" /></span>
                    <span className="fast-machine-row__main">
                      <strong>{machine.displayName}</strong>
                      <small>{machine.machineType} · {machine.assemblyCount} assemblies</small>
                    </span>
                    <span className="fast-machine-row__count">{machine.partCount.toLocaleString()}<small>parts</small></span>
                    <span className="pilot-arrow">›</span>
                  </button>
                );
              })}
              {!pilotCatalog && <div className="fast-loading">Loading verified machines…</div>}
            </div>
            <button className="fast-all-machines" onClick={() => onNav("machines")}>
              <span>Need another machine?</span><strong>Open the full machine bank ›</strong>
            </button>
          </section>

          {recent.length > 0 && activeMachine && (
            <section className="fast-recents">
              <div className="section-head">
                <h3>Recent searches</h3>
                <button className="link" onClick={() => onClearRecent?.()}>Clear</button>
              </div>
              <div className="recent-list">
                {recent.slice(0, 4).map((item) => (
                  <button key={item} className="recent-row" onClick={() => onPilotSearch(activeMachine.id, item)}>
                    <UIIcon.clock width="18" height="18" className="recent-clock" />
                    <span className="recent-text">{item}</span>
                    <UIIcon.chevron width="18" height="18" className="recent-chev" />
                  </button>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

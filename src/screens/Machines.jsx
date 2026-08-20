import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { isHarvestFocusMachine, isMacDonMachine, marketFocusLabel } from "../lib/market-focus";
import { loadPilotMachineIndex, loadPilotSerialIndex } from "../lib/pilot-catalog";
import { formatSerialRange, lookupVerifiedMachinesBySerial } from "../lib/serial-lookup";

// Verified-machine picker. New machine adds should flow through the verified
// catalog, not the legacy browse index.
export function Machines({ onBack, onSelect }) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("focus");
  const [pilotMachines, setPilotMachines] = useState([]);
  const [serialQuery, setSerialQuery] = useState("");
  const [serialMatches, setSerialMatches] = useState([]);
  const [serialStatus, setSerialStatus] = useState("");
  useEffect(() => {
    let live = true;
    loadPilotMachineIndex().then((catalog) => { if (live) setPilotMachines(catalog.machines); }).catch(() => {});
    return () => { live = false; };
  }, []);
  useEffect(() => {
    setSerialMatches([]);
    setSerialStatus("");
  }, [serialQuery]);
  const query = q.trim().toLowerCase();
  const scopedMachines = pilotMachines.filter((machine) => {
    if (scope === "macdon") return isMacDonMachine(machine);
    if (scope === "focus") return isHarvestFocusMachine(machine);
    return true;
  });
  const pilots = query
    ? scopedMachines.filter((machine) => `${machine.displayName} ${machine.manufacturer} ${machine.machineType}`.toLowerCase().includes(query))
    : scopedMachines;

  const runSerialLookup = async () => {
    const value = serialQuery.trim();
    if (!value) {
      setSerialStatus("Enter a serial / PIN first.");
      setSerialMatches([]);
      return;
    }
    setSerialStatus("Checking verified serial ranges…");
    try {
      const serialIndex = await loadPilotSerialIndex();
      const matches = lookupVerifiedMachinesBySerial(serialIndex, value);
      setSerialMatches(matches);
      if (!matches.length) {
        setSerialStatus("No verified machine match was found from the current serial ranges.");
      } else if (matches.length === 1 && matches[0].matchConfidence === "dominant") {
        setSerialStatus("Best verified machine match found from the narrowest serial range.");
      } else if (matches.length === 1) {
        setSerialStatus("1 verified machine match found.");
      } else {
        setSerialStatus(`${matches.length} verified machine matches found. Pick the exact one below.`);
      }
    } catch {
      setSerialStatus("Serial lookup is unavailable right now.");
      setSerialMatches([]);
    }
  };

  return (
    <div className="screen active">
      <TopBar title="Add a Machine" onBack={onBack} />
      <div className="scroll">
        <div className="home home--inset">
          <div className="pilot-pick-intro">
            <span className="pilot-kicker">Harvest parts first</span>
            <h2>MacDon, header, and draper parts first</h2>
            <p>Start with the harvest machines EzParts is strongest on. You can still add every verified machine below.</p>
          </div>

          <section className="pilot-serial-card">
            <span className="pilot-kicker">Serial lookup</span>
            <h3>Find a verified machine by serial / PIN</h3>
            <p>Best when the pinned catalog includes machine serial ranges. If several models share the same range, EzParts shows the candidates instead of guessing.</p>
            <div className="pilot-serial-form">
              <input
                type="text"
                placeholder="Serial / PIN, e.g. PTL5988 or 521190"
                value={serialQuery}
                onChange={(e) => setSerialQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSerialLookup()}
              />
              <button className="btn-primary" onClick={runSerialLookup}>Find by serial</button>
            </div>
            {serialStatus && <div className="pilot-serial-status">{serialStatus}</div>}
            {serialMatches.length > 0 && (
              <div className="pilot-machine-grid pilot-machine-grid--results">
                {serialMatches.map((machine) => (
                  <button key={`serial:${machine.modelId}`} className="pilot-machine-card" onClick={() => onSelect("pilot-machine", machine.modelId)}>
                    <span className="pilot-machine-check">
                      {machine.matchConfidence === "dominant" ? "Best serial match" : "Serial match"}
                    </span>
                    <strong>{machine.displayName}</strong>
                    <small>{machine.manufacturer} · {machine.machineType}</small>
                    <span>Matched range: {formatSerialRange(machine.bestMatch)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="searchbar">
            <input
              type="text"
              placeholder="Search FD75, D65, header adapter, windrower, sprayer"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="pilot-scope-tabs" role="tablist" aria-label="Machine focus">
            <button
              type="button"
              className={scope === "focus" ? "active" : ""}
              onClick={() => setScope("focus")}
            >
              Harvest focus
            </button>
            <button
              type="button"
              className={scope === "macdon" ? "active" : ""}
              onClick={() => setScope("macdon")}
            >
              MacDon only
            </button>
            <button
              type="button"
              className={scope === "all" ? "active" : ""}
              onClick={() => setScope("all")}
            >
              All verified
            </button>
          </div>

          <div className="section-head">
            <h3>{scope === "macdon" ? "MacDon verified machines" : scope === "focus" ? "Harvest-focus verified machines" : "Verified machines"}</h3>
            <span className="pilot-picker-count">{pilots.length}</span>
          </div>

          <div className="pilot-machine-grid">
            {pilots.map((machine) => (
              <button key={machine.id} className="pilot-machine-card" onClick={() => onSelect("pilot-machine", machine.id)}>
                <span className="pilot-machine-check">{marketFocusLabel(machine)}</span>
                <strong>{machine.displayName}</strong>
                <small>{machine.manufacturer} · {machine.machineType}</small>
                <span>{machine.partCount.toLocaleString()} verified parts · {machine.assemblyCount} assemblies</span>
              </button>
            ))}
          </div>
          {pilots.length === 0 && (
            <div className="empty-note">No verified machines match “{q}”.</div>
          )}
        </div>
      </div>
    </div>
  );
}

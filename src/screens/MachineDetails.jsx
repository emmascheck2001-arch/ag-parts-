import { TopBar } from "../components/TopBar";
import { MACHINES, MACHINE_PARTS } from "../data/demo";
import { PartRow } from "../components/PartRow";

export function MachineDetails({ machine, onBack, onPartSelect }) {
  const machineData = MACHINES.find(m => m.nm === machine);

  return (
    <div className="screen active">
      <TopBar title={machine} onBack={onBack} right={machineData?.ic} />
      
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          <div className="card" style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Common replacement parts for this model:
            </div>
          </div>

          {MACHINE_PARTS.map((part) => (
            <PartRow
              key={part.pn}
              part={part}
              onSelect={() => onPartSelect(part.pn)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import { TopBar } from "../components/TopBar";
import { MACHINES, MACHINE_PARTS } from "../data/demo";
import { PartRow } from "../components/PartRow";
import { UIIcon } from "../components/icons";

export function MachineDetails({ machine, onBack, onPartSelect }) {
  const machineData = MACHINES.find((m) => m.nm === machine);
  const manuals = machineData?.manuals || [];

  return (
    <div className="screen active">
      <TopBar title={machine} onBack={onBack} right={machineData?.ic} />

      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* Manuals & Guides */}
          {manuals.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px", color: "var(--text-muted)" }}>
                Manuals & Guides
              </h3>
              {manuals.map((man) => (
                <a
                  key={man.title}
                  href={man.url}
                  target="_blank"
                  rel="noreferrer"
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                    textDecoration: "none",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: "var(--ag-green)", flexShrink: 0, lineHeight: 0 }}>
                    <UIIcon.doc width="22" height="22" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{man.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{man.type}</div>
                  </div>
                  <span style={{ color: "var(--text-muted)", flexShrink: 0, lineHeight: 0 }}>
                    <UIIcon.external width="16" height="16" />
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Common replacement parts */}
          <h3 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px", color: "var(--text-muted)" }}>
            Common Replacement Parts
          </h3>
          {MACHINE_PARTS.map((part) => (
            <PartRow key={part.pn} part={part} onSelect={() => onPartSelect(part.pn)} />
          ))}
        </div>
      </div>
    </div>
  );
}

import { TopBar } from "../components/TopBar";
import { UIIcon } from "../components/icons";


const steps = [
  {
    number: "1",
    title: "Choose the exact machine",
    description: "Save the machine once, then keep every search, photo, and assembly locked to that exact machine.",
    icon: UIIcon.tractor,
  },
  {
    number: "2",
    title: "Search or use a photo",
    description: "Enter a part name or OEM number, or photograph the number stamped on the part or tag. The current strongest flow is MacDon/header/draper harvest parts.",
    icon: UIIcon.camera,
  },
  {
    number: "3",
    title: "Open the exact verified part",
    description: "See its OEM number, assembly, callout, quantity, serial notes, and source manual diagram together.",
    icon: UIIcon.search,
  },
];

export function HowItWorks({ onBack }) {
  return (
    <div className="screen active">
      <TopBar title="How EzParts Works" onBack={onBack} />
      <div className="scroll">
        <div className="help-fast">
          <span className="pilot-kicker">Current rollout</span>
          <h2>Machine → part → verified answer</h2>
          <p className="help-fast__intro">EzParts is narrowing in on the fastest trustworthy flow for harvest parts. Pick the machine first, then search, scan, or browse assemblies without leaving that machine context.</p>

          <div className="help-fast__steps">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.number}>
                  <span className="help-fast__number">{step.number}</span>
                  <span className="help-fast__icon"><Icon width="24" height="24" /></span>
                  <div><h3>{step.title}</h3><p>{step.description}</p></div>
                </article>
              );
            })}
          </div>

          <div className="help-fast__proof">
            <strong>What “verified” means</strong>
            <p>Parts are placed from pinned manufacturer catalog pages. EzParts keeps the machine, system, subsystem, assembly, callout, and source page connected so a matching word alone cannot decide fitment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

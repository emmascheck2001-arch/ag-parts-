import { TopBar } from "../components/TopBar";
import { UIIcon } from "../components/icons";


const steps = [
  {
    number: "1",
    title: "Pick your machine",
    description: "Every search stays inside that machine so unrelated parts do not get mixed in.",
    icon: UIIcon.tractor,
  },
  {
    number: "2",
    title: "Search or use a picture",
    description: "Enter a part name or OEM number, or photograph the number stamped on the part or tag.",
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
      <TopBar title="How EZPARTS Works" onBack={onBack} />
      <div className="scroll">
        <div className="help-fast">
          <span className="pilot-kicker">Fewest clicks possible</span>
          <h2>Machine → part → answer</h2>
          <p className="help-fast__intro">The catalog hierarchy stays organized behind the screen. You only make the decisions needed to reach the correct part.</p>

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
            <p>Parts are placed from pinned manufacturer catalog pages. EZPARTS keeps the machine, system, subsystem, assembly, callout, and source page connected so a matching word alone cannot decide fitment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

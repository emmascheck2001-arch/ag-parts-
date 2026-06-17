import { TopBar } from "../components/TopBar";
import { CATS } from "../data/demo";
import { CatIcon, UIIcon } from "../components/icons";

export function Categories({ onBack, onSelect }) {
  return (
    <div className="screen active">
      <TopBar title="Browse Categories" onBack={onBack} />

      <div className="scroll">
        <div className="home">
          <div className="cat-grid">
            {CATS.map((cat) => {
              const Ic = CatIcon[cat.t] || UIIcon.grid;
              return (
                <button
                  key={cat.t}
                  className="cat-tile cat-tile--lg"
                  onClick={() => onSelect("category", cat.t)}
                >
                  <Ic width="28" height="28" />
                  <span>{cat.t}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

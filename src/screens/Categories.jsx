import { TopBar } from "../components/TopBar";
import { CATS } from "../data/demo";

export function Categories({ onBack, onSelect }) {
  return (
    <div className="screen active">
      <TopBar title="Browse Categories" onBack={onBack} />
      
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {CATS.map((cat) => (
              <div
                key={cat.t}
                className="card"
                onClick={() => onSelect("category", cat.t)}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  padding: "20px 12px",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>{cat.ic}</div>
                <div style={{ fontSize: "12px", fontWeight: "600" }}>{cat.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { PartRow } from "../components/PartRow";
import { MACHINES, CATS, RECENT, PARTS } from "../data/demo";

export function Home({ onSelect, onSearch }) {
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    if (search.trim()) onSearch(search);
  };

  return (
    <div className="screen active">
      <TopBar title="PartFinder AG" variant="green" right="⚙️" />
      
      <div className="scroll">
        <div style={{ padding: "20px 16px" }}>
          {/* Search */}
          <div style={{ marginBottom: "24px" }}>
            <input
              type="text"
              placeholder="Search part #, machine, or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "14px",
              }}
            />
            <button
              onClick={handleSearch}
              className="btn-primary"
              style={{ width: "100%", marginTop: "8px" }}
            >
              Search
            </button>
          </div>

          {/* Recent Searches */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "var(--text-muted)" }}>
              Recent Searches
            </h3>
            {RECENT.map((item, i) => (
              <div
                key={i}
                className="card"
                onClick={() => onSearch(item)}
                style={{ cursor: "pointer", marginBottom: "8px" }}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Popular Machines */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "var(--text-muted)" }}>
              Popular Machines
            </h3>
            {MACHINES.map((machine) => (
              <div
                key={machine.nm}
                className="card"
                onClick={() => onSelect("machines", machine.nm)}
                style={{ cursor: "pointer", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}
              >
                <img
                  src={machine.img}
                  alt={machine.nm}
                  loading="lazy"
                  style={{ width: "44px", height: "32px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                />
                {machine.nm}
              </div>
            ))}
          </div>

          {/* Popular Categories */}
          <div>
            <h3 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "var(--text-muted)" }}>
              Popular Categories
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {CATS.map((cat) => (
                <div
                  key={cat.t}
                  className="card"
                  onClick={() => onSelect("categories", cat.t)}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    padding: "12px 8px",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>{cat.ic}</div>
                  <div style={{ fontSize: "11px" }}>{cat.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

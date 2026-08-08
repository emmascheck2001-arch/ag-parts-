import { useState, useRef } from "react";
import { CATS } from "../data/demo";
import { UIIcon, CatIcon } from "../components/icons";
import { machines as getMachines } from "../lib/db";
import { getFleet } from "../lib/fleet";

export function Home({ onSelect, onSearch, onNav, recent = [], onClearRecent }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  // "My Machines" = ONLY the user's saved fleet (the machines they own).
  const allMachines = getMachines();
  const fleet = getFleet().map((nm) => allMachines.find((m) => m.nm === nm)).filter(Boolean);
  const myMachines = fleet.slice(0, 6);

  // First-ever open with an empty fleet → prompt once to add machines, ever.
  const [dismissed, setDismissed] = useState(false);
  const showWelcome = !dismissed && myMachines.length === 0 && !localStorage.getItem("ez_fleet_prompted");
  const dismissWelcome = () => {
    localStorage.setItem("ez_fleet_prompted", "1");
    setDismissed(true);
  };

  const handleSearch = () => {
    if (search.trim()) onSearch(search);
  };

  const focusSearch = () => inputRef.current?.focus();

  const actions = [
    { ic: "camera", t: "Scan Part", s: "Use camera", on: () => onNav("scan") },
    { ic: "tractor", t: "Search by Machine", s: "Browse machines", on: () => onNav("machines") },
    { ic: "keypad", t: "Enter Part Number", s: "Manual search", on: focusSearch },
  ];

  return (
    <div className="screen active">
      <div className="scroll">
        <div className="home">
          {/* Header */}
          <div className="home-head">
            <div>
              <div className="brand">Ez<span>Parts</span></div>
              <div className="brand-sub">Find the right part for your machine.</div>
            </div>
          </div>

          {/* One-time welcome — prompt to build your fleet (shown only on first open) */}
          {showWelcome && (
            <div className="card" style={{ marginBottom: 14, borderColor: "var(--ag-green)", background: "var(--ag-green-soft)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>👋 Welcome to EzParts</div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10 }}>
                Add the machines you own to <strong>My Machines</strong> so your parts are one tap away.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" onClick={() => { dismissWelcome(); onNav("machines"); }}
                  style={{ flex: 1, padding: 10, fontWeight: 700 }}>Add my machines</button>
                <button onClick={dismissWelcome}
                  style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer" }}>Later</button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="searchbar">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search part number, name or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="search-go" onClick={handleSearch} aria-label="Search">
              <UIIcon.search width="18" height="18" />
            </button>
          </div>

          {/* Action tiles */}
          <div className="action-grid">
            {actions.map((a) => {
              const Ic = UIIcon[a.ic];
              return (
                <button key={a.t} className="action-tile" onClick={a.on}>
                  <Ic width="26" height="26" />
                  <div className="action-t">{a.t}</div>
                  <div className="action-s">{a.s}</div>
                </button>
              );
            })}
          </div>

          {/* My Machines — only the user's saved fleet */}
          <div className="section-head">
            <h3>My Machines</h3>
            <button className="link" onClick={() => onNav("machines")}>{myMachines.length ? "Add / manage" : ""}</button>
          </div>
          {myMachines.length > 0 ? (
            <div className="machines-row">
              {myMachines.map((m) => (
                <button key={m.nm} className="machine-tile" onClick={() => onSelect("machines", m.nm)}>
                  {m.img
                    ? <img src={m.img} alt={m.nm} loading="lazy" />
                    : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, background: "var(--surface)", width: "100%", aspectRatio: "16/10" }}>{m.ic || "🚜"}</div>}
                  <div className="machine-tile-name">{m.nm}</div>
                  <div className="machine-tile-type">{m.ty}</div>
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => onNav("machines")} className="card"
              style={{ width: "100%", textAlign: "center", padding: "22px 16px", cursor: "pointer", border: "1px dashed var(--border)", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>🚜</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>No machines yet</div>
              <div style={{ fontSize: 11.5, marginTop: 3 }}>Tap to add the machines you own</div>
            </button>
          )}

          {/* Quick Categories */}
          <div className="section-head">
            <h3>Quick Categories</h3>
          </div>
          <div className="cat-grid">
            {CATS.slice(0, 6).map((c) => {
              const Ic = CatIcon[c.t] || UIIcon.grid;
              return (
                <button key={c.t} className="cat-tile" onClick={() => onNav("categories")}>
                  <Ic width="28" height="28" />
                  <span>{c.t}</span>
                </button>
              );
            })}
          </div>
          <button className="viewall-row" onClick={() => onNav("categories")}>
            <UIIcon.grid width="20" height="20" />
            <div>
              <div className="viewall-t">View all categories</div>
              <div className="viewall-s">Browse all parts</div>
            </div>
          </button>

          {/* Recent Searches — real, persisted searches; hidden when empty */}
          {recent.length > 0 && (
            <>
              <div className="section-head">
                <h3>Recent Searches</h3>
                <button className="link" onClick={() => onClearRecent && onClearRecent()}>Clear all</button>
              </div>
              <div className="recent-list">
                {recent.map((item, i) => (
                  <button key={i} className="recent-row" onClick={() => onSearch(item)}>
                    <UIIcon.clock width="18" height="18" className="recent-clock" />
                    <span className="recent-text">{item}</span>
                    <UIIcon.chevron width="18" height="18" className="recent-chev" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

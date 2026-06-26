import { useState, useRef } from "react";
import { CATS } from "../data/demo";
import { UIIcon, CatIcon } from "../components/icons";
import { getMachines } from "../lib/catalog";
import { getFleet } from "../lib/fleet";

export function Home({ onSelect, onSearch, onNav, recent = [], onClearRecent }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  // "My Machines" = the user's saved fleet if any, else the real catalogued
  // machines — so every tile leads to a populated parts page (no dead demo links).
  const allMachines = getMachines();
  const fleet = getFleet().map((nm) => allMachines.find((m) => m.nm === nm)).filter(Boolean);
  const myMachines = (fleet.length ? fleet : allMachines).slice(0, 6);

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
              <div className="brand-sub">Search every supplier. Find the right part.</div>
            </div>
            <button className="icon-btn" aria-label="Orders" onClick={() => onNav("orders")}>
              <UIIcon.bell width="22" height="22" />
            </button>
          </div>

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

          {/* My Machines */}
          <div className="section-head">
            <h3>My Machines</h3>
            <button className="link" onClick={() => onNav("machines")}>View all</button>
          </div>
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

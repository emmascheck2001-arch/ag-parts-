import { useState, useRef } from "react";
import { MACHINES, CATS, RECENT } from "../data/demo";
import { UIIcon, CatIcon } from "../components/icons";

export function Home({ onSelect, onSearch, onNav }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  const handleSearch = () => {
    if (search.trim()) onSearch(search);
  };

  const focusSearch = () => inputRef.current?.focus();

  const actions = [
    { ic: "camera", t: "Scan Part", s: "Use camera", on: () => onNav("scan") },
    { ic: "tractor", t: "Search by Machine", s: "Find parts", on: focusSearch },
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
            <button className="icon-btn" aria-label="Notifications">
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
            {MACHINES.map((m) => (
              <button key={m.nm} className="machine-tile" onClick={() => onSelect("machines", m.nm)}>
                <img src={m.img} alt={m.nm} loading="lazy" />
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

          {/* Recent Searches */}
          <div className="section-head">
            <h3>Recent Searches</h3>
            <button className="link" onClick={() => onSearch("")}>Clear all</button>
          </div>
          <div className="recent-list">
            {RECENT.map((item, i) => (
              <button key={i} className="recent-row" onClick={() => onSearch(item)}>
                <UIIcon.clock width="18" height="18" className="recent-clock" />
                <span className="recent-text">{item}</span>
                <UIIcon.chevron width="18" height="18" className="recent-chev" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { MACHINES, CATS, RECENT } from "../data/demo";

/* ── inline line icons (stroke = currentColor) ──────────────────────────── */
const svg = (children, vb = "0 0 24 24") => (p) => (
  <svg
    viewBox={vb}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
);

const Icon = {
  bell: svg(<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
  search: svg(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  camera: svg(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>),
  tractor: svg(<><circle cx="7" cy="17" r="3" /><circle cx="18" cy="17" r="2.5" /><path d="M4 17V9h6l2 5" /><path d="M10 9V6h4l2 6" /><path d="M10 17h5" /></>),
  keypad: svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h.01M12 9h.01M17 9h.01M7 13h.01M17 13h.01M9.5 13h5" /></>),
  clock: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  chevron: svg(<path d="m9 6 6 6-6 6" />),
  grid: svg(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
  // category icons (by label)
  Engine: svg(<><path d="M5 9v6M3 11v2M19 10h2v4h-2M7 9h5l3 3h3v3h-3l-3 2H7z" /></>),
  Hydraulic: svg(<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />),
  Electrical: svg(<path d="M13 2 4 14h7l-1 8 9-12h-7z" />),
  Filters: svg(<path d="M3 4h18l-7 8v7l-4 2v-9z" />),
  Belts: svg(<><circle cx="8" cy="12" r="5" /><circle cx="16" cy="12" r="5" /></>),
  Bearings: svg(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /></>),
  Drivetrain: svg(<><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" /></>),
  Cooling: svg(<><path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" /></>),
  "Cab & Body": svg(<><rect x="3" y="11" width="18" height="9" rx="1" /><path d="M6 11 8 5h8l2 6" /></>),
};

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
              <div className="brand">PARTFINDER<span> AG</span></div>
              <div className="brand-sub">Search every supplier. Find the right part.</div>
            </div>
            <button className="icon-btn" aria-label="Notifications">
              <Icon.bell width="22" height="22" />
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
              <Icon.search width="18" height="18" />
            </button>
          </div>

          {/* Action tiles */}
          <div className="action-grid">
            {actions.map((a) => {
              const Ic = Icon[a.ic];
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
              const Ic = Icon[c.t] || Icon.grid;
              return (
                <button key={c.t} className="cat-tile" onClick={() => onNav("categories")}>
                  <Ic width="24" height="24" />
                  <span>{c.t}</span>
                </button>
              );
            })}
          </div>
          <button className="viewall-row" onClick={() => onNav("categories")}>
            <Icon.grid width="20" height="20" />
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
                <Icon.clock width="18" height="18" className="recent-clock" />
                <span className="recent-text">{item}</span>
                <Icon.chevron width="18" height="18" className="recent-chev" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

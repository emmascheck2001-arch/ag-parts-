const svg = (children) => (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

const NavIcon = {
  home: svg(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></>),
  machines: svg(<><circle cx="7" cy="17" r="3" /><circle cx="18" cy="17" r="2.5" /><path d="M4 17V9h6l2 5" /><path d="M10 9V6h4l2 6" /></>),
  help: svg(<><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-1 .7-1.5 1.2-1.5 2.5" /><path d="M12 17h.01" /></>),
};

// Search engine only — no cart, orders, or account tabs.
const TABS = [
  { id: "home", label: "My Machines" },
  { id: "machines", label: "Add Machine" },
  { id: "help", label: "Help" },
];

export function BottomNav({ active, onNav }) {
  return (
    <nav className="botnav">
      {TABS.map((tab) => {
        const Icon = NavIcon[tab.id];
        return (
          <button
            key={tab.id}
            className={`nav-btn${active === tab.id ? " active" : ""}`}
            aria-current={active === tab.id ? "page" : undefined}
            onClick={() => onNav(tab.id)}
          >
            <Icon width="22" height="22" />
            <span className="nav-btn-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

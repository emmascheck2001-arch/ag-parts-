const svg = (children) => (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

const NavIcon = {
  home: svg(<><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></>),
  search: svg(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  orders: svg(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" /></>),
  machines: svg(<><circle cx="7" cy="17" r="3" /><circle cx="18" cy="17" r="2.5" /><path d="M4 17V9h6l2 5" /><path d="M10 9V6h4l2 6" /></>),
  account: svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>),
};

export function BottomNav({ active, onNav }) {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "search", label: "Search" },
    { id: "orders", label: "Orders" },
    { id: "machines", label: "Machines" },
    { id: "account", label: "Account" },
  ];

  return (
    <div className="botnav">
      {tabs.map((tab) => {
        const Ic = NavIcon[tab.id];
        return (
          <button
            key={tab.id}
            className={"nav-btn " + (active === tab.id ? "active" : "")}
            onClick={() => onNav(tab.id)}
          >
            <Ic width="22" height="22" />
            <span className="nav-btn-label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

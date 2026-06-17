export function BottomNav({ active, onNav }) {
  const tabs = [
    { id: "home", ic: "🏠", label: "Home" },
    { id: "categories", ic: "📂", label: "Browse" },
    { id: "orders", ic: "📦", label: "Orders" },
  ];

  return (
    <div className="botnav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={"nav-btn " + (active === tab.id ? "active" : "")}
          onClick={() => onNav(tab.id)}
        >
          <span>{tab.ic}</span>
          <span className="nav-btn-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

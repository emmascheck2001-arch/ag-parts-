const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));

export function PartRow({ part, onSelect }) {
  return (
    <div
      className="card"
      onClick={() => onSelect(part.pn)}
      style={{ cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "600" }}>
            {part.ic} {part.name}
          </div>
          <div style={{ fontSize: "12px", color: "#9aa29d", marginTop: "4px" }}>
            Part #: {part.pn}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#24b33f" }}>
            from {money(part.from)}
          </div>
        </div>
      </div>
    </div>
  );
}

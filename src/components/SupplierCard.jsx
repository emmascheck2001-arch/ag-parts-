const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));
const stars = (r) => {
  const f = Math.round(r);
  return "★★★★★".slice(0, f) + "☆☆☆☆☆".slice(0, 5 - f);
};

export function SupplierCard({ supplier, partNum, best, onBuy, distance }) {
  return (
    <div className={"rcard " + (best ? "best" : "")}>
      {best && <span className="best-tag">BEST PRICE</span>}

      <div className="rtop">
        <div className="supp">
          <div className="s1">
            {supplier.s}
            {supplier.oem && <span className="oem-tag">OEM</span>}
          </div>
          <div className="rate">
            <span className="stars">{stars(supplier.rating)}</span> {supplier.rating} ({supplier.n})
          </div>
          {distance && (
            <div style={{ fontSize: "11px", color: "var(--ag-green)", marginTop: "4px", fontWeight: "600" }}>
              📍 {distance} miles away
            </div>
          )}
        </div>
        <div className="rprice">
          <div className="p">{money(supplier.price)}</div>
        </div>
      </div>

      <div className="rmeta">
        <span className="in">{supplier.stock} in stock</span>
        <span className="dot">•</span>
        {money(supplier.ship)} shipping
        <span className="dot">•</span>
        Ships in {supplier.days} day{supplier.days > 1 ? "s" : ""}
      </div>

      <div className="rbot">
        <span className="ships">
          {supplier.days === 1 ? "Ships tomorrow" : "Ships in " + supplier.days + " days"}
        </span>
        <button
          className={"buy " + (best ? "" : "ghost")}
          onClick={() => onBuy(partNum, supplier, supplier.price + supplier.ship)}
        >
          Buy now
        </button>
      </div>
    </div>
  );
}

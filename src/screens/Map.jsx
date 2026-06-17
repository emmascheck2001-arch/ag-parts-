import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { USER_LOCATION, getSuppliersByDistance, calculateGasCost } from "../data/demo";

export function Map({ onBack }) {
  const [tripType, setTripType] = useState("round-trip");
  const isRoundTrip = tripType === "round-trip";
  const suppliers = getSuppliersByDistance(USER_LOCATION.lat, USER_LOCATION.lng);

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleDirections = (lat, lng) => {
    window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
  };

  return (
    <div className="screen active">
      <TopBar title="Find Suppliers" onBack={onBack} />
      
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          {/* User Location */}
          <div className="card" style={{ marginBottom: "16px", background: "rgba(36, 179, 63, 0.08)" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
              📍 Your Location
            </div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              {USER_LOCATION.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {USER_LOCATION.lat}, {USER_LOCATION.lng}
            </div>
          </div>

          {/* Embedded Map */}
          <div className="card" style={{ marginBottom: "16px", padding: 0, overflow: "hidden" }}>
            <iframe
              title="Supplier map"
              width="100%"
              height="220"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=ag+equipment+suppliers+near+${USER_LOCATION.lat},${USER_LOCATION.lng}&output=embed`}
            />
          </div>

          {/* Suppliers by Distance */}
          <div style={{ marginBottom: "8px", fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
            {suppliers.length} Suppliers Nearby
          </div>

          <div className="card" style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: "600" }}>
              Pickup Fuel Estimate Type
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setTripType("one-way")}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: tripType === "one-way" ? "var(--ag-green)" : "var(--surface)",
                  color: tripType === "one-way" ? "#fff" : "var(--text)",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                One-way
              </button>
              <button
                onClick={() => setTripType("round-trip")}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: tripType === "round-trip" ? "var(--ag-green)" : "var(--surface)",
                  color: tripType === "round-trip" ? "#fff" : "var(--text)",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Round-trip
              </button>
            </div>
          </div>

          {suppliers.map((supplier, i) => (
            <div key={i} className="card" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>
                    {supplier.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ag-green)", fontWeight: "600", marginTop: "2px" }}>
                    📍 {supplier.distance} miles away
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    ⛽ Approx ${calculateGasCost(supplier.distance, undefined, undefined, isRoundTrip).toFixed(2)} gas {tripType} (pickup)
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4", marginBottom: "8px" }}>
                <div>{supplier.address}</div>
                <div>{supplier.hours}</div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "var(--ag-green)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDirections(supplier.lat, supplier.lng)}
                >
                  📍 Directions
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "var(--surface)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                  onClick={() => handleCall(supplier.phone)}
                >
                  📞 Call
                </button>
              </div>
            </div>
          ))}

          {/* Map Tip */}
          <div
            style={{
              marginTop: "24px",
              padding: "12px",
              background: "rgba(36, 179, 63, 0.08)",
              borderRadius: "8px",
              border: "1px solid var(--ag-green-soft)",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            💡 <strong>Tip:</strong> Click "Directions" to open maps and navigate to the nearest supplier
          </div>
        </div>
      </div>
    </div>
  );
}

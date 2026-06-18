import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { MACHINES, CATS } from "../data/demo";
import { getListings, addListing, removeListing } from "../lib/listings";

const input = {
  width: "100%", padding: "10px", marginBottom: "8px", borderRadius: "6px",
  border: "1px solid var(--border)", background: "var(--surface)",
  color: "var(--text)", fontSize: "13px",
};

export function ListPart({ onBack, onNav }) {
  const [dealer, setDealer] = useState("");
  const [pn, setPn] = useState("");
  const [name, setName] = useState("");
  const [cat, setCat] = useState(CATS[0]?.t || "Filters");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [machines, setMachines] = useState([]);
  const [other, setOther] = useState("");
  const [listings, setListings] = useState(getListings());

  const toggleMachine = (nm) =>
    setMachines((m) => (m.includes(nm) ? m.filter((x) => x !== nm) : [...m, nm]));

  const ready = dealer && pn && name && price;

  const submit = () => {
    if (!ready) return;
    const extra = other.split(",").map((s) => s.trim()).filter(Boolean);
    addListing({
      dealer, pn: pn.trim(), name, cat, price, stock,
      machines: [...machines, ...extra],
    });
    setListings(getListings());
    setPn(""); setName(""); setPrice(""); setStock(""); setMachines([]); setOther("");
  };

  const del = (id) => { removeListing(id); setListings(getListings()); };

  return (
    <div className="screen active">
      <TopBar title="List a Part" onBack={onBack} />
      <div className="scroll">
        <div style={{ padding: "16px" }}>
          <div className="card" style={{ marginBottom: "14px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>List the parts you sell</h3>
            <div style={{ fontSize: "11.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
              Add a part and tag which machines it fits — farmers searching that machine will find it.
              Got a whole catalog?{" "}
              <button onClick={() => onNav && onNav("extract")} style={{ background: "none", border: "none", color: "var(--ag-green)", padding: 0, cursor: "pointer", fontWeight: 600 }}>
                Bulk import →
              </button>
            </div>

            <input style={input} placeholder="Your dealership name" value={dealer} onChange={(e) => setDealer(e.target.value)} />
            <input style={input} placeholder="Part number (e.g. RE509672)" value={pn} onChange={(e) => setPn(e.target.value)} />
            <input style={input} placeholder="Part name (e.g. Engine Oil Filter)" value={name} onChange={(e) => setName(e.target.value)} />
            <select style={input} value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATS.map((c) => <option key={c.t} value={c.t}>{c.t}</option>)}
            </select>
            <div style={{ display: "flex", gap: "8px" }}>
              <input style={{ ...input, flex: 1 }} type="number" placeholder="Price ($)" value={price} onChange={(e) => setPrice(e.target.value)} />
              <input style={{ ...input, flex: 1 }} type="number" placeholder="In stock" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>

            <div style={{ fontSize: "12px", fontWeight: 600, margin: "6px 0 6px" }}>Fits which machines?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {MACHINES.map((m) => {
                const on = machines.includes(m.nm);
                return (
                  <button
                    key={m.nm}
                    onClick={() => toggleMachine(m.nm)}
                    style={{
                      fontSize: "11px", fontWeight: 600, padding: "6px 10px", borderRadius: "999px",
                      cursor: "pointer",
                      border: "1px solid " + (on ? "var(--ag-green)" : "var(--border)"),
                      background: on ? "var(--ag-green-soft)" : "var(--surface)",
                      color: on ? "var(--ag-green)" : "var(--text-muted)",
                    }}
                  >
                    {on ? "✓ " : ""}{m.nm}
                  </button>
                );
              })}
            </div>
            <input style={input} placeholder="Other machines (comma separated)" value={other} onChange={(e) => setOther(e.target.value)} />

            <button className="btn-primary" onClick={submit} disabled={!ready} style={{ width: "100%", padding: "12px", marginTop: "4px", opacity: ready ? 1 : 0.5 }}>
              List this part
            </button>
          </div>

          {listings.length > 0 && (
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>My Listings ({listings.length})</h3>
              {listings.map((l) => (
                <div key={l.id} className="card" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "start", gap: "8px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{l.pn} — {l.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      ${l.price}{l.stock ? ` · ${l.stock} in stock` : ""} · {l.dealer}
                    </div>
                    {l.machines?.length > 0 && (
                      <div style={{ fontSize: "11px", color: "var(--ag-green)", marginTop: "2px" }}>
                        Fits: {l.machines.join(", ")}
                      </div>
                    )}
                  </div>
                  <button onClick={() => del(l.id)} style={{ background: "none", border: "none", color: "var(--danger)", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

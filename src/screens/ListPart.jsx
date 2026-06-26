import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { MACHINES, CATS } from "../data/demo";
import { getListings, addListing, removeListing } from "../lib/listings";
import { getDealerAccount } from "../lib/stripe";
import { supabase } from "../lib/supabase";

async function saveToDb(payload) {
  try {
    let auth = {};
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) auth = { Authorization: "Bearer " + token };
    } catch { /* ignore */ }
    const res = await fetch("/.netlify/functions/save-inventory", {
      method: "POST", headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { configured: false };
    return res.json();
  } catch { return { configured: false }; }
}

const input = {
  width: "100%", padding: "10px", marginBottom: "8px", borderRadius: "6px",
  border: "1px solid var(--border)", background: "var(--surface)",
  color: "var(--text)", fontSize: "13px",
};

export function ListPart({ onBack, onNav, dealerName = "" }) {
  const [dealer, setDealer] = useState(dealerName);
  const [pn, setPn] = useState("");
  const [name, setName] = useState("");
  const [cat, setCat] = useState(CATS[0]?.t || "Filters");
  const [price, setPrice] = useState("");
  const [ship, setShip] = useState("");
  const [stock, setStock] = useState("");
  const [cond, setCond] = useState("New");
  const [machines, setMachines] = useState([]);
  const [other, setOther] = useState("");
  const [listings, setListings] = useState(getListings());
  const [status, setStatus] = useState("");
  const [statusOk, setStatusOk] = useState(true);
  const [editingId, setEditingId] = useState(null); // id of the listing being edited
  const [error, setError] = useState("");

  const toggleMachine = (nm) =>
    setMachines((m) => (m.includes(nm) ? m.filter((x) => x !== nm) : [...m, nm]));

  // Validate the numeric fields before listing — no $0/negative prices reaching
  // the marketplace, no negative stock/shipping.
  const priceNum = parseFloat(price);
  const shipNum = ship === "" ? 0 : parseFloat(ship);
  const stockNum = stock === "" ? 0 : parseFloat(stock);
  const validationError = () => {
    if (!dealer.trim()) return "Add your dealership name.";
    if (!pn.trim()) return "Add a part number.";
    if (!name.trim()) return "Add a part name.";
    if (!(priceNum > 0)) return "Price must be greater than $0.";
    if (shipNum < 0) return "Shipping can't be negative.";
    if (stockNum < 0) return "Stock can't be negative.";
    return "";
  };
  const ready = dealer && pn && name && price;

  const resetForm = () => {
    setPn(""); setName(""); setPrice(""); setShip(""); setStock(""); setCond("New");
    setMachines([]); setOther(""); setEditingId(null);
  };

  const startEdit = (l) => {
    setEditingId(l.id);
    setDealer(l.dealer || dealerName);
    setPn(l.pn || ""); setName(l.name || ""); setCat(l.cat || CATS[0]?.t || "Filters");
    setPrice(String(l.price ?? "")); setShip(String(l.ship ?? "")); setStock(String(l.stock ?? ""));
    setCond(l.cond || "New"); setMachines(l.machines || []); setOther("");
    setError(""); setStatus("");
    window?.scrollTo?.(0, 0);
  };

  const submit = async () => {
    const v = validationError();
    if (v) { setError(v); return; }
    setError("");
    const extra = other.split(",").map((s) => s.trim()).filter(Boolean);
    const allMachines = [...machines, ...extra];
    const listing = { dealer, pn: pn.trim(), name, cat, cond, price, ship, stock, machines: allMachines };
    // Editing replaces the old listing; new listings are appended.
    if (editingId) removeListing(editingId);
    addListing(listing); // instant local UI
    setListings(getListings());
    setStatus("Saving…"); setStatusOk(true);
    // Write to the real DB (dealer + inventory + fitments). Routes payouts to
    // your Stripe account if you've onboarded.
    const r = await saveToDb({ ...listing, days: 2, stripeAccountId: getDealerAccount() || undefined });
    if (r.configured) {
      setStatusOk(true);
      setStatus(`${editingId ? "Updated" : "Listed"} to marketplace${r.fitments ? ` · ${r.fitments} machine fits` : ""} ✓`);
    } else {
      // Honest warning — the part is NOT live on the marketplace yet.
      setStatusOk(false);
      setStatus("⚠ Saved on this device only — not live on the marketplace yet (backend not connected).");
    }
    resetForm();
  };

  const del = (id) => {
    removeListing(id);
    setListings(getListings());
    if (editingId === id) resetForm();
  };

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
            <div style={{ display: "flex", gap: "8px" }}>
              <select style={{ ...input, flex: 1 }} value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATS.map((c) => <option key={c.t} value={c.t}>{c.t}</option>)}
              </select>
              <select style={{ ...input, flex: 1 }} value={cond} onChange={(e) => setCond(e.target.value)}>
                {["New", "Used", "Reman", "OEM Surplus"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input style={{ ...input, flex: 1 }} type="number" min="0" step="0.01" placeholder="Price ($)" value={price} onChange={(e) => setPrice(e.target.value)} />
              <input style={{ ...input, flex: 1 }} type="number" min="0" step="0.01" placeholder="Ship ($)" value={ship} onChange={(e) => setShip(e.target.value)} />
              <input style={{ ...input, flex: 1 }} type="number" min="0" step="1" placeholder="In stock" value={stock} onChange={(e) => setStock(e.target.value)} />
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

            {error && (
              <div style={{ fontSize: "11.5px", color: "var(--danger)", marginTop: "4px", marginBottom: "4px", textAlign: "center" }}>{error}</div>
            )}
            <button className="btn-primary" onClick={submit} disabled={!ready} style={{ width: "100%", padding: "12px", marginTop: "4px", opacity: ready ? 1 : 0.5 }}>
              {editingId ? "Save changes" : "List this part"}
            </button>
            {editingId && (
              <button onClick={resetForm} style={{ width: "100%", padding: "10px", marginTop: "6px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}>
                Cancel edit
              </button>
            )}
            {status && (
              <div style={{ fontSize: "11.5px", color: statusOk ? "var(--ag-green)" : "var(--star)", marginTop: "8px", textAlign: "center", lineHeight: 1.4 }}>
                {status}
              </div>
            )}
          </div>

          {listings.length > 0 && (
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>My Listings ({listings.length})</h3>
              {listings.map((l) => (
                <div key={l.id} className="card" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "start", gap: "8px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{l.pn} — {l.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      ${l.price}{l.cond ? ` · ${l.cond}` : ""}{l.stock ? ` · ${l.stock} in stock` : ""} · {l.dealer}
                    </div>
                    {l.machines?.length > 0 && (
                      <div style={{ fontSize: "11px", color: "var(--ag-green)", marginTop: "2px" }}>
                        Fits: {l.machines.join(", ")}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0, alignItems: "flex-end" }}>
                    <button onClick={() => startEdit(l)} style={{ background: "none", border: "none", color: "var(--ag-green)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      Edit
                    </button>
                    <button onClick={() => del(l.id)} style={{ background: "none", border: "none", color: "var(--danger)", fontSize: "12px", cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

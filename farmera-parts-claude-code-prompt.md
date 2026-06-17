# FarmerA Parts — Claude Code Prompt

Paste this entire prompt into Claude Code to build your app.

---

## Prompt

Build me a full-stack agricultural parts app called "FarmerA Parts" using Next.js and a local SQLite database.

The app should have 3 tabs: Search, Inventory, and Orders.

---

### SEARCH TAB
- Search parts by name, part number, or equipment
- Filter by supplier: NAPA, CNH Industrial, AGCO, John Deere, Bourgault, Local stores
- Show part cards with best price, supplier badge, stock status
- Click a card to see all suppliers side by side with pricing, stock status, and an Order button

### INVENTORY TAB
- Full CRUD — add, edit quantity, delete parts
- Stats row: total SKUs, total value, low stock count, out of stock count
- Color-coded quantity badges (green = 3+, yellow = 1–2, red = 0)

### ORDERS TAB
- Order history list with status tags: Delivered, In Transit, Pending
- Show order ID, date, items, total, and supplier

---

### DATABASE (SQLite via better-sqlite3)

Create a `db/seed.js` file that pre-populates the database with the following parts catalog. Each part has a `parts` table row and one or more `suppliers` table rows with price (CAD) and stock status.

#### BOURGAULT PARTS
| Part Name | Part Number | Suppliers | Price (CAD) | Stock |
|---|---|---|---|---|
| Bourgault steel tip 5/16" | BG-3195-3 | Bourgault Dealer – Saskatoon | $18.50 | In stock |
| Bourgault steel tip 5/16" | BG-3195-3 | Local – Warman Ag | $17.00 | Low stock |
| Bourgault carbide tip | BG-3194-3 | Bourgault Dealer – Saskatoon | $42.00 | In stock |
| Bourgault carbide tip | BG-3194-3 | Bourgault Dealer – Regina | $43.50 | In stock |
| Bourgault packer tire 400x15 | BG-6145-17 | Bourgault Dealer – Saskatoon | $285.00 | In stock |
| Bourgault seed boot | BG-2580 | Bourgault Dealer – Saskatoon | $31.00 | In stock |
| Bourgault seed boot | BG-2580 | Local – Warman Ag | $29.50 | Low stock |
| Bourgault shank assembly | BG-4380 | Bourgault Dealer – Saskatoon | $124.00 | In stock |
| Bourgault shank assembly | BG-4380 | Bourgault Dealer – Regina | $126.00 | In stock |
| Bourgault press wheel bearing | BG-8872 | Bourgault Dealer – Saskatoon | $38.75 | In stock |
| Bourgault press wheel bearing | BG-8872 | NAPA – Saskatoon | $35.99 | Low stock |
| Bourgault knife tip | BG-3190 | Bourgault Dealer – Saskatoon | $22.00 | In stock |
| Bourgault knife tip | BG-3190 | Local – Warman Ag | $20.50 | In stock |
| Bourgault fertilizer tube | BG-2610 | Bourgault Dealer – Saskatoon | $14.25 | In stock |
| Bourgault row unit spring | BG-4195 | Bourgault Dealer – Saskatoon | $9.50 | In stock |
| Bourgault row unit spring | BG-4195 | Bourgault Dealer – Regina | $9.50 | Out of stock |
| Bourgault gauge wheel arm | BG-5520 | Bourgault Dealer – Saskatoon | $67.00 | In stock |
| Bourgault wing nut kit | BG-1140 | Bourgault Dealer – Saskatoon | $6.25 | In stock |
| Bourgault depth band | BG-6210 | Bourgault Dealer – Saskatoon | $19.00 | In stock |
| Bourgault packer axle bolt | BG-8810 | Bourgault Dealer – Saskatoon | $4.75 | In stock |

#### JOHN DEERE PARTS
| Part Name | Part Number | Suppliers | Price (CAD) | Stock |
|---|---|---|---|---|
| Combine rotor bearing | JD-AH212983 | John Deere – Humboldt | $164.00 | In stock |
| Combine rotor bearing | JD-AH212983 | AGCO Online | $155.00 | Low stock |
| Combine feeder chain | JD-H215028 | John Deere – Humboldt | $378.00 | Low stock |
| Header auger drive belt | JD-H208159 | John Deere – Humboldt | $52.00 | In stock |
| Header auger drive belt | JD-H208159 | NAPA – Saskatoon | $47.99 | In stock |
| Cleaning shoe fan belt | JD-RE504836 | John Deere – Humboldt | $38.00 | In stock |
| Elevator chain | JD-AH139048 | John Deere – Humboldt | $215.00 | In stock |
| Concave section | JD-AH119302 | John Deere – Humboldt | $489.00 | Low stock |
| Spreader blade set | JD-BN15782 | John Deere – Humboldt | $94.00 | In stock |
| Unloading auger chain | JD-AH100995 | John Deere – Humboldt | $267.00 | In stock |

#### CNH INDUSTRIAL PARTS
| Part Name | Part Number | Suppliers | Price (CAD) | Stock |
|---|---|---|---|---|
| Hydraulic oil filter | HF6553 | CNH – Regina | $25.50 | In stock |
| Hydraulic oil filter | HF6553 | NAPA – Saskatoon | $22.49 | In stock |
| Hydraulic oil filter | HF6553 | Local – Warman Ag | $20.50 | Low stock |
| Fuel filter assembly | FF5421 | CNH – Regina | $38.50 | In stock |
| Fuel filter assembly | FF5421 | NAPA – Saskatoon | $34.25 | In stock |
| Tractor headlight bulb | CNH-84301285 | CNH – Regina | $11.50 | In stock |
| Tractor headlight bulb | CNH-84301285 | NAPA – Saskatoon | $9.75 | Out of stock |
| Radiator hose – upper | RH-UP992 | CNH – Regina | $30.50 | In stock |
| Radiator hose – upper | RH-UP992 | NAPA – Saskatoon | $27.75 | In stock |
| Transmission filter | CNH-47639532 | CNH – Regina | $44.00 | In stock |
| Air cleaner assembly | CNH-84234022 | CNH – Regina | $112.00 | Low stock |

#### AGCO PARTS
| Part Name | Part Number | Suppliers | Price (CAD) | Stock |
|---|---|---|---|---|
| PTO shaft guard | PTG-4412 | AGCO Online | $70.50 | In stock |
| PTO shaft guard | PTG-4412 | Local – Warman Ag | $67.00 | Low stock |
| Air filter – primary | AF25557 | AGCO Online | $57.75 | In stock |
| Air filter – primary | AF25557 | NAPA – Saskatoon | $52.25 | In stock |
| Cab air filter | AGCO-700728023 | AGCO Online | $38.00 | In stock |
| Feeder house chain | AGCO-700115374 | AGCO Online | $298.00 | Low stock |

#### NAPA PARTS
| Part Name | Part Number | Suppliers | Price (CAD) | Stock |
|---|---|---|---|---|
| V-belt A85 | VB-A85 | NAPA – Saskatoon | $17.25 | In stock |
| V-belt A85 | VB-A85 | Local – Warman Ag | $15.75 | In stock |
| Spark plug set 6pc | SP-NGK6702 | NAPA – Saskatoon | $37.50 | In stock |
| Hydraulic hose 3/8 x 36 | NH-38036 | NAPA – Saskatoon | $29.99 | In stock |
| Oil filter | NAPA-1515 | NAPA – Saskatoon | $12.50 | In stock |
| Oil filter | NAPA-1515 | Local – Warman Ag | $11.00 | In stock |
| Wheel bearing kit | NAPA-BR930152 | NAPA – Saskatoon | $58.99 | In stock |
| Battery 1000CCA | NAPA-8224 | NAPA – Saskatoon | $189.00 | In stock |

#### LOCAL STORE PARTS
| Part Name | Part Number | Suppliers | Price (CAD) | Stock |
|---|---|---|---|---|
| Baler twine 9000ft | LCL-TWINE9 | Local – Warman Ag | $64.00 | In stock |
| Grease cartridge 14oz | LCL-GREASE14 | Local – Warman Ag | $8.50 | In stock |
| Grease cartridge 14oz | LCL-GREASE14 | NAPA – Saskatoon | $9.25 | In stock |
| Tire repair kit | LCL-TIREKIT | Local – Warman Ag | $22.00 | In stock |
| Safety chain 5/16" | LCL-CHAIN516 | Local – Warman Ag | $34.50 | In stock |

---

### DATABASE SCHEMA

```sql
CREATE TABLE parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  part_number TEXT NOT NULL,
  category TEXT,
  equipment_fit TEXT
);

CREATE TABLE part_suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER REFERENCES parts(id),
  supplier_name TEXT,
  supplier_type TEXT,  -- 'Bourgault', 'Deere', 'CNH', 'AGCO', 'NAPA', 'Local'
  location TEXT,
  price_cad REAL,
  stock_status TEXT  -- 'in', 'low', 'out'
);

CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER REFERENCES parts(id),
  quantity INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 2,
  notes TEXT
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_ref TEXT,
  order_date TEXT,
  supplier TEXT,
  status TEXT,  -- 'delivered', 'transit', 'pending'
  total_cad REAL
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER REFERENCES orders(id),
  part_name TEXT,
  quantity INTEGER,
  unit_price REAL
);
```

---

### DESIGN
- Green primary color: #3B6D11
- Tailwind CSS
- Clean, professional — like a real product
- Mobile responsive
- Supplier badge colors:
  - Bourgault: orange/amber
  - John Deere: green
  - CNH: yellow
  - AGCO: purple
  - NAPA: blue
  - Local: gray

---

### SETUP INSTRUCTIONS TO INCLUDE IN README

```
1. npm install
2. node db/seed.js
3. npm run dev
4. Open http://localhost:3000
```


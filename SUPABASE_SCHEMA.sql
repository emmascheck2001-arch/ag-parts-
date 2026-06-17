-- PartFinder AG Supabase Schema Setup
-- Run these SQL commands in the Supabase SQL Editor

-- 1. Create tables
CREATE TABLE machines (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT,
  emoji TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE parts (
  id BIGSERIAL PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id BIGINT REFERENCES categories(id),
  description TEXT,
  emoji TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE machine_part_fitment (
  id BIGSERIAL PRIMARY KEY,
  machine_id BIGINT REFERENCES machines(id),
  part_id BIGINT REFERENCES parts(id),
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(machine_id, part_id)
);

CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  website TEXT,
  rating DECIMAL(2,1),
  review_count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE parts_suppliers (
  id BIGSERIAL PRIMARY KEY,
  part_id BIGINT REFERENCES parts(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  supplier_price DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  shipping_days INT,
  in_stock INT,
  oem BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(part_id, supplier_id)
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  total_price DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  part_id BIGINT REFERENCES parts(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  quantity INT DEFAULT 1,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_part_fitment ENABLE ROW LEVEL SECURITY;

-- 3. Create policies (allow public read, auth write)
CREATE POLICY "Machines are viewable by everyone" ON machines
  FOR SELECT USING (true);

CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Parts are viewable by everyone" ON parts
  FOR SELECT USING (true);

CREATE POLICY "Suppliers are viewable by everyone" ON suppliers
  FOR SELECT USING (true);

CREATE POLICY "Parts suppliers are viewable by everyone" ON parts_suppliers
  FOR SELECT USING (true);

CREATE POLICY "Machine fitment is viewable by everyone" ON machine_part_fitment
  FOR SELECT USING (true);

CREATE POLICY "Orders viewable by user" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Order items viewable" ON order_items
  FOR SELECT USING (true);

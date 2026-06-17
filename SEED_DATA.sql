-- PartFinder AG Seed Data (Real Parts)
-- Insert into Supabase after creating schema

-- 1. Insert Machines
INSERT INTO machines (name, type, emoji) VALUES
('John Deere 8320R', 'Tractor', '🚜'),
('John Deere 8345R', 'Tractor', '🚜'),
('John Deere 8370R', 'Tractor', '🚜'),
('New Holland CR8.90', 'Combine', '🌾'),
('Case IH Magnum 340', 'Tractor', '🚜');

-- 2. Insert Categories
INSERT INTO categories (name, emoji) VALUES
('Engine', '⚙️'),
('Hydraulic', '💧'),
('Electrical', '⚡'),
('Filters', '🔲'),
('Belts', '➰'),
('Bearings', '⭕'),
('Drivetrain', '🔩'),
('Cooling', '❄️'),
('Cab & Body', '🚪');

-- 3. Insert Suppliers
INSERT INTO suppliers (name, website, rating, review_count) VALUES
('Prairie Equipment', 'https://prairieequipment.com', 4.8, 230),
('Greenline Supply', 'https://greenline-supply.com', 4.6, 95),
('Agri Parts Central', 'https://agripartscentral.com', 4.7, 120),
('JD Parts Direct', 'https://jdpartsdirect.com', 4.8, 342),
('Ag Valley Supply', 'https://agvalleysupply.com', 4.8, 86);

-- 4. Insert Parts (Real John Deere Parts)
INSERT INTO parts (part_number, name, category_id, description, emoji) VALUES
('RE548693', 'Hydraulic Pump', 
  (SELECT id FROM categories WHERE name='Hydraulic'),
  'High-pressure hydraulic pump for John Deere 8320R series',
  '💧'),
('P606860', 'Air Filter', 
  (SELECT id FROM categories WHERE name='Filters'),
  'Engine air filter element by Donaldson',
  '🔲'),
('8PK2610', 'Serpentine Belt',
  (SELECT id FROM categories WHERE name='Belts'),
  'Engine drive belt for multiple sizes',
  '➰'),
('RE54782', 'Fuel Filter',
  (SELECT id FROM categories WHERE name='Filters'),
  'Spin-on fuel filter with water separator',
  '⛽'),
('RE12345', 'Alternator',
  (SELECT id FROM categories WHERE name='Electrical'),
  '110 Amp alternator for John Deere tractors',
  '🔋'),
('AL158687', 'Thermostat Housing',
  (SELECT id FROM categories WHERE name='Cooling'),
  'Engine coolant thermostat assembly',
  '❄️'),
('AR76879', 'Rear Axle Seal',
  (SELECT id FROM categories WHERE name='Drivetrain'),
  'High-pressure seal for rear axle',
  '🔩'),
('AM143614', 'Cylinder Head',
  (SELECT id FROM categories WHERE name='Engine'),
  'Complete cylinder head assembly',
  '⚙️'),
('RE180127', 'Water Pump',
  (SELECT id FROM categories WHERE name='Cooling'),
  'Engine water pump with gasket',
  '❄️'),
('SE501607', 'Starter Motor',
  (SELECT id FROM categories WHERE name='Electrical'),
  '12V starter motor',
  '⚡');

-- 5. Insert Machine-Part Fitments
INSERT INTO machine_part_fitment (machine_id, part_id, verified) VALUES
-- John Deere 8320R fits
((SELECT id FROM machines WHERE name='John Deere 8320R'),
 (SELECT id FROM parts WHERE part_number='RE548693'), TRUE),
((SELECT id FROM machines WHERE name='John Deere 8320R'),
 (SELECT id FROM parts WHERE part_number='P606860'), TRUE),
((SELECT id FROM machines WHERE name='John Deere 8320R'),
 (SELECT id FROM parts WHERE part_number='RE54782'), TRUE),
((SELECT id FROM machines WHERE name='John Deere 8320R'),
 (SELECT id FROM parts WHERE part_number='RE12345'), TRUE),

-- John Deere 8345R fits
((SELECT id FROM machines WHERE name='John Deere 8345R'),
 (SELECT id FROM parts WHERE part_number='RE548693'), TRUE),
((SELECT id FROM machines WHERE name='John Deere 8345R'),
 (SELECT id FROM parts WHERE part_number='P606860'), TRUE),

-- Case IH Magnum 340 fits
((SELECT id FROM machines WHERE name='Case IH Magnum 340'),
 (SELECT id FROM parts WHERE part_number='8PK2610'), TRUE),
((SELECT id FROM machines WHERE name='Case IH Magnum 340'),
 (SELECT id FROM parts WHERE part_number='AL158687'), TRUE);

-- 6. Insert Parts-Suppliers (Pricing Data)
INSERT INTO parts_suppliers (part_id, supplier_id, supplier_price, shipping_cost, shipping_days, in_stock, oem) VALUES
-- RE548693 (Hydraulic Pump) from multiple suppliers
((SELECT id FROM parts WHERE part_number='RE548693'),
 (SELECT id FROM suppliers WHERE name='Prairie Equipment'),
 389.00, 25.00, 2, 14, FALSE),
((SELECT id FROM parts WHERE part_number='RE548693'),
 (SELECT id FROM suppliers WHERE name='Greenline Supply'),
 412.00, 25.00, 1, 3, FALSE),
((SELECT id FROM parts WHERE part_number='RE548693'),
 (SELECT id FROM suppliers WHERE name='Agri Parts Central'),
 425.00, 28.00, 2, 8, FALSE),
((SELECT id FROM parts WHERE part_number='RE548693'),
 (SELECT id FROM suppliers WHERE name='JD Parts Direct'),
 445.00, 30.00, 1, 12, TRUE),

-- P606860 (Air Filter) from suppliers
((SELECT id FROM parts WHERE part_number='P606860'),
 (SELECT id FROM suppliers WHERE name='Prairie Equipment'),
 45.75, 9.00, 2, 40, FALSE),
((SELECT id FROM parts WHERE part_number='P606860'),
 (SELECT id FROM suppliers WHERE name='Agri Parts Central'),
 49.00, 9.00, 2, 25, FALSE),

-- 8PK2610 (Serpentine Belt)
((SELECT id FROM parts WHERE part_number='8PK2610'),
 (SELECT id FROM suppliers WHERE name='Ag Valley Supply'),
 32.10, 10.00, 3, 18, FALSE),
((SELECT id FROM parts WHERE part_number='8PK2610'),
 (SELECT id FROM suppliers WHERE name='Greenline Supply'),
 36.00, 12.00, 3, 6, FALSE),

-- RE54782 (Fuel Filter)
((SELECT id FROM parts WHERE part_number='RE54782'),
 (SELECT id FROM suppliers WHERE name='Prairie Equipment'),
 18.50, 7.00, 1, 50, FALSE),
((SELECT id FROM parts WHERE part_number='RE54782'),
 (SELECT id FROM suppliers WHERE name='Agri Parts Central'),
 22.00, 8.00, 2, 30, FALSE),

-- RE12345 (Alternator)
((SELECT id FROM parts WHERE part_number='RE12345'),
 (SELECT id FROM suppliers WHERE name='JD Parts Direct'),
 275.00, 15.00, 1, 8, TRUE),
((SELECT id FROM parts WHERE part_number='RE12345'),
 (SELECT id FROM suppliers WHERE name='Prairie Equipment'),
 255.00, 15.00, 2, 12, FALSE);

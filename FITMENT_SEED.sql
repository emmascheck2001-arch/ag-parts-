-- Auto-generated from src/data/demo.js by scripts/generate-seed.mjs
-- Run AFTER FITMENT_INDEX_SCHEMA.sql. Idempotent (on conflict do nothing).

-- Machines
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '8320R', 'Tractor', 2014, 2018, '320 hp', '/machines/jd-8320r.jpg') on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('New Holland', 'CR8.90', 'Combine', 2014, 2019, '523 hp', '/machines/nh-cr890.jpg') on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('Case IH', 'Magnum 340', 'Tractor', 2014, 2018, '340 hp', '/machines/caseih-magnum340.jpg') on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '4020', 'Tractor', 1964, 1972, '96 hp', '/machines/jd-4020.jpg') on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '4440', 'Tractor', 1977, 1982, '130 hp', '/machines/jd-4440.jpg') on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', 'S680', 'Combine', 2012, 2017, '473 hp', '/machines/jd-s680.jpg') on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '6230', 'Tractor', 2007, 2012, '85 hp', null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '6330', 'Tractor', 2007, 2012, '105 hp', null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '6430', 'Tractor', 2007, 2012, '125 hp', null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('Case IH', 'Magnum 310', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('New Holland', 'T8.410', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '8245R', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '8270R', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '8295R', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '8335R', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '8345R', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '8370R', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '8400R', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '3020', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '4000', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '4010', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '4230', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '4040', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '4240', null, null, null, null, null) on conflict (make, model) do nothing;
insert into machines (make, model, type, year_from, year_to, hp, image_url) values ('John Deere', '4640', null, null, null, null, null) on conflict (make, model) do nothing;

-- Parts
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('1907539', '1907539', 'Fuel / Water Separator Filter', 'Filters', 'CNH (Case IH / New Holland)', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('84217229', '84217229', 'Air Filter', 'Filters', 'CNH (Case IH / New Holland)', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('84228488', '84228488', 'Engine Oil Filter', 'Filters', 'CNH (Case IH / New Holland)', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('84283691', '84283691', 'Fuel Filter', 'Filters', 'CNH (Case IH / New Holland)', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('84487937', '84487937', 'Hydraulic / Transmission Filter', 'Hydraulic', 'CNH (Case IH / New Holland)', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('87267363', '87267363', 'Cab Air Filter', 'Cab & Body', 'CNH (Case IH / New Holland)', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE509672', 'RE509672', 'Engine Oil Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE539465', 'RE539465', 'Primary Fuel Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE533910', 'RE533910', 'Final Fuel Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE587791', 'RE587791', 'Primary Air Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE587792', 'RE587792', 'Secondary Air Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE587793', 'RE587793', 'Primary Air Filter (early)', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE587794', 'RE587794', 'Secondary Air Filter (early)', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE573817', 'RE573817', 'Hydraulic / Transmission Oil Filter', 'Hydraulic', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE269061', 'RE269061', 'SCV Oil Filter', 'Hydraulic', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE284091', 'RE284091', 'Cab Fresh Air Filter', 'Cab & Body', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE291412', 'RE291412', 'Cab Recirculation Air Filter', 'Cab & Body', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('N378886', 'N378886', 'Fuel / Water Separator Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AL204884', 'AL204884', 'Air Brake Air Dryer Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AR26350', 'AR26350', 'Engine Oil Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AR44077', 'AR44077', 'Fuel Filter (Diesel)', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AH69798', 'AH69798', 'Air Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AR75603', 'AR75603', 'Hydraulic Filter Element', 'Hydraulic', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('5801659560', '5801659560', 'Air Filter (Outer)', 'Filters', 'CNH (Case IH / New Holland)', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AR43261', 'AR43261', 'Engine Oil Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AR79679', 'AR79679', 'Primary Air Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AR79680', 'AR79680', 'Secondary Air Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AR50041', 'AR50041', 'Fuel / Water Separator Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AR94510', 'AR94510', 'Transmission / Hydraulic Oil Filter', 'Hydraulic', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE572785', 'RE572785', 'Engine Oil Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('HXE11090', 'HXE11090', 'Primary Air Filter', 'Filters', null, true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('HXE11091', 'HXE11091', 'Secondary Air Filter', 'Filters', null, true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE532952', 'RE532952', 'Primary Fuel Filter (Tier 2)', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE525523', 'RE525523', 'Final Fuel Filter (Tier 2)', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('R502778', 'R502778', 'Fuel / Water Separator Pre-Filter', 'Filters', null, true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AXE12964', 'AXE12964', 'Hydraulic Reservoir Filter', 'Hydraulic', null, true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AN207368', 'AN207368', 'Hydrostatic Charge Filter', 'Hydraulic', null, true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AH128449', 'AH128449', 'ProDrive / Hydraulic Case Filter', 'Hydraulic', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE504836', 'RE504836', 'Engine Oil Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AL172780', 'AL172780', 'Primary Air Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AL150288', 'AL150288', 'Secondary Air Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE546336', 'RE546336', 'Primary Fuel Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('RE526557', 'RE526557', 'Final Fuel Filter', 'Filters', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AL169573', 'AL169573', 'Hydraulic Oil Filter', 'Hydraulic', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AL221066', 'AL221066', 'Transmission Oil Filter', 'Hydraulic', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AL225552', 'AL225552', 'Cab Air Filter (Standard)', 'Cab & Body', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('AL158986', 'AL158986', 'Cab Activated Carbon Filter Kit', 'Cab & Body', 'John Deere', true) on conflict (pn_norm) do nothing;
insert into parts (part_number, pn_norm, name, category, brand, is_oem) values ('L114404', 'L114404', 'Front PTO Oil Filter', 'Hydraulic', null, true) on conflict (pn_norm) do nothing;

-- Fitments
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='Case IH' and m.model='Magnum 340' and p.pn_norm='1907539'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='New Holland' and m.model='CR8.90' and p.pn_norm='84217229'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='New Holland' and m.model='CR8.90' and p.pn_norm='84228488'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine fuel filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='Case IH' and m.model='Magnum 340' and p.pn_norm='84283691'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine fuel filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='Case IH' and m.model='Magnum 310' and p.pn_norm='84283691'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine fuel filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='New Holland' and m.model='T8.410' and p.pn_norm='84283691'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='Case IH' and m.model='Magnum 340' and p.pn_norm='84487937'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='Case IH' and m.model='Magnum 340' and p.pn_norm='87267363'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='Case IH' and m.model='Magnum 310' and p.pn_norm='87267363'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — change at 100 h, then every 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE509672'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — change at 100 h, then every 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE509672'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — change at 100 h, then every 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE509672'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — change at 100 h, then every 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE509672'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — change at 100 h, then every 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE509672'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — change at 100 h, then every 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE509672'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — change at 100 h, then every 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE509672'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — change at 100 h, then every 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE509672'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — replace with final filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE539465'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — replace with final filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE539465'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — replace with final filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE539465'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — replace with final filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE539465'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — replace with final filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE539465'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — replace with final filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE539465'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — replace with final filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE539465'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — replace with final filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE539465'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — replace with primary filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE533910'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — replace with primary filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE533910'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — replace with primary filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE533910'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — replace with primary filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE533910'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — replace with primary filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE533910'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — replace with primary filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE533910'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — replace with primary filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE533910'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — replace with primary filter, 500 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE533910'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 110760– ) — 1000 h / annually', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE587791'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 110760– ) — 1000 h / annually', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE587791'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 110760– ) — 1000 h / annually', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE587791'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 110760– ) — 1000 h / annually', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE587791'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 110760– ) — 1000 h / annually', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE587791'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 110760– ) — 1000 h / annually', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE587791'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 110760– ) — 1000 h / annually', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE587791'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 110760– ) — 1000 h / annually', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE587791'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 110760– ) — every 2nd primary change', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE587792'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 110760– ) — every 2nd primary change', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE587792'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 110760– ) — every 2nd primary change', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE587792'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 110760– ) — every 2nd primary change', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE587792'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 110760– ) — every 2nd primary change', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE587792'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 110760– ) — every 2nd primary change', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE587792'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 110760– ) — every 2nd primary change', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE587792'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 110760– ) — every 2nd primary change', 1, 110760, null, 'TSN 110760 and up', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE587792'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 090001–110759) — 1000 h / annually', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE587793'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 090001–110759) — 1000 h / annually', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE587793'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 090001–110759) — 1000 h / annually', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE587793'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 090001–110759) — 1000 h / annually', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE587793'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 090001–110759) — 1000 h / annually', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE587793'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 090001–110759) — 1000 h / annually', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE587793'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 090001–110759) — 1000 h / annually', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE587793'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter (TSN 090001–110759) — 1000 h / annually', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE587793'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 090001–110759) — every 2nd primary change', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE587794'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 090001–110759) — every 2nd primary change', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE587794'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 090001–110759) — every 2nd primary change', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE587794'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 090001–110759) — every 2nd primary change', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE587794'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 090001–110759) — every 2nd primary change', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE587794'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 090001–110759) — every 2nd primary change', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE587794'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 090001–110759) — every 2nd primary change', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE587794'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter (TSN 090001–110759) — every 2nd primary change', 1, null, 110759, 'TSN up to 110759', true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE587794'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission (Hy-Gard) oil filter — every 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE573817'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission (Hy-Gard) oil filter — every 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE573817'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission (Hy-Gard) oil filter — every 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE573817'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission (Hy-Gard) oil filter — every 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE573817'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission (Hy-Gard) oil filter — every 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE573817'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission (Hy-Gard) oil filter — every 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE573817'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission (Hy-Gard) oil filter — every 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE573817'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission (Hy-Gard) oil filter — every 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE573817'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Selective Control Valve (SCV) oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE269061'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Selective Control Valve (SCV) oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE269061'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Selective Control Valve (SCV) oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE269061'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Selective Control Valve (SCV) oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE269061'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Selective Control Valve (SCV) oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE269061'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Selective Control Valve (SCV) oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE269061'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Selective Control Valve (SCV) oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE269061'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Selective Control Valve (SCV) oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE269061'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE284091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE284091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE284091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE284091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE284091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE284091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE284091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE284091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — clean/replace 50 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='RE284091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab recirculation air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='RE291412'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab recirculation air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='RE291412'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab recirculation air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='RE291412'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab recirculation air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='RE291412'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab recirculation air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='RE291412'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab recirculation air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='RE291412'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab recirculation air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='RE291412'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab recirculation air filter — 1000 h / annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='RE291412'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator filter (if equipped)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='N378886'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator filter (if equipped)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='N378886'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator filter (if equipped)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='N378886'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator filter (if equipped)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='N378886'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator filter (if equipped)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='N378886'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator filter (if equipped)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='N378886'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator filter (if equipped)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='N378886'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator filter (if equipped)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='N378886'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Trailer air brake air dryer filter (if equipped) — annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8245R' and p.pn_norm='AL204884'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Trailer air brake air dryer filter (if equipped) — annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8270R' and p.pn_norm='AL204884'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Trailer air brake air dryer filter (if equipped) — annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8295R' and p.pn_norm='AL204884'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Trailer air brake air dryer filter (if equipped) — annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8320R' and p.pn_norm='AL204884'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Trailer air brake air dryer filter (if equipped) — annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8335R' and p.pn_norm='AL204884'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Trailer air brake air dryer filter (if equipped) — annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8345R' and p.pn_norm='AL204884'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Trailer air brake air dryer filter (if equipped) — annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8370R' and p.pn_norm='AL204884'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Trailer air brake air dryer filter (if equipped) — annually', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='8400R' and p.pn_norm='AL204884'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter (gas & diesel)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4020' and p.pn_norm='AR26350'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='3020' and p.pn_norm='AR26350'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4000' and p.pn_norm='AR26350'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4010' and p.pn_norm='AR26350'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4230' and p.pn_norm='AR26350'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Diesel fuel filter element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4020' and p.pn_norm='AR44077'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Diesel fuel filter element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='3020' and p.pn_norm='AR44077'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Diesel fuel filter element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4000' and p.pn_norm='AR44077'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Diesel fuel filter element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4010' and p.pn_norm='AR44077'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine air filter element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4020' and p.pn_norm='AH69798'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine air filter element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='3020' and p.pn_norm='AH69798'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine air filter element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4000' and p.pn_norm='AH69798'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission filter element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4020' and p.pn_norm='AR75603'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic/transmission filter element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='3020' and p.pn_norm='AR75603'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='Case IH' and m.model='Magnum 340' and p.pn_norm='5801659560'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='Case IH' and m.model='Magnum 310' and p.pn_norm='5801659560'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter (spin-on)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4440' and p.pn_norm='AR43261'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter (spin-on)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4040' and p.pn_norm='AR43261'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter (spin-on)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4240' and p.pn_norm='AR43261'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter (spin-on)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4640' and p.pn_norm='AR43261'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4440' and p.pn_norm='AR79679'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4240' and p.pn_norm='AR79679'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4640' and p.pn_norm='AR79679'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4440' and p.pn_norm='AR79680'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4240' and p.pn_norm='AR79680'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4440' and p.pn_norm='AR50041'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator element', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4240' and p.pn_norm='AR50041'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Transmission/hydraulic oil filter (2WD, 25 micron)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4440' and p.pn_norm='AR94510'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Transmission/hydraulic oil filter (2WD, 25 micron)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='4240' and p.pn_norm='AR94510'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter (Plus-50 II)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='RE572785'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter — clean/replace 400 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='HXE11090'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter — change with primary', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='HXE11091'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — every 400 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='RE532952'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — every 400 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='RE525523'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Fuel/water separator pre-filter (standard)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='R502778'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic filter in reservoir (closed center) — 400 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='AXE12964'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydrostatic charge filter — every 400 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='AN207368'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'ProDrive filter — first 100 h, then 400 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='S680' and p.pn_norm='AH128449'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — first 100 h, then 500 h / annually (Plus-50 II)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='RE504836'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — first 100 h, then 500 h / annually (Plus-50 II)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='RE504836'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Engine oil filter — first 100 h, then 500 h / annually (Plus-50 II)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='RE504836'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter — clean up to 5×, replace 1500 h / 2 yr', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='AL172780'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter — clean up to 5×, replace 1500 h / 2 yr', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='AL172780'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary engine air filter — clean up to 5×, replace 1500 h / 2 yr', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='AL172780'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter — every 5th primary change or 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='AL150288'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter — every 5th primary change or 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='AL150288'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Secondary engine air filter — every 5th primary change or 1500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='AL150288'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — every 500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='RE546336'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — every 500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='RE546336'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Primary fuel filter — every 500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='RE546336'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — every 500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='RE526557'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — every 500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='RE526557'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Final fuel filter — every 500 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='RE526557'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic oil filter — first 100 h, then every 750 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='AL169573'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic oil filter — first 100 h, then every 750 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='AL169573'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Hydraulic oil filter — first 100 h, then every 750 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='AL169573'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Transmission oil filter — first 100 h, then every 750 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='AL221066'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Transmission oil filter — first 100 h, then every 750 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='AL221066'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Transmission oil filter — first 100 h, then every 750 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='AL221066'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — clean as req., replace 1500 h / 2 yr', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='AL225552'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — clean as req., replace 1500 h / 2 yr', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='AL225552'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab fresh air filter — clean as req., replace 1500 h / 2 yr', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='AL225552'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab activated-carbon filter — replace 500 h / 1 yr (never clean)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='AL158986'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab activated-carbon filter — replace 500 h / 1 yr (never clean)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='AL158986'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Cab activated-carbon filter — replace 500 h / 1 yr (never clean)', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='AL158986'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Front PTO oil filter — every 750 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6230' and p.pn_norm='L114404'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Front PTO oil filter — every 750 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6330' and p.pn_norm='L114404'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;
insert into fitments (machine_id, part_id, position, qty, serial_from, serial_to, serial_note, verified, source, confidence)
select m.id, p.id, 'Front PTO oil filter — every 750 h', 1, null, null, null, true, 'seed/demo', 1
from machines m, parts p where m.make='John Deere' and m.model='6430' and p.pn_norm='L114404'
on conflict (machine_id, part_id, serial_from, serial_to) do nothing;

-- Cross-references
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Donaldson', 'P550938', 'seed/demo', 1 from parts p where p.pn_norm='RE509672'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Baldwin', 'P7233', 'seed/demo', 1 from parts p where p.pn_norm='RE509672'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Fleetguard', 'LF16043', 'seed/demo', 1 from parts p where p.pn_norm='RE509672'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'WIX', '51370', 'seed/demo', 1 from parts p where p.pn_norm='RE509672'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'NAPA', '1370', 'seed/demo', 1 from parts p where p.pn_norm='RE509672'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Baldwin', 'BF9866-O', 'seed/demo', 1 from parts p where p.pn_norm='RE539465'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Fleetguard', 'FS1091', 'seed/demo', 1 from parts p where p.pn_norm='RE539465'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'WIX', '33969', 'seed/demo', 1 from parts p where p.pn_norm='RE539465'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Mann', 'WK11030X', 'seed/demo', 1 from parts p where p.pn_norm='RE539465'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Baldwin', 'BF9917', 'seed/demo', 1 from parts p where p.pn_norm='RE533910'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Donaldson', 'P635443', 'seed/demo', 1 from parts p where p.pn_norm='RE587791'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Hifi', 'SA16987', 'seed/demo', 1 from parts p where p.pn_norm='RE587791'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'John Deere (alt)', 'RE580337', 'seed/demo', 1 from parts p where p.pn_norm='RE587791'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'WIX', '49203', 'seed/demo', 1 from parts p where p.pn_norm='RE587793'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Mann', 'C31021', 'seed/demo', 1 from parts p where p.pn_norm='RE587793'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Luber-finer', 'LAF5354', 'seed/demo', 1 from parts p where p.pn_norm='RE587793'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Hengst', 'E1720L', 'seed/demo', 1 from parts p where p.pn_norm='RE587793'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Donaldson', 'P580316', 'seed/demo', 1 from parts p where p.pn_norm='RE573817'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Baldwin', 'HY80072', 'seed/demo', 1 from parts p where p.pn_norm='RE573817'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'WIX', '33143', 'seed/demo', 1 from parts p where p.pn_norm='AR44077'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Fleetguard', 'FF130', 'seed/demo', 1 from parts p where p.pn_norm='AR44077'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Baldwin', 'PF814', 'seed/demo', 1 from parts p where p.pn_norm='AR44077'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Donaldson', 'P551748', 'seed/demo', 1 from parts p where p.pn_norm='AR44077'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Fram', 'C1168PL', 'seed/demo', 1 from parts p where p.pn_norm='AR44077'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Baldwin', 'BT287', 'seed/demo', 1 from parts p where p.pn_norm='AR43261'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'WIX', '51758', 'seed/demo', 1 from parts p where p.pn_norm='AR43261'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Fram', 'PH47', 'seed/demo', 1 from parts p where p.pn_norm='AR43261'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Case', 'A57857', 'seed/demo', 1 from parts p where p.pn_norm='AR43261'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Baldwin', 'B7322', 'seed/demo', 1 from parts p where p.pn_norm='RE504836'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Donaldson', 'P550779', 'seed/demo', 1 from parts p where p.pn_norm='RE504836'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Fleetguard', 'LF16243', 'seed/demo', 1 from parts p where p.pn_norm='RE504836'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'WIX', '57750', 'seed/demo', 1 from parts p where p.pn_norm='RE504836'
on conflict (part_id, brand, equiv_number) do nothing;
insert into crossrefs (part_id, brand, equiv_number, source, confidence)
select p.id, 'Fram', 'PH10220', 'seed/demo', 1 from parts p where p.pn_norm='RE504836'
on conflict (part_id, brand, equiv_number) do nothing;

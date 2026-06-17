// ─────────────────────────────────────────────────────────────────────────────
// CROSS-REFERENCE / INTERCHANGE GROUPS
//
// Each entry lists part numbers that are INTERCHANGEABLE for the same
// application — i.e. they physically fit and perform the same job, just from
// different brands (OEM + aftermarket). This is what lets a farmer buy a
// compatible part WITHOUT being locked to one brand.
//
// Keyed by catalog part id (see src/data/demo.js). The brand/number values are
// real-world catalog numbers; a licensed feed (TecDoc / OEM cross-reference)
// would replace this map with verified, exhaustive interchange data.
// ─────────────────────────────────────────────────────────────────────────────
export const INTERCHANGE = {
  // Fuel Filter (Primary) — JD RE522878
  4: [
    { brand: 'John Deere', part_number: 'RE522878', is_oem: true },
    { brand: 'Donaldson',  part_number: 'P551313',  is_oem: false },
    { brand: 'Baldwin',    part_number: 'BF7949',    is_oem: false },
    { brand: 'Fleetguard', part_number: 'FF5320',    is_oem: false },
    { brand: 'WIX',        part_number: '33656',     is_oem: false },
  ],
  // Engine Oil Filter — JD RE509672
  5: [
    { brand: 'John Deere', part_number: 'RE509672', is_oem: true },
    { brand: 'Donaldson',  part_number: 'DBL7349',  is_oem: false },
    { brand: 'Baldwin',    part_number: 'B7577',     is_oem: false },
    { brand: 'Fleetguard', part_number: 'LF16352',   is_oem: false },
    { brand: 'WIX',        part_number: '51348',     is_oem: false },
  ],
  // Air Filter (Primary) — Donaldson P777868
  6: [
    { brand: 'Donaldson',  part_number: 'P777868',   is_oem: false },
    { brand: 'John Deere', part_number: 'AT332908',  is_oem: true },
    { brand: 'Baldwin',    part_number: 'RS3920',     is_oem: false },
    { brand: 'Fleetguard', part_number: 'AF26204',    is_oem: false },
    { brand: 'WIX',        part_number: '49422',       is_oem: false },
  ],
  // Air Filter (Safety/Inner) — Donaldson P778994
  7: [
    { brand: 'Donaldson',  part_number: 'P778994',   is_oem: false },
    { brand: 'Baldwin',    part_number: 'RS3921',     is_oem: false },
    { brand: 'Fleetguard', part_number: 'AF26205',    is_oem: false },
    { brand: 'WIX',        part_number: '49423',       is_oem: false },
  ],
  // Hydraulic Oil Filter — JD AL221066
  2: [
    { brand: 'John Deere', part_number: 'AL221066', is_oem: true },
    { brand: 'Donaldson',  part_number: 'P569206',  is_oem: false },
    { brand: 'Baldwin',    part_number: 'BT8852',    is_oem: false },
    { brand: 'Fleetguard', part_number: 'HF6553',    is_oem: false },
  ],
  // Air Filter — Fleetguard AF25247 (New Holland CR)
  8: [
    { brand: 'Fleetguard', part_number: 'AF25247',  is_oem: false },
    { brand: 'New Holland', part_number: '84477159', is_oem: true },
    { brand: 'Donaldson',  part_number: 'P822686',  is_oem: false },
    { brand: 'Baldwin',    part_number: 'RS3544',    is_oem: false },
  ],
  // Hydraulic Filter — Kubota HH164-32430
  9: [
    { brand: 'Kubota',     part_number: 'HH164-32430', is_oem: true },
    { brand: 'Donaldson',  part_number: 'P502269',     is_oem: false },
    { brand: 'Baldwin',    part_number: 'BT8439',       is_oem: false },
    { brand: 'Fleetguard', part_number: 'HF35339',      is_oem: false },
  ],
  // Serpentine Belt — 8PK2610
  13: [
    { brand: 'John Deere', part_number: 'R504176', is_oem: true },
    { brand: 'Gates',      part_number: 'K080820', is_oem: false },
    { brand: 'Dayco',      part_number: '5080820', is_oem: false },
    { brand: 'Continental', part_number: '4080820', is_oem: false },
  ],
  // Cab Air Filter — JD RE284091
  24: [
    { brand: 'John Deere', part_number: 'RE284091', is_oem: true },
    { brand: 'Donaldson',  part_number: 'P609244',  is_oem: false },
    { brand: 'Baldwin',    part_number: 'PA4854',    is_oem: false },
    { brand: 'Fleetguard', part_number: 'AF55308',   is_oem: false },
  ],
  // Wheel Bearing — JD9296
  17: [
    { brand: 'John Deere', part_number: 'JD9296',  is_oem: true },
    { brand: 'Timken',     part_number: 'SET413',  is_oem: false },
    { brand: 'SKF',        part_number: 'BR413',   is_oem: false },
  ],
  // Water Pump — JD RE65176
  19: [
    { brand: 'John Deere', part_number: 'RE65176', is_oem: true },
    { brand: 'US Motor Works', part_number: 'US4087', is_oem: false },
    { brand: 'GMB',        part_number: '125-1010', is_oem: false },
  ],
  // Thermostat — 84141214
  23: [
    { brand: 'Case IH',    part_number: '84141214', is_oem: true },
    { brand: 'Gates',      part_number: '33958',    is_oem: false },
    { brand: 'Stant',      part_number: '14289',    is_oem: false },
  ],
}

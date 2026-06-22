// Shared inline line-icon set (stroke = currentColor) used by Home + Categories.
// Clean, recognizable parts-catalog iconography — readable at small sizes.
const make = (children, sw = 2) => (p) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
);

// General UI icons
export const UIIcon = {
  bell: make(<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
  search: make(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  camera: make(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>),
  tractor: make(<><circle cx="7" cy="17" r="3" /><circle cx="18" cy="17.5" r="2.5" /><path d="M4 17V9h6l2 5" /><path d="M10 9V6h4l2 6" /><path d="M10 17.5h5.5" /></>),
  keypad: make(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h.01M12 9h.01M17 9h.01M7 13h.01M17 13h.01M10 13h4" /></>),
  clock: make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  chevron: make(<path d="m9 6 6 6-6 6" />),
  grid: make(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  doc: make(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>),
  external: make(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></>),
};

// Category icons keyed by category title.
export const CatIcon = {
  // Engine — gear/cog: the universal "engine & mechanical" symbol
  Engine: make(<><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>),
  // Hydraulic — fluid droplet
  Hydraulic: make(<path d="M12 3c0 0 6 6.3 6 10.5a6 6 0 0 1-12 0C6 9.3 12 3 12 3Z" />),
  // Electrical — lightning bolt (filled for punch, like the mockup)
  Electrical: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" {...p}>
      <path d="M13 2 4 13.5h6L9.5 22 20 10h-6.5L15 2z" />
    </svg>
  ),
  // Filters — funnel
  Filters: make(<path d="M3 4h18l-7 8.2V20l-4-2v-5.8L3 4Z" />),
  // Belts — two pulleys joined by a belt
  Belts: make(<><circle cx="8" cy="14" r="3.2" /><circle cx="16.5" cy="9.5" r="2.6" /><path d="M9.6 11.4 14.8 7M10.8 16.3 18 12" /></>),
  // Bearings — ball bearing: ring, hub and balls
  Bearings: make(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /><circle cx="12" cy="5.2" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="18.8" r="1.1" fill="currentColor" stroke="none" /><circle cx="5.2" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="18.8" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="7.2" cy="7.2" r="1.1" fill="currentColor" stroke="none" /><circle cx="16.8" cy="16.8" r="1.1" fill="currentColor" stroke="none" /><circle cx="7.2" cy="16.8" r="1.1" fill="currentColor" stroke="none" /><circle cx="16.8" cy="7.2" r="1.1" fill="currentColor" stroke="none" /></>),
  // Drivetrain — gear + driveshaft
  Drivetrain: make(<><circle cx="8" cy="12" r="3.4" /><path d="M8 6.6v-1M8 18.4v-1M2.6 12h1M12.4 12h1M4.4 8.4l.7.7M11.6 15.6l-.7-.7M11.6 8.4l-.7.7M4.4 15.6l.7-.7" /><path d="M12.5 12H21M21 9.5v5" /></>),
  // Cooling — snowflake
  Cooling: make(<><path d="M12 2v20M4.5 6l15 12M19.5 6l-15 12" /><path d="M12 6 9.5 8M12 6l2.5 2M12 18l-2.5-2M12 18l2.5-2M6 9 6.3 12 4 13M18 9l-.3 3 2.3 1M6 15l.3-3M18 15l-.3-3" /></>),
  // Cab & Body — tractor cab silhouette
  "Cab & Body": make(<><path d="M5 20v-7l2.5-6h7L17 13v7" /><path d="M5 13h12M11 7v6M5 20h12" /></>),
  // Blades — angled mower blade with a center mounting hole
  Blades: make(<><path d="M4 17 17 5a2.2 2.2 0 0 1 3 3L7 20a2.2 2.2 0 0 1-3-3Z" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>),
  // Fluids — oil bottle / jug
  Fluids: make(<><path d="M10 3h4v2.5l1.4 1.2A3 3 0 0 1 16.4 9v8a3 3 0 0 1-3 3h-2.8a3 3 0 0 1-3-3V9a3 3 0 0 1 1-2.3L10 5.5Z" /><path d="M7.6 12h8.8" /></>),
  // Other — grid of tiles
  Other: make(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
};

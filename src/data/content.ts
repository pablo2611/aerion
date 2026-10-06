/* ------------------------------------------------------------------ */
/*  AERION — brand, copy, specs and product data (single source)      */
/*  In production this module would hydrate from the FastAPI backend  */
/*  (GET /api/aerion/manifest). Everything here is static, versioned  */
/*  and typed so the swap is trivial.                                 */
/* ------------------------------------------------------------------ */

export const BRAND = {
  name: "AERION",
  model: "AERION ONE",
  tagline: "THE AIR, ENGINEERED.",
  premiere: "WORLD PREMIERE — GENOA 2027",
  intro:
    "A zero-emission grand tourer of 1,340 hp, 0.197 drag and 705 km of autonomy. No noise. No compromise. Only air, moving.",
  priceBase: 148900,
};

export const NAV_LINKS = [
  { id: "design", label: "Design" },
  { id: "performance", label: "Performance" },
  { id: "intelligence", label: "Technology" },
  { id: "interior", label: "Interior" },
  { id: "configurator", label: "Configure" },
];

/* Chapter order — must match DOM sections (data-chapter)              */
export const CHAPTER_IDS = [
  "design",
  "aero",
  "performance",
  "battery",
  "interior",
  "intelligence",
  "night",
  "configurator",
  "finale",
] as const;

export type ChapterId = (typeof CHAPTER_IDS)[number];

export interface ChapterMeta {
  id: ChapterId;
  index: string;
  label: string;
  theme: "dark" | "light";
  height: string; // css height of the scroll section
}

export const CHAPTERS: ChapterMeta[] = [
  { id: "design", index: "01", label: "DESIGN", theme: "light", height: "190vh" },
  { id: "aero", index: "02", label: "AERODYNAMICS", theme: "dark", height: "170vh" },
  { id: "performance", index: "03", label: "PERFORMANCE", theme: "dark", height: "175vh" },
  { id: "battery", index: "04", label: "IONVAULT 120", theme: "dark", height: "165vh" },
  { id: "interior", index: "05", label: "THE QUIET ROOM", theme: "dark", height: "185vh" },
  { id: "intelligence", index: "06", label: "HALOMIND", theme: "dark", height: "170vh" },
  { id: "night", index: "07", label: "LUMENSIG", theme: "dark", height: "170vh" },
  { id: "configurator", index: "08", label: "CONFIGURE", theme: "light", height: "200vh" },
  { id: "finale", index: "09", label: "AERION ONE", theme: "dark", height: "165vh" },
];

export const SPEC = {
  power: 1340,
  torque: 1200,
  zero100: 2.1,
  topSpeed: 350,
  range: 705,
  batteryKwh: 120,
  voltage: 800,
  chargeMin: 18, // 10→80 %
  cd: 0.197,
  lengthMm: 4710,
  weightKg: 2090,
  downforceKg: 940,
};

/* ---------------------------- copy -------------------------------- */

export const COPY = {
  design: {
    kicker: "FORM IS THE FIRST TECHNOLOGY",
    title: ["SCULPTED", "FROM", "SILENCE."],
    body: "A monolithic CarbonWeave body, one continuous surface from nose to tail. Every millimetre is negotiated with the wind — the result is a proportion that reads fast even at a standstill.",
    facts: [
      { k: "LENGTH", v: "4,710 MM" },
      { k: "DRY MASS", v: "2,090 KG" },
      { k: "DRAG", v: "0.197 Cd" },
      { k: "BODY", v: "CARBONWEAVE" },
    ],
    hotspots: [
      {
        title: "AeroWeave nose",
        body: "The splitter and canards move 4 mm with speed, holding the front axle planted while the Cd drops below 0.20.",
      },
      {
        title: "CarbonWeave shell",
        body: "One-piece carbon monocoque with an internal titanium lattice. Torsional rigidity of 41,000 Nm/°.",
      },
      {
        title: "Photon Tail",
        body: "A full-width 1.9 m light bar. It signs the car in any condition — brake, turn, and charge states included.",
      },
    ],
  },
  aero: {
    kicker: "AIR, MANAGED",
    title: ["NOTHING", "TO FIGHT."],
    body: "AeroWeave is an active aero system: twelve moving surfaces read 64 pressure points 200 times a second. The car is never static — it is constantly negotiating with the air around it.",
    live: [
      { k: "DRAG COEFFICIENT", v: "0.197" },
      { k: "REAR WING", v: "0° → 27°" },
      { k: "ACTIVE SURFACES", v: "12" },
      { k: "DOWNSFORCE @ 250", v: "940 KG" },
    ],
  },
  performance: {
    kicker: "TRIAX VORTECH DRIVE",
    title: ["THREE", "MOTORS.", "ONE", "INTENT."],
    body: "Two rear Vortex-axial motors and one front, vectored by PulseVector in 4 ms. Torque is not applied — it is redirected, corner by corner, 1,000 times a second.",
    readouts: [
      { k: "POWER", v: SPEC.power, unit: "HP" },
      { k: "TORQUE", v: SPEC.torque, unit: "NM" },
      { k: "0–100 KM/H", v: SPEC.zero100, unit: "S", dec: 1 },
      { k: "V-MAX", v: SPEC.topSpeed, unit: "KM/H" },
    ],
  },
  battery: {
    kicker: "IONVAULT 120",
    title: ["ENERGY,", "ARCHITECTED."],
    body: "A 120 kWh structural pack, flat under the cabin, cooled by the CryoLoop — a closed dielectric circuit that holds every cell between 24 and 34 °C from −15 to 45 °C ambient.",
    rows: [
      { k: "CAPACITY", v: "120 KWH" },
      { k: "RANGE (WLTP)", v: "705 KM" },
      { k: "ARCHITECTURE", v: "800 V" },
      { k: "10 → 80 %", v: "18 MIN" },
      { k: "THERMAL", v: "CRYOLOOP" },
    ],
  },
  interior: {
    kicker: "THE QUIET ROOM",
    title: ["YOU DON'T ENTER.", "YOU ARE RECEIVED."],
    body: "A HoloDeck display floats 53 inches across the dash. AuraWeave traces 256 zones of light. SoundVault cancels the road before you hear it.",
    details: [
      { k: "HOLODECK", v: "53\" PANORAMIC DISPLAY" },
      { k: "AURAWEAVE", v: "256-ZONE AMBIENT LIGHT" },
      { k: "SOUNDVAULT", v: "24-SPK ACOUSTIC CANCELLING" },
      { k: "CABIN NOISE @ 140", v: "61 DB" },
    ],
  },
  intelligence: {
    kicker: "HALOMIND",
    title: ["THE CAR SEES", "AROUND CORNERS."],
    body: "Twelve cameras, five radars and three LiDAR form a continuous 360° model of the world, refreshed at 30 Hz. Neural Path predicts the traffic you haven't seen yet.",
    sensors: [
      { k: "CAMERAS", v: "12" },
      { k: "RADARS", v: "5" },
      { k: "LIDAR", v: "3 × 250 M" },
      { k: "FUSION", v: "30 HZ" },
    ],
    status: "ENVIRONMENT MAPPED — 360° / NEURAL PATH ACTIVE",
  },
  night: {
    kicker: "LUMENSIG LIGHT SYSTEM",
    title: ["A LANGUAGE", "IN LIGHT."],
    body: "The LumenSig headlight throws 320 m of adaptive beam and maps traffic in real time. The Photon Tail signs everything — and you choose its voice.",
    note: "SIGNATURE & AMBIENT ARE LIVE — THE CAR IS LISTENING TO YOUR INPUTS.",
  },
  configurator: {
    kicker: "MAKE IT YOURS",
    title: ["YOUR ONE.", "NO OTHERS."],
    body: "Every choice is rendered live on the vehicle. This is not a preview — this is the car.",
    delivery: "ESTIMATED DELIVERY — 2027",
    reserve: "RESERVE THE EXPERIENCE",
  },
  finale: {
    title: ["AERION", "ONE"],
    tag: BRAND.tagline,
    body: "The air, engineered. Reserve your experience — a private session, the car, and an hour with no ceiling.",
    cta: "RESERVE THE EXPERIENCE",
    ctaDone: "REQUEST RECEIVED — AERION WILL CONTACT YOU",
    back: "BACK TO THE TOP",
  },
};

/* ----------------------- configurator ----------------------------- */

export interface PaintOption {
  id: string;
  name: string;
  hex: string;
  metal: number;
  rough: number;
  clear: number;
  price: number;
}
export const PAINTS: PaintOption[] = [
  { id: "obsidian", name: "Obsidian Black", hex: "#080b10", metal: 0.72, rough: 0.13, clear: 1.0, price: 0 },
  { id: "silver", name: "Liquid Silver", hex: "#b9c3cc", metal: 0.96, rough: 0.17, clear: 0.92, price: 900 },
  { id: "ion", name: "AERION Blue", hex: "#155cc8", metal: 0.76, rough: 0.14, clear: 1.0, price: 1200 },
  { id: "pearl", name: "Pearl White", hex: "#edece4", metal: 0.38, rough: 0.2, clear: 1.0, price: 1100 },
  { id: "titanium", name: "Titanium Graphite", hex: "#434b54", metal: 0.9, rough: 0.25, clear: 0.78, price: 1200 },
  { id: "crimson", name: "Crimson Pulse", hex: "#a40e22", metal: 0.7, rough: 0.15, clear: 1.0, price: 1400 },
  { id: "emerald", name: "Emerald Mist", hex: "#176552", metal: 0.72, rough: 0.19, clear: 0.95, price: 1500 },
  { id: "bronze", name: "Solar Bronze", hex: "#9a5129", metal: 0.88, rough: 0.2, clear: 0.86, price: 1500 },
];

export interface FinishOption {
  id: string;
  name: string;
  metal: number;
  rough: number;
  clear: number;
  price: number;
}
export const FINISHES: FinishOption[] = [
  { id: "mirror", name: "Mirror Clearcoat", metal: 1.0, rough: 0.18, clear: 1.0, price: 0 },
  { id: "satin", name: "Satin Carbon", metal: 0.7, rough: 0.5, clear: 0.25, price: 1900 },
  { id: "forge", name: "Forged Titanium", metal: 1.0, rough: 0.38, clear: 0.05, price: 3200 },
];

export interface WheelOption {
  id: string;
  name: string;
  price: number;
}
export const WHEELS: WheelOption[] = [
  { id: "aeroblade", name: "AeroBlade", price: 0 },
  { id: "turbine", name: "Turbine", price: 1100 },
  { id: "monolith", name: "Monolith", price: 1450 },
  { id: "vector", name: "Vector RS", price: 1900 },
];

export const WHEEL_FINISHES = [
  { id: "black", name: "Gloss Black", hex: "#11161c", rough: 0.12 },
  { id: "silver", name: "Machined Silver", hex: "#c1cbd4", rough: 0.18 },
  { id: "graphite", name: "Graphite", hex: "#505b66", rough: 0.26 },
  { id: "titanium", name: "Titanium", hex: "#8d9298", rough: 0.22 },
] as const;

export interface SignatureOption {
  id: string;
  name: string;
  hex: string;
}
export const SIGNATURES: SignatureOption[] = [
  { id: "ion", name: "Ion Cyan", hex: "#5fe8ff" },
  { id: "daylight", name: "Daylight", hex: "#eef7ff" },
  { id: "solar", name: "Solar", hex: "#ff5a2a" },
];

export interface InteriorOption {
  id: string;
  name: string;
  hex: string;
  trim: string;
  price: number;
}
export const INTERIORS: InteriorOption[] = [
  { id: "graphite", name: "Graphite Weave", hex: "#1a2028", trim: "#a8b4c2", price: 0 },
  { id: "alabaster", name: "Alabaster", hex: "#c7c7bd", trim: "#687887", price: 2500 },
  { id: "oxide", name: "Oxide", hex: "#5e211b", trim: "#c2a38a", price: 2900 },
];

export interface CaliperOption {
  id: string;
  name: string;
  hex: string;
  price: number;
}
export const CALIPERS: CaliperOption[] = [
  { id: "ion", name: "Ion Cyan", hex: "#5fe8ff", price: 0 },
  { id: "solar", name: "Solar Flare", hex: "#ff5a2a", price: 650 },
  { id: "titanium", name: "Titanium", hex: "#b5bdc7", price: 750 },
];

export interface VehicleHotspot {
  id: string;
  label: string;
  title: string;
  body: string;
  view: "front" | "front3q" | "side" | "rear3q" | "rear" | "detail" | "interior";
}
export const VEHICLE_HOTSPOTS: VehicleHotspot[] = [
  { id: "headlamp", label: "01", title: "LumenSig optic", body: "A 14-element micro-LED blade with a laser high-beam core. Its lens is flush-mounted inside the AeroWeave nose.", view: "detail" },
  { id: "wheel", label: "02", title: "Vortex wheel", body: "22-inch forged monoblock geometry wraps a carbon-ceramic brake system with active temperature telemetry.", view: "front3q" },
  { id: "aero", label: "03", title: "AeroWeave tail", body: "The rear diffuser and adaptive blade move as one calibrated surface, balancing drag and rear load in milliseconds.", view: "rear3q" },
  { id: "battery", label: "04", title: "IonVault structure", body: "The 120 kWh pack is an active structural member, dropping the centre of gravity below the wheel hubs.", view: "side" },
  { id: "sensor", label: "05", title: "Halo sensing", body: "A recessed forward LiDAR and radar aperture keep the surface clean while Halomind reads a 250-metre field.", view: "front" },
  { id: "cabin", label: "06", title: "Quiet Room", body: "Low-set woven seats, the floating HoloDeck and a yoke are visible beneath a solar-control laminated canopy.", view: "interior" },
];

export function configPrice(cfg: { paint: string; finish: string; wheel: string; interior?: string; caliper?: string }): number {
  const p = PAINTS.find((x) => x.id === cfg.paint)?.price ?? 0;
  const f = FINISHES.find((x) => x.id === cfg.finish)?.price ?? 0;
  const w = WHEELS.find((x) => x.id === cfg.wheel)?.price ?? 0;
  const i = INTERIORS.find((x) => x.id === cfg.interior)?.price ?? 0;
  const c = CALIPERS.find((x) => x.id === cfg.caliper)?.price ?? 0;
  return BRAND.priceBase + p + f + w + i + c;
}

/* ---------------------------- media ------------------------------- */

export const MEDIA = {
  nightDrive: {
    src: "https://videos.pexels.com/video-files/9299639/9299639-hd_1920_1080_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/9299639/pexels-photo-9299639.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    credit: "Rob Zohrab / Pexels",
  },
  speedStreaks: {
    src: "https://videos.pexels.com/video-files/39931590/17038370_1920_1080_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/39931590/pexels-photo-39931590.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    credit: "Nicola Narracci / Pexels",
  },
  cockpit: `${import.meta.env.BASE_URL}images/cockpit.jpg`,
  detail: `${import.meta.env.BASE_URL}images/detail-light.jpg`,
};

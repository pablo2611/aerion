import { create } from "zustand";

/* ------------------------------------------------------------------ */
/*  Global store (React state) + runtime (mutable, frame-level data)   */
/* ------------------------------------------------------------------ */

export type Quality = "HIGH" | "MEDIUM" | "LOW";

/** Mutable per-frame data shared with the 3D scene (no re-renders). */
export const runtime = {
  /** 0..1 scroll progress across the chapter track */
  progress: 0,
  /** smoothed scroll velocity (px / frame) */
  velocity: 0,
  /** pointer, -1..1 */
  pointer: { x: 0, y: 0 },
  /** active chapter index in CHAPTER_IDS (-1 = hero) */
  chapter: -1,
  /** 0..1 local progress within active chapter */
  local: 0,
  /** timestamp when the loader finished (hero cinematic clock) */
  bootAt: 0,
  /** measured chapter table: { id, top, height } */
  chapters: [] as { id: string; top: number; height: number }[],
  /** measured track bounds for global progress */
  trackStart: 0,
  trackEnd: 1,
  /** light system state, written by Night controls, read by the car */
  lightState: { head: 0, tail: 0, ambient: 0.55, sig: "#5fe8ff" },
  /** reduced motion flag mirrored for the render loop */
  reduced: false,
  quality: "HIGH" as Quality,
  driving: false,
  speed: 0,
  peakSpeed: 0,
  targetSpeed: 80,
  nitroUntil: 0,
  turn: 'off' as 'off' | 'left' | 'right',
  lane: 0,
  targetLane: 0,
  gear: 1,
  rpm: 950,
  shiftUntil: 0,
  cabin: false,
  doorAmount: 0,
  frameStats: { fps: 0, calls: 0, triangles: 0 },
  telemetry: { battery: 84, motorTemp: 32, batteryTemp: 27, distanceKm: 0, elapsedSeconds: 0 },
};

/** Road camera stays independent from the showroom and configuration camera. */
export const driveCamera = {
  yaw: 0.78, pitch: 0.22, radius: 9.5,
  targetYaw: 0.78, targetPitch: 0.22, targetRadius: 9.5,
};

export interface AeroConfig {
  paint: string;
  finish: string;
  wheel: string;
  wheelFinish: string;
  signature: string;
  interior: string;
  caliper: string;
  uiTheme: string;
}

export type AIAction = "idle" | "night" | "range" | "autonomous" | "relax";
export type AIStage = "ready" | "listening" | "processing" | "responding";

export type VehicleView = "front" | "front3q" | "side" | "rear3q" | "rear" | "detail" | "interior";

/**
 * The explorer camera is intentionally scalar and mutable. The 3D render loop
 * can interpolate it every frame without causing React component renders.
 */
export const vehicleCamera = {
  yaw: 0.52,
  pitch: 0.16,
  radius: 6.4,
  focus: { x: 0, y: 0.66, z: 0 },
  targetYaw: 0.52,
  targetPitch: 0.16,
  targetRadius: 6.4,
  targetFocus: { x: 0, y: 0.66, z: 0 },
  yawVelocity: 0,
  pitchVelocity: 0,
  lastInput: 0,
  configActive: false,
};

const VEHICLE_VIEWS: Record<VehicleView, { yaw: number; pitch: number; radius: number; focus: [number, number, number] }> = {
  front: { yaw: 0, pitch: 0.08, radius: 6.2, focus: [0.15, 0.63, 0] },
  front3q: { yaw: 0.56, pitch: 0.15, radius: 6.35, focus: [0, 0.67, 0] },
  side: { yaw: Math.PI / 2, pitch: 0.1, radius: 6.7, focus: [0, 0.67, 0] },
  rear3q: { yaw: 2.52, pitch: 0.16, radius: 6.35, focus: [0, 0.68, 0] },
  rear: { yaw: Math.PI, pitch: 0.08, radius: 6.2, focus: [-0.15, 0.64, 0] },
  detail: { yaw: 0.3, pitch: 0.1, radius: 3.15, focus: [2.1, 0.72, 0.42] },
  interior: { yaw: 0.16, pitch: 0.05, radius: 2.75, focus: [0.3, 0.91, 0] },
};

export function setVehicleView(view: VehicleView) {
  useExperience.setState({ cabinView: view === "interior" });
  const v = VEHICLE_VIEWS[view];
  vehicleCamera.targetYaw = v.yaw;
  vehicleCamera.targetPitch = v.pitch;
  vehicleCamera.targetRadius = v.radius;
  vehicleCamera.targetFocus.x = v.focus[0];
  vehicleCamera.targetFocus.y = v.focus[1];
  vehicleCamera.targetFocus.z = v.focus[2];
  vehicleCamera.yawVelocity = 0;
  vehicleCamera.pitchVelocity = 0;
  vehicleCamera.lastInput = performance.now();
}

export function setVehicleHotspot(id: string) {
  if (id === "cabin") { setVehicleView("interior"); return; }
  useExperience.setState({ cabinView: false });
  const hotspots: Record<string, { yaw: number; pitch: number; radius: number; focus: [number, number, number] }> = {
    headlamp: { yaw: 0.18, pitch: 0.08, radius: 3.1, focus: [2.3, 0.78, 0.45] },
    wheel: { yaw: 0.92, pitch: 0.03, radius: 3.0, focus: [1.46, 0.52, 0.92] },
    aero: { yaw: 2.72, pitch: 0.1, radius: 3.4, focus: [-2.2, 0.43, 0.72] },
    battery: { yaw: 0.92, pitch: 0.37, radius: 3.65, focus: [0, 0.25, 0] },
    sensor: { yaw: 0.38, pitch: 0.15, radius: 3.35, focus: [2.15, 0.94, -0.42] },
    cabin: { yaw: 0.12, pitch: 0.05, radius: 2.75, focus: [0.3, 0.98, 0] },
  };
  const v = hotspots[id];
  if (!v) return;
  vehicleCamera.targetYaw = v.yaw;
  vehicleCamera.targetPitch = v.pitch;
  vehicleCamera.targetRadius = v.radius;
  vehicleCamera.targetFocus.x = v.focus[0];
  vehicleCamera.targetFocus.y = v.focus[1];
  vehicleCamera.targetFocus.z = v.focus[2];
  vehicleCamera.yawVelocity = 0;
  vehicleCamera.pitchVelocity = 0;
  vehicleCamera.lastInput = performance.now();
}

interface ExperienceState {
  booted: boolean;
  modelReady: boolean;
  quality: Quality;
  reducedMotion: boolean;
  phase: string; // "hero" | chapter id
  audioOn: boolean;
  audioError: string;
  driving: boolean;
  drivingPaused: boolean;
  engineView: boolean;
  environmentReady: boolean;
  cruiseSpeed: number;
  engineMode: "electric" | "race";
  audioVolume: number;
  voiceOn: boolean;
  menuOpen: boolean;
  exploreOpen: boolean;
  activeHotspot: string | null;
  showroomWheels: boolean;
  doorsOpen: boolean;
  cabinView: boolean;
  headlightsOn: boolean;
  autonomous: boolean;
  graphicsError: boolean;
  setShowroomWheels: (rolling: boolean) => void;
  aiAction: AIAction;
  aiStage: AIStage;
  config: AeroConfig;
  setBooted: (b: boolean) => void;
  setModelReady: (b: boolean) => void;
  setPhase: (p: string) => void;
  toggleAudio: () => void;
  setMenu: (open: boolean) => void;
  setConfig: (patch: Partial<AeroConfig>) => void;
  setExplore: (open: boolean) => void;
  setHotspot: (id: string | null) => void;
  setAIAction: (action: AIAction) => void;
  setAIStage: (stage: AIStage) => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  booted: false,
  modelReady: false,
  quality: detectQuality(),
  reducedMotion: false,
  phase: "hero",
  audioOn: false,
  audioError: "",
  driving: false,
  drivingPaused: false,
  engineView: false,
  environmentReady: false,
  cruiseSpeed: 80,
  engineMode: "race",
  audioVolume: 80,
  voiceOn: false,
  menuOpen: false,
  exploreOpen: false,
  activeHotspot: null,
  showroomWheels: true,
  doorsOpen: false,
  cabinView: false,
  headlightsOn: true,
  autonomous: true,
  graphicsError: false,
  setShowroomWheels: (rolling) => set({ showroomWheels: rolling }),
  aiAction: "idle",
  aiStage: "ready",
  config: { paint: "ion", finish: "mirror", wheel: "aeroblade", wheelFinish: "graphite", signature: "ion", interior: "graphite", caliper: "ion", uiTheme: "ion" },
  setBooted: (b) => set({ booted: b }),
  setModelReady: (b) => set({ modelReady: b }),
  setPhase: (p) => set((s) => (s.phase === p ? s : { phase: p })),
  toggleAudio: () => set((s) => ({ audioOn: !s.audioOn })),
  setMenu: (open) => set({ menuOpen: open }),
  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  setExplore: (open) => set({ exploreOpen: open, activeHotspot: null, cabinView: false, doorsOpen: false }),
  setHotspot: (id) => set({ activeHotspot: id }),
  setAIAction: (action) => set({ aiAction: action }),
  setAIStage: (stage) => set({ aiStage: stage }),
}));

/* ----------------------- device detection ------------------------- */

export function detectQuality(): Quality {
  if (typeof window === "undefined") return "HIGH";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency || 4;
  const saveData = (navigator as any).connection?.saveData === true;
  const lowMem = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
  if (saveData || lowMem) return "LOW";
  if (coarse || small) return cores >= 8 ? "MEDIUM" : "LOW";
  return cores >= 8 ? "HIGH" : "MEDIUM";
}

export const PARTICLE_COUNT: Record<Quality, number> = { HIGH: 280, MEDIUM: 160, LOW: 72 };

export const DPR: Record<Quality, [number, number]> = {
  HIGH: [1, 1.5],
  MEDIUM: [1, 1.5],
  LOW: [0.75, 1],
};

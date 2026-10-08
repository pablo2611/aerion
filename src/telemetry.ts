import { runtime, useExperience } from "./store";

/** One shared source for screen, spoken answers and the driving controls. */
export function advanceTelemetry(dt: number, speed: number, boost: boolean) {
  const t = runtime.telemetry;
  const km = Math.max(0, speed) * dt / 3600;
  const consumption = 14 + speed * speed * 0.00065 + (boost ? 12 : 0);
  t.distanceKm += km;
  t.elapsedSeconds += dt;
  t.battery = Math.max(0, t.battery - (km * consumption / 100 + dt * 0.00008) / 120 * 100);
  const load = Math.min(1, speed / 180);
  const decay = 1 - Math.exp(-dt / 25);
  t.motorTemp += (30 + load * 38 + (boost ? 14 : 0) - t.motorTemp) * decay;
  t.batteryTemp += (26 + load * 11 + (boost ? 4 : 0) - t.batteryTemp) * decay;
}

export function readTelemetry() {
  const state = useExperience.getState();
  const t = runtime.telemetry;
  const speed = runtime.driving ? Math.max(0, Math.round(runtime.speed)) : 0;
  const consumption = 14 + speed * speed * 0.00065;
  return {
    speed, battery: Math.round(t.battery * 10) / 10,
    rangeKm: Math.round((t.battery / 100 * 120) / consumption * 100),
    motorTemp: Math.round(t.motorTemp), batteryTemp: Math.round(t.batteryTemp),
    distanceKm: Math.round(t.distanceKm * 100) / 100,
    minutes: Math.floor(t.elapsedSeconds / 60), consumption: Math.round(consumption * 10) / 10,
    powerKw: speed === 0 ? 0 : Math.round(consumption * speed / 100),
    rpm: runtime.driving ? runtime.rpm : 0, gear: runtime.gear, tireBar: Math.round((2.35 + (t.motorTemp - 30) * .003) * 100) / 100,
    batteryLow: t.battery < 15,
    motorStatus: speed === 0 ? "en reposo" : t.motorTemp > 85 ? "temperatura elevada" : "funcionamiento normal",
    doors: state.doorsOpen ? "abiertas" : "cerradas", lights: state.headlightsOn,
    autonomous: state.autonomous && runtime.driving && !state.drivingPaused,
    paused: state.drivingPaused, driving: runtime.driving, soundMode: state.engineMode,
    volume: state.audioVolume,
  };
}

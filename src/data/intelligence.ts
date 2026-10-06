import type { AIAction } from "../store";

export interface IntelligenceDemo {
  id: Exclude<AIAction, "idle">;
  short: string;
  prompt: string;
  response: string;
  effect: string;
  telemetry: { label: string; value: string }[];
}

export const INTELLIGENCE_DEMOS: IntelligenceDemo[] = [
  {
    id: "night",
    short: "Night journey",
    prompt: "AERION, prepare me for a night journey.",
    response: "Night profile is ready. I selected the quiet route, conditioned the cabin and reduced display glare.",
    effect: "ROUTE + CLIMATE + LIGHTING APPLIED",
    telemetry: [
      { label: "ROUTE", value: "COAST ROAD / 46 MIN" },
      { label: "ARRIVAL CHARGE", value: "61%" },
      { label: "CABIN", value: "21°C" },
      { label: "AURAWEAVE", value: "NIGHT / 24%" },
    ],
  },
  {
    id: "range",
    short: "Explain range",
    prompt: "AERION, show me where my energy is going.",
    response: "At the current pace, propulsion uses 72 percent. Thermal and cabin loads remain below the trip target.",
    effect: "ENERGY MODEL OPENED",
    telemetry: [
      { label: "PREDICTED RANGE", value: "612 KM" },
      { label: "PROPULSION", value: "72%" },
      { label: "THERMAL", value: "8%" },
      { label: "REGEN TODAY", value: "+18.4 KWH" },
    ],
  },
  {
    id: "autonomous",
    short: "What do you see?",
    prompt: "AERION, explain what the car is seeing.",
    response: "I am tracking seven vehicles, two cyclists and both lane boundaries. Neural Path is planning three seconds ahead.",
    effect: "HALOMIND SENSOR FUSION ACTIVE",
    telemetry: [
      { label: "TRACKED OBJECTS", value: "11" },
      { label: "LANES", value: "2 LOCKED" },
      { label: "VISIBILITY", value: "248 M" },
      { label: "ASSISTANCE", value: "L2+ / DRIVER ATTENTIVE" },
    ],
  },
  {
    id: "relax",
    short: "Calm the cabin",
    prompt: "AERION, configure a calmer atmosphere.",
    response: "I softened the cabin light, warmed your side of the cabin and simplified the display to essentials.",
    effect: "CALM PROFILE APPLIED",
    telemetry: [
      { label: "LIGHTING", value: "WARM / 68%" },
      { label: "CLIMATE", value: "22°C" },
      { label: "SOUNDVAULT", value: "FOCUS" },
      { label: "DISPLAY", value: "ESSENTIALS" },
    ],
  },
];
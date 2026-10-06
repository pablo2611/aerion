import { useEffect, useRef } from "react";
import { runtime, setVehicleView, type AIAction, useExperience } from "../store";
import { sonic } from "../audio";

export function useAIDemo() {
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  useEffect(() => clear, []);

  const run = (action: Exclude<AIAction, "idle">) => {
    clear();
    sonic.speak("Entendido. Preparando tu experiencia.");
    const store = useExperience.getState();
    store.setAIAction(action);
    store.setAIStage("listening");
    setVehicleView("interior");
    sonic.blip();

    timers.current.push(window.setTimeout(() => {
      useExperience.getState().setAIStage("processing");
    }, 850));

    timers.current.push(window.setTimeout(() => {
      const current = useExperience.getState();
      current.setAIStage("responding");
      sonic.respond(action);
      if (action === "night") {
        runtime.lightState.ambient = 0.24;
        current.setConfig({ signature: "ion", uiTheme: "ion", interior: "graphite" });
      }
      if (action === "range") current.setConfig({ uiTheme: "energy" });
      if (action === "autonomous") current.setConfig({ signature: "daylight", uiTheme: "vision" });
      if (action === "relax") {
        runtime.lightState.ambient = 0.68;
        current.setConfig({ signature: "solar", uiTheme: "warm", interior: "alabaster" });
      }
      sonic.blip();
    }, 1750));
  };

  return run;
}
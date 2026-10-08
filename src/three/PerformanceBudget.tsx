import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { runtime, useExperience, type Quality } from "../store";

export function pixelRatioFor(quality: Quality, width: number, height: number, deviceDpr: number) {
  const pixels = { HIGH: 1_800_000, MEDIUM: 1_100_000, LOW: 650_000 }[quality];
  return Math.min(deviceDpr, quality === "HIGH" ? 1.5 : 1.25, Math.sqrt(pixels / Math.max(1, width * height)));
}

/** One render clock, bounded pixel count, and conservative automatic step-down. */
export default function PerformanceBudget({ active }: { active: boolean }) {
  const { gl, size, invalidate } = useThree();
  const quality = useExperience(s => s.quality);
  const reduced = useExperience(s => s.reducedMotion);
  const sample = useRef({ frames: 0, seconds: 0, slowWindows: 0, warmup: 3 });
  const setDpr = useThree(s => s.setDpr);
  useEffect(() => { gl.info.autoReset = false; return () => { gl.info.autoReset = true; }; }, [gl]);

  useEffect(() => {
    runtime.quality = quality;
    setDpr(pixelRatioFor(quality, size.width, size.height, window.devicePixelRatio || 1));
    sample.current = { frames: 0, seconds: 0, slowWindows: 0, warmup: 3 };
  }, [quality, size.width, size.height, setDpr]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = 0;
    const interval = 1000 / (quality === "LOW" || reduced ? 30 : quality === "MEDIUM" ? 45 : 60);
    const tick = (now: number) => {
      if (now - last >= interval - 0.7) {
        last = now;
        invalidate();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, quality, reduced, invalidate]);

  useFrame((_, delta) => {
    const calls = gl.info.render.calls;
    const triangles = gl.info.render.triangles;
    gl.info.reset();
    if (!active || delta > 0.5) return;
    const s = sample.current;
    if (s.warmup > 0) { s.warmup -= delta; return; }
    s.frames++; s.seconds += delta;
    if (s.seconds < 2.5) return;
    const fps = s.frames / s.seconds;
    runtime.frameStats = { fps: Math.round(fps), calls, triangles };
    if (import.meta.env.DEV) {
      gl.domElement.dataset.performance = JSON.stringify({ ...runtime.frameStats, quality, dpr: gl.getPixelRatio() });
    }
    s.slowWindows = fps < (quality === "HIGH" ? 38 : 24) ? s.slowWindows + 1 : 0;
    s.frames = 0; s.seconds = 0;
    if (s.slowWindows >= 2 && quality !== "LOW") {
      const next = quality === "HIGH" ? "MEDIUM" : "LOW";
      runtime.quality = next;
      useExperience.setState({ quality: next });
    }
  }, -100);
  return null;
}

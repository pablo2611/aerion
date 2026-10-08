import { Component, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DriveControls from "./sections/DriveControls";
import Scene from "./three/Scene";
import Loader from "./sections/Loader";
import Nav from "./sections/Nav";
import Hero from "./sections/Hero";
import Design from "./sections/Design";
import Aero from "./sections/Aero";
import Performance from "./sections/Performance";
import Battery from "./sections/Battery";
import Interior from "./sections/Interior";
import Intelligence from "./sections/Intelligence";
import Night from "./sections/Night";
import Configurator from "./sections/Configurator";
import Finale from "./sections/Finale";
import Footer from "./sections/Footer";
import ExploreVehicle from "./sections/ExploreVehicle";
import { Cursor, ChapterRail } from "./components/ui";
import { runtime, useExperience, detectQuality } from "./store";
import { CHAPTERS } from "./data/content";
import { AERION_MODEL } from "./data/model";
import { sonic } from "./audio";

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* ---------- WebGL error boundary: keep the DOM story alive ---------- */
class SceneBoundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  componentDidCatch() {
    runtime.driving = false;
    useExperience.setState({ graphicsError: true, modelReady: false, driving: false, exploreOpen: false });
  }
  render() {
    if (this.state.err)
      return (
        <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,#0b1420_0%,#04060a_70%)]" aria-hidden="true" />
      );
    return this.props.children;
  }
}

function VehicleFallback() {
  const ready = useExperience((state) => state.modelReady);
  const failed = useExperience(state => state.graphicsError);
  return (
    <div
      className={`vehicle-fallback pointer-events-none fixed inset-0 z-[1] flex items-center justify-center transition-opacity duration-1000 ${ready && !failed ? "opacity-0" : "opacity-100"}`}
      aria-hidden={ready}
    >
      <img
        src={AERION_MODEL.fallback}
        alt="AERION ONE concept vehicle, front three-quarter studio view"
        className="vehicle-fallback-image"
        loading="eager"
      />
    </div>
  );
}

export default function App() {
  const graphicsError = useExperience(s => s.graphicsError);
  /* ------------------- engine: scroll / pointer / device ------------- */
  useEffect(() => {
    const quality = detectQuality();
    runtime.quality = quality;
    useExperience.setState({ quality });

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduced = () => {
      runtime.reduced = mq.matches;
      document.documentElement.classList.toggle("reduced", mq.matches);
      useExperience.setState({ reducedMotion: mq.matches });
    };
    syncReduced();
    mq.addEventListener("change", syncReduced);

    const measure = () => {
      const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
      runtime.chapters = secs.map((s) => ({ id: s.dataset.chapter!, top: s.getBoundingClientRect().top + window.scrollY, height: s.offsetHeight }));
      if (secs.length) {
        const first = runtime.chapters[0];
        const last = runtime.chapters[secs.length - 1];
        runtime.trackStart = first.top;
        runtime.trackEnd = Math.max(first.top + 1, last.top + last.height - window.innerHeight);
      }
      ScrollTrigger.refresh();
    };

    let lastY = window.scrollY;
    let lastHum = -1;
    const onScroll = () => {
      const y = window.scrollY;
      const inst = y - lastY;
      lastY = y;
      runtime.velocity = runtime.velocity * 0.86 + inst * 0.14;
      runtime.progress = clamp((y - runtime.trackStart) / (runtime.trackEnd - runtime.trackStart), 0, 1);
      document.documentElement.style.setProperty("--journey-progress", String(runtime.progress));

      const probe = y + window.innerHeight * 0.12;
      let ch = -1;
      for (let i = 0; i < runtime.chapters.length; i++) {
        if (probe >= runtime.chapters[i].top) ch = i;
        else break;
      }
      runtime.chapter = ch;
      let id = "hero";
      let theme = "dark";
      if (ch >= 0) {
        const c = runtime.chapters[ch];
        runtime.local = clamp((y - c.top) / Math.max(1, c.height - window.innerHeight), 0, 1);
        id = c.id;
        const meta = CHAPTERS.find((m) => m.id === c.id);
        theme = meta?.theme ?? "dark";
      } else {
        runtime.local = 0;
      }
      useExperience.getState().setPhase(id);
      document.documentElement.dataset.theme = theme;

      const target = ch === 2 ? Math.min(runtime.local * 1.6, 1) * 0.75 : ch === 8 ? runtime.local : 0;
      if (Math.abs(target - lastHum) > 0.06) {
        lastHum = target;
        sonic.hum(target);
      }
    };

    let ticking = false;
    let scrollFrame = 0;
    let resizeTimer = 0;
    const onScrollRaf = () => {
      ticking = false;
      onScroll();
    };
    const onScrollEvt = () => {
      if (!ticking) {
        ticking = true;
        scrollFrame = requestAnimationFrame(onScrollRaf);
      }
    };
    const onPointer = (e: MouseEvent) => {
      runtime.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      runtime.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    measure();
    onScroll();
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { measure(); onScroll(); }, 140);
    };
    window.addEventListener("scroll", onScrollEvt, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onPointer, { passive: true });
    const t = setTimeout(measure, 1200); // after fonts / images settle
    return () => {
      clearTimeout(t);
      clearTimeout(resizeTimer);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScrollEvt);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onPointer);
      mq.removeEventListener("change", syncReduced);
    };
  }, []);

  return (
    <>
      <a href="#design" className="skip-link">
        Skip to content
      </a>
      <SceneBoundary>
        <Scene />
      </SceneBoundary>
      <VehicleFallback />
      {graphicsError && <div className="graphics-recovery" role="status">
        <p>La vista 3D se ha pausado. Puedes seguir explorando la web.</p>
        <button onClick={() => window.location.reload()}>Reintentar vista 3D</button>
      </div>}
      <div className="journey-progress" aria-hidden="true"/>
      <div className="noise-overlay" aria-hidden="true" />
      <Loader />
      <Nav />
      <ExploreVehicle />
      <DriveControls />
      <main className="relative z-10">
        <Hero />
        <Design />
        <Aero />
        <Performance />
        <Battery />
        <Interior />
        <Intelligence />
        <Night />
        <Configurator />
        <Finale />
      </main>
      <ChapterRail />
      <Footer />
      <Cursor />
    </>
  );
}

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS } from "../data/content";
import { useExperience } from "../store";

gsap.registerPlugin(ScrollTrigger);

const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ----------------------------- cursor ------------------------------ */

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!finePointer() || prefersReduced()) return;
    document.documentElement.classList.add("aerion-cursor");
    let x = innerWidth / 2, y = innerHeight / 2;
    let s = 1, ts = 1, visible = false, raf = 0;
    const onMove = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY; visible = true;
      const t = (e.target as HTMLElement)?.closest?.("[data-cursor]") as HTMLElement | null;
      ts = t ? 1.12 : 1;
      if (label.current) label.current.textContent = t?.dataset.cursorLabel ?? "";
    };
    const onLeave = () => (visible = false);
    const loop = () => {
      raf = requestAnimationFrame(loop);
      s += (ts - s) * 0.14;
      const op = visible ? 1 : 0;
      if (dot.current)
        dot.current.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${x - 3}px, ${y - 2}px, 0) scale(${s})`;
        ring.current.style.opacity = String(op);
      }
      if (dot.current) dot.current.style.opacity = String(op);
    };
    loop();
    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("aerion-cursor");
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] hidden md:block">
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring">
        <svg viewBox="0 0 24 28" width="24" height="28" fill="none">
          <path d="M3 2v20l5.8-5 4.3 9 3.8-1.9-4.2-8.6H21L3 2Z" fill="#091c29" stroke="#9be9ec" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span ref={label} className="cursor-label" />
      </div>
    </div>
  );
}

/* ---------------------------- magnetic ----------------------------- */

export function Magnetic({
  children,
  className,
  strength = 0.32,
  as: Tag = "a",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: any;
  [key: string]: any;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer() || prefersReduced()) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`
      );
    };
    const onLeave = () => {
      el.style.transform = "translate3d(0,0,0)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return (
    <Tag ref={ref} className={`magnetic ${className ?? ""}`} {...rest}>
      {children}
    </Tag>
  );
}

/* --------------------------- cine video ---------------------------- */

export function CineVideo({
  src,
  poster,
  className = "",
  videoClassName = "",
  alt = "",
}: {
  src: string;
  poster: string;
  className?: string;
  videoClassName?: string;
  alt?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) setLoaded(true);
        const v = video.current;
        if (v) {
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { rootMargin: "250px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className={`relative overflow-hidden ${className}`} role={alt ? "img" : "presentation"} aria-label={alt}>
      {!loaded ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${poster})` }} />
      ) : (
        <video
          ref={video}
          className={`absolute inset-0 h-full w-full object-cover ${videoClassName}`}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* ----------------------------- kicker ------------------------------ */

export function Kicker({ index, label, className = "" }: { index: string; label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 font-mono-tech text-[12px] sm:text-[12px] tracking-[0.32em] uppercase opacity-80 ${className}`}>
      <span className="inline-block h-px w-8 sm:w-12 bg-current opacity-60" data-rv="line" />
      <span>{index} // {label}</span>
    </div>
  );
}

/* ---------------------- scrub-driven counter ----------------------- */

export function Counter({
  to,
  dec = 0,
  sectionId,
  className = "",
}: {
  to: number;
  dec?: number;
  sectionId: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const sec = document.getElementById(sectionId);
    if (!el || !sec) return;
    const fmt = (v: number) => {
      el.textContent = v
        .toFixed(dec)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    fmt(0);
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top 85%",
      end: "center 35%",
      scrub: 0.8,
      onUpdate: (self) => fmt(self.progress * to),
    });
    return () => st.kill();
  }, [sectionId, to, dec]);
  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}

/* -------------------------- chapter rail --------------------------- */

export function ChapterRail() {
  const phase = useExperience((s) => s.phase);
  const exploring = useExperience(s => s.exploreOpen);
  if (phase === "configurator" || exploring) return null;
  return (
    <nav
      aria-label="Chapters"
      className="fixed right-5 xl:right-8 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-2.5 lg:flex"
    >
      {CHAPTERS.map((c) => {
        const active = phase === c.id;
        return (
          <button
            key={c.id}
            onClick={() =>
              document.getElementById(c.id)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" })
            }
            className={`group flex items-center gap-2.5 py-0.5 text-right transition-all duration-500 ${
              active ? "opacity-100" : "opacity-35 hover:opacity-70"
            }`}
            aria-current={active ? "true" : undefined}
            data-cursor
          >
            <span
              className={`font-mono-tech text-[12px] tracking-[0.25em] uppercase transition-all duration-500 ${
                active ? "translate-x-0" : "translate-x-1.5"
              }`}
            >
              {c.label}
            </span>
            <span
              className={`block h-px transition-all duration-500 ${active ? "w-6 bg-ion" : "w-3 bg-current"}`}
            />
          </button>
        );
      })}
    </nav>
  );
}

/* ---------------------------- hotspots ----------------------------- */

export function Hotspot({
  x,
  y,
  title,
  body,
  className = "",
}: {
  x: string;
  y: string;
  title: string;
  body: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`absolute ${className}`} style={{ left: x, top: y }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={title}
        data-cursor
        data-cursor-label="VIEW"
        className="hotspot-dot relative block h-5 w-5"
      >
        <span className={`hotspot-pulse absolute inset-0 rounded-full ${open ? "opacity-0" : ""}`} />
        <span className={`absolute inset-[7px] rounded-full ${open ? "bg-ion" : "bg-current"}`} />
      </button>
      <div
        className={`hotspot-panel absolute left-1/2 top-7 z-20 w-60 -translate-x-1/2 ${
          open ? "hotspot-panel-open" : ""
        }`}
        role="region"
        aria-hidden={!open}
      >
        <p className="font-display text-[13px] font-bold tracking-wide">{title}</p>
        <p className="mt-1.5 text-[12px] leading-relaxed opacity-75">{body}</p>
      </div>
    </div>
  );
}

/* ----------------------- section shell ----------------------------- */

export function SectionShell({
  id,
  chapter,
  height,
  children,
  style,
}: {
  id: string;
  chapter: string;
  height: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section id={id} data-chapter={chapter} className="relative" style={{ height, ...style }} aria-label={chapter}>
      <div className="sticky top-0 h-[100dvh] min-h-[560px] w-full overflow-hidden">{children}</div>
    </section>
  );
}

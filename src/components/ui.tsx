import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const inView = useRef(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        inView.current = e.isIntersecting;
        if (e.isIntersecting) setLoaded(true);
        const v = video.current;
        if (v) {
          if (e.isIntersecting && !document.hidden && !prefersReduced()) v.play().catch(() => {});
          else v.pause();
        }
      },
      { rootMargin: "0px" }
    );
    io.observe(el);
    const syncVideo = () => {
      const v = video.current;
      if (!v) return;
      if (inView.current && !document.hidden && !prefersReduced()) void v.play().catch(() => {});
      else v.pause();
    };
    document.addEventListener("visibilitychange",syncVideo);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange",syncVideo); };
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
          onLoadedData={e => { if (inView.current && !document.hidden && !prefersReduced()) void e.currentTarget.play().catch(() => {}); }}
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
  flow = false,
}: {
  id: string;
  chapter: string;
  height: string;
  children: ReactNode;
  style?: CSSProperties;
  flow?: boolean;
}) {
  return (
    <section id={id} data-chapter={chapter} className={flow ? "story-chapter-flow relative" : "story-chapter relative"} style={flow ? style : { "--chapter-height": height, "--chapter-mobile-height": `${Math.max(135, parseFloat(height) * 0.82)}svh`, ...style } as CSSProperties} aria-label={chapter}>
      <div className={flow ? "w-full" : "sticky top-0 h-[100dvh] min-h-[560px] w-full overflow-hidden"}>{children}</div>
    </section>
  );
}

import { useEffect } from "react";
import { NAV_LINKS, CHAPTERS } from "../data/content";
import { useExperience } from "../store";
import { sonic } from "../audio";
import { Magnetic } from "../components/ui";
import { prefersReduced } from "../utils/motion";

function Logo() {
  return (
    <a href="#top" className="group flex items-center gap-2.5" aria-label="AERION — back to top" data-cursor>
      <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden="true">
        <path d="M2 16 L13 2 L24 16" stroke="currentColor" strokeWidth="2.2" />
        <path d="M8 16 L13 9 L18 16" strokeWidth="1.4" className="opacity-70" style={{ stroke: "var(--color-ion)" }} />
      </svg>
      <span className="font-display text-[15px] font-extrabold tracking-[0.35em]">AERION</span>
      <span className="hidden font-mono-tech text-[12px] tracking-[0.3em] opacity-50 sm:inline">ONE</span>
    </a>
  );
}

function AudioToggle() {
  const audioOn = useExperience((s) => s.audioOn);

  return (
    <button
      onClick={async () => {
        useExperience.setState({ audioOn: await sonic.toggle() });
        sonic.blip();
      }}
      className="group flex h-10 items-center gap-2 border border-line px-3 transition-colors duration-300 hover:border-ion/60"
      aria-pressed={audioOn}
      aria-label={audioOn ? "Silenciar música" : "Activar música"}
      data-cursor
    >
      <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={i * 4.2}
            y={0}
            width="2.4"
            height={audioOn ? [4, 12, 8, 10][i] : [4, 6, 4, 6][i]}
            fill="currentColor"
            className={`transition-all duration-500 ${audioOn ? "" : "opacity-40"}`}
            style={{ transitionDelay: `${i * 60}ms` }}
          />
        ))}
      </svg>
      <span className="nav-audio-label font-mono-tech text-[12px] tracking-[0.1em] opacity-90">
        {audioOn ? "SONIDO ON" : "SONIDO OFF"}
      </span>
    </button>
  );
}

export default function Nav() {
  const exploring = useExperience(s => s.exploreOpen);
  const phase = useExperience((s) => s.phase);
  const menuOpen = useExperience((s) => s.menuOpen);
  const setMenu = useExperience((s) => s.setMenu);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen, setMenu]);

  if (exploring) return null;

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" });
    setMenu(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="flex items-center justify-between gap-6 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-10 sm:py-6">
          <Logo />
          <nav className="hidden items-center justify-center gap-5 xl:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className={`group relative font-mono-tech text-[12px] tracking-[0.3em] uppercase transition-opacity duration-300 ${
                  phase === l.id ? "opacity-100" : "opacity-45 hover:opacity-85"
                }`}
                data-cursor
              >
                {l.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-ion transition-all duration-500 ${
                    phase === l.id ? "w-full" : "w-0 group-hover:w-1/2"
                  }`}
                />
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <AudioToggle />
            <Magnetic
              as="button"
              onClick={() => go("finale")}
              className="nav-reserve btn-solid hidden md:inline-flex"
              data-cursor
              data-cursor-label="GO"
            >
              Reserve
            </Magnetic>
            <button
              onClick={() => setMenu(!menuOpen)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-line xl:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <span className={`block h-px w-4 bg-current transition-transform duration-300 ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`} />
              <span className={`block h-px w-4 bg-current transition-transform duration-300 ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* mobile menu */}
      <div
        className={`fixed inset-0 z-[45] flex flex-col justify-between gap-8 overflow-y-auto bg-[#04060a]/[0.985] px-7 pb-10 pt-28 transition-all duration-500 xl:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <button onClick={() => setMenu(false)} tabIndex={menuOpen ? 0 : -1} className="absolute right-5 top-5 min-h-11 border border-white/30 px-4" aria-label="Cerrar menú">Cerrar</button>
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          {CHAPTERS.map((l, i) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              tabIndex={menuOpen ? 0 : -1}
              className={`group flex items-baseline gap-4 py-2 text-left transition-all duration-500 ${
                menuOpen ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
              }`}
              style={{ transitionDelay: menuOpen ? `${120 + i * 70}ms` : "0ms" }}
            >
              <span className="font-mono-tech text-[12px] tracking-[0.3em] text-ion/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-[clamp(1.25rem,5vw,2.25rem)] font-extrabold leading-[1.05] tracking-tight">
                {l.label.toUpperCase()}
              </span>
            </button>
          ))}
        </nav>
        <div className="flex items-end justify-between font-mono-tech text-[12px] tracking-[0.3em] text-white/70">
          <span>AERION // ONE</span>
          <span>GENOA 2027</span>
        </div>
      </div>
      {/* chapter count for a11y label */}
      <span className="sr-only">{CHAPTERS.length} chapters</span>
    </>
  );
}

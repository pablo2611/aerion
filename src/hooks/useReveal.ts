import { useEffect, type RefObject } from 'react';

/** Reveal actual visible elements, including inside sticky story chapters. */
export function useReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        const direction = element.dataset.rv;
        const transform = direction === 'left' ? 'translateX(-24px)' : direction === 'right' ? 'translateX(24px)' : direction === 'line' ? 'scaleX(.85)' : direction === 'fade' ? 'none' : 'translateY(24px)';
        animations.push(element.animate(
          reduced.matches ? [{opacity:.75},{opacity:1}] : [{opacity:.65,transform},{opacity:1,transform:'none'}],
          {duration:reduced.matches ? 180 : 700,easing:'cubic-bezier(0.23, 1, 0.32, 1)'}
        ));
        observer.unobserve(element);
      });
    }, {rootMargin:'0px 0px -12% 0px',threshold:.1});
    root.querySelectorAll('[data-rv]').forEach(element => observer.observe(element));
    const adapt = () => { if (reduced.matches) animations.forEach(animation => animation.cancel()); };
    reduced.addEventListener('change',adapt);
    return () => {
      observer.disconnect();animations.forEach(animation => animation.cancel());
      reduced.removeEventListener('change',adapt);
    };
  }, [ref]);
}

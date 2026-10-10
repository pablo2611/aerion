import { useEffect, type RefObject } from 'react';

/** One entrance per element; ongoing feedback runs only while visible. */
export function useCampaignMotion(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    let visible = false;
    const sync = () => { root.dataset.motionVisible = String(visible && !document.hidden); };
    const visibility = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === root) visible = entry.isIntersecting;
        else (entry.target as HTMLElement).dataset.loopVisible = String(entry.isIntersecting);
      });
      sync();
    });
    const entrances = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        const delay = reduced.matches ? 0 : Number(element.dataset.motionOrder ?? 0) * 60;
        animations.push(element.animate(
          reduced.matches ? [{ opacity: 0.7 }, { opacity: 1 }] : [{ opacity: 0.65, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: reduced.matches ? 180 : 700, delay, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
        ));
        entrances.unobserve(element);
      });
    }, { threshold: 0.12 });
    visibility.observe(root);
    root.querySelectorAll('[data-motion-loop]').forEach(element => visibility.observe(element));
    root.querySelectorAll('[data-motion-enter]').forEach(element => entrances.observe(element));
    document.addEventListener('visibilitychange', sync);
    const adapt = () => { if (reduced.matches) animations.forEach(animation => animation.cancel()); };
    reduced.addEventListener('change', adapt);
    return () => {
      visibility.disconnect(); entrances.disconnect();
      animations.forEach(animation => animation.cancel());
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', adapt);
    };
  }, [ref]);
}

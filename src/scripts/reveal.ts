/**
 * Fades sections in as they enter the viewport. Only elements that start
 * below the fold are hidden, and only once this script is running, so the
 * page is complete without JavaScript and nothing already visible flickers.
 */
export function initReveal(): void {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight,
  );
  if (targets.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add('reveal-in');
        el.classList.remove('reveal-pending');
        observer.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  for (const el of targets) {
    el.classList.add('reveal-pending');
    observer.observe(el);
  }
}

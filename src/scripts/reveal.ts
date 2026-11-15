/**
 * Fades each section in once, the first time it scrolls into view.
 *
 * - Only sections that start below the fold are hidden, and only by this
 *   script, so the page is complete without JavaScript and nothing already on
 *   screen flickers.
 * - A section the visitor has already passed or jumped over appears at once,
 *   with no fade.
 * - Following a link to a part of the page shows everything up to and around
 *   the destination before the scroll starts, so nothing fades in mid-flight.
 * - Under reduced motion nothing is hidden at all.
 */
const PENDING = 'reveal-pending';
const ENTER = 'reveal-in';

export function initReveal(): void {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const pending = new Set(
    [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight,
    ),
  );
  if (pending.size === 0) return;

  const listeners = new AbortController();

  const show = (el: HTMLElement, fade: boolean): void => {
    if (!pending.delete(el)) return;
    observer.unobserve(el);
    // The transition lives on `reveal-in`, so leaving it off shows the
    // section in one frame.
    if (fade) el.classList.add(ENTER);
    el.classList.remove(PENDING);

    if (pending.size === 0) {
      observer.disconnect();
      listeners.abort();
    }
  };

  // The top margin reaches far above the viewport, so a section counts as
  // arrived whether it is on screen or has been scrolled or jumped past.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const onScreen = entry.boundingClientRect.bottom > 0;
        show(entry.target as HTMLElement, onScreen);
      }
    },
    { rootMargin: '1000000px 0px -8% 0px' },
  );

  /** Show, without a fade, everything that will be above or on screen once
      the page has scrolled to `hash`. */
  const showThrough = (hash: string): void => {
    let id = hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      // A malformed hash is looked up as written.
    }
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    const limit = target.getBoundingClientRect().top + window.innerHeight;
    for (const el of [...pending]) {
      if (el.getBoundingClientRect().top < limit) show(el, false);
    }
  };

  for (const el of pending) {
    el.classList.add(PENDING);
    observer.observe(el);
  }

  // Arriving on a link such as /#contact.
  if (location.hash) showThrough(location.hash);

  // Links to another part of this page, handled before the scroll begins.
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.hash && url.pathname === location.pathname && url.search === location.search) {
        showThrough(url.hash);
      }
    },
    { signal: listeners.signal },
  );

  // Back and forward between parts of the page.
  window.addEventListener('hashchange', () => showThrough(location.hash), {
    signal: listeners.signal,
  });
}

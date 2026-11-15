/**
 * Header behaviour: a bottom edge once the page has scrolled, and a marker on
 * the navigation link whose section is on screen.
 */
export function initNav(): void {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (!header) return;

  let scrolled = false;
  const onScroll = () => {
    const next = window.scrollY > 4;
    if (next === scrolled) return;
    scrolled = next;
    header.toggleAttribute('data-scrolled', next);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Links that point at a section of this page, for example /#contact.
  const links = new Map<Element, HTMLAnchorElement>();
  for (const link of header.querySelectorAll<HTMLAnchorElement>('nav a[href*="#"]')) {
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname) continue;
    const section = document.getElementById(url.hash.slice(1));
    if (section) links.set(section, link);
  }
  if (links.size === 0 || !('IntersectionObserver' in window)) return;

  // A section counts as current while it crosses the middle of the viewport.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const link = links.get(entry.target);
        if (!link) continue;
        if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  for (const section of links.keys()) observer.observe(section);
}

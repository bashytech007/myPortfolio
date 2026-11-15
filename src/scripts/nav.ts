/**
 * Header behaviour: a bottom edge once the page has scrolled, the phone menu,
 * and a marker on the navigation link whose section is on screen.
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

  initMenu(header);

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

/** The Menu button that opens the navigation panel on narrow screens. */
function initMenu(header: HTMLElement): void {
  const button = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  if (!button) return;

  const setOpen = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    header.toggleAttribute('data-menu-open', open);
  };
  const isOpen = () => header.hasAttribute('data-menu-open');

  button.addEventListener('click', () => setOpen(!isOpen()));

  // Following a link closes the panel, including a link to this page.
  header.querySelector('nav')?.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    button.focus();
  });

  // The panel only exists below 48rem; close it if the window grows past that.
  window.matchMedia('(min-width: 48rem)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

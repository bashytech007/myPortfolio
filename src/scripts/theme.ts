export type Theme = 'dark' | 'light';

const root = document.documentElement;

export function getTheme(): Theme {
  return root.dataset.theme === 'light' ? 'light' : 'dark';
}

function apply(theme: Theme): void {
  if (theme === 'light') root.dataset.theme = 'light';
  else delete root.dataset.theme;
  syncControls();
}

/** Switch theme and remember the choice for the next visit. */
export function setTheme(theme: Theme): void {
  apply(theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Storage can be blocked; the theme still applies for this page view.
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

function syncControls(): void {
  const other: Theme = getTheme() === 'dark' ? 'light' : 'dark';

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    button.setAttribute('aria-label', `Switch to ${other} theme`);
    button.title = `Switch to ${other} theme`;
  }

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim();
}

export function initThemeControls(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    button.addEventListener('click', () => toggleTheme());
  }
  syncControls();

  // Keep other open tabs in step.
  window.addEventListener('storage', (event) => {
    if (event.key !== 'theme') return;
    if (event.newValue === 'light' || event.newValue === 'dark') apply(event.newValue);
  });
}

/**
 * How the terminal looks: the phosphor colour and the CRT effects. Both are
 * attributes on <html>, remembered on this device, and applied before first
 * paint by public/theme-init.js.
 */
export const PHOSPHORS = ['amber', 'green', 'mono'] as const;
export type Phosphor = (typeof PHOSPHORS)[number];

const root = document.documentElement;

function remember(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked; the change still applies for this page view.
  }
}

export function isPhosphor(value: string | undefined): value is Phosphor {
  return PHOSPHORS.includes(value as Phosphor);
}

export function getPhosphor(): Phosphor {
  const current = root.dataset.phosphor;
  return isPhosphor(current) ? current : 'amber';
}

export function setPhosphor(phosphor: Phosphor): void {
  root.dataset.phosphor = phosphor;
  remember('phosphor', phosphor);
}

/** Step to the next colour and return it. */
export function nextPhosphor(): Phosphor {
  const next = PHOSPHORS[(PHOSPHORS.indexOf(getPhosphor()) + 1) % PHOSPHORS.length] ?? 'amber';
  setPhosphor(next);
  return next;
}

export function getCrt(): boolean {
  return root.dataset.crt !== 'off';
}

export function setCrt(on: boolean): void {
  if (on) delete root.dataset.crt;
  else root.dataset.crt = 'off';
  remember('crt', on ? 'on' : 'off');
}

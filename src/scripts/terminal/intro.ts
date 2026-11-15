/**
 * Types out the session that is already in the HTML, once per browser
 * session. The blocking script in <head> decides whether it will play (never
 * under prefers-reduced-motion) by adding `intro-pending` to <html>, which
 * hides the lines from the first paint while keeping their space, so nothing
 * shifts as they appear.
 *
 * Any key, click or the Skip button ends it immediately.
 */
const TYPE_MS = 38;
const PAUSE_BEFORE_OUTPUT_MS = 160;
const PAUSE_BETWEEN_MS = 320;

export function playIntro(terminal: HTMLElement): void {
  const page = document.documentElement;
  if (!page.classList.contains('intro-pending')) return;

  const entries = [...terminal.querySelectorAll<HTMLElement>('[data-term-intro]')];
  const skipButton = terminal.querySelector<HTMLButtonElement>('[data-term-skip]');
  if (entries.length === 0) {
    page.classList.remove('intro-pending');
    return;
  }

  // Take over from the stylesheet rule keyed on `intro-pending`.
  const steps = entries.map((entry) => {
    const line = entry.querySelector<HTMLElement>('.term-line');
    const command = entry.querySelector<HTMLElement>('.term-cmd');
    const output = entry.querySelector<HTMLElement>('.term-out');
    line?.classList.add('term-wait');
    output?.classList.add('term-wait');
    return { line, command, output, text: command?.textContent ?? '' };
  });
  page.classList.remove('intro-pending');

  let skipped = false;
  const pending = new Set<() => void>();
  const wait = (ms: number) =>
    skipped
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          const done = () => {
            pending.delete(done);
            resolve();
          };
          pending.add(done);
          window.setTimeout(done, ms);
        });

  const skip = () => {
    skipped = true;
    for (const done of [...pending]) done();
  };

  const controller = new AbortController();
  const { signal } = controller;
  terminal.addEventListener('pointerdown', skip, { signal });
  terminal.addEventListener('keydown', skip, { signal });
  terminal.addEventListener('focusin', (event) => event.target !== skipButton && skip(), { signal });
  skipButton?.addEventListener('click', skip, { signal });

  const cursor = document.createElement('span');
  cursor.className = 'term-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  async function play(): Promise<void> {
    if (skipButton) skipButton.hidden = false;
    await wait(PAUSE_BETWEEN_MS);

    for (const step of steps) {
      if (step.line && step.command) {
        step.command.textContent = '';
        step.line.append(cursor);
        step.line.classList.remove('term-wait');
        for (let i = 1; i <= step.text.length && !skipped; i += 1) {
          step.command.textContent = step.text.slice(0, i);
          await wait(TYPE_MS);
        }
        step.command.textContent = step.text;
        await wait(PAUSE_BEFORE_OUTPUT_MS);
      }
      step.output?.classList.remove('term-wait');
      await wait(PAUSE_BETWEEN_MS);
    }

    cursor.remove();
    for (const step of steps) {
      step.line?.classList.remove('term-wait');
      step.output?.classList.remove('term-wait');
    }
    if (skipButton) skipButton.hidden = true;
    controller.abort();
    try {
      sessionStorage.setItem('intro-done', '1');
    } catch {
      // Without storage the intro simply plays again on the next visit.
    }
  }

  // Start when the terminal is actually on screen.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (items) => {
        if (items.some((item) => item.isIntersecting)) {
          observer.disconnect();
          void play();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(terminal);
  } else {
    void play();
  }
}

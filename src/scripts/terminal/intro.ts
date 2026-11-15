/**
 * Shows the boot lines that are already in the HTML one after another, once
 * per browser session. The blocking script in <head> decides whether it will
 * play (never under prefers-reduced-motion) by adding `intro-pending` to
 * <html>, which hides the lines from the first paint while keeping their
 * space, so nothing shifts as they appear.
 *
 * Any key, click or the Skip button ends it immediately.
 */
const STEP_MS = 35;
const START_MS = 60;

export function playIntro(terminal: HTMLElement, onDone: () => void): void {
  const page = document.documentElement;
  const steps = [...terminal.querySelectorAll<HTMLElement>('[data-term-intro]')];
  if (!page.classList.contains('intro-pending') || steps.length === 0) {
    page.classList.remove('intro-pending');
    onDone();
    return;
  }

  const skipButton = terminal.querySelector<HTMLButtonElement>('[data-term-skip]');

  // Take over from the stylesheet rule keyed on `intro-pending`.
  for (const step of steps) step.classList.add('term-wait');
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
  document.addEventListener('pointerdown', skip, { signal });
  document.addEventListener('keydown', skip, { signal });
  skipButton?.addEventListener('click', skip, { signal });

  async function play(): Promise<void> {
    if (skipButton) skipButton.hidden = false;
    await wait(START_MS);

    for (const step of steps) {
      step.classList.remove('term-wait');
      // A step can ask for a longer pause after it: data-term-intro="400".
      await wait(Number(step.dataset.termIntro) || STEP_MS);
    }

    for (const step of steps) step.classList.remove('term-wait');
    if (skipButton) skipButton.hidden = true;
    controller.abort();
    try {
      sessionStorage.setItem('intro-done', '1');
    } catch {
      // Without storage the intro simply plays again on the next visit.
    }
    onDone();
  }

  void play();
}

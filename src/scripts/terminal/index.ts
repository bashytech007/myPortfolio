import { commands, type Shell } from './commands';
import { complete } from './complete';
import { playIntro } from './intro';

const HISTORY_KEY = 'term-history';
const HISTORY_LIMIT = 50;

function loadHistory(): string[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((line): line is string => typeof line === 'string') : [];
  } catch {
    return [];
  }
}

function readJson<T>(text: string | undefined, fallback: T): T {
  try {
    return JSON.parse(text ?? '') as T;
  } catch {
    return fallback;
  }
}

export function initTerminal(): void {
  const root = document.querySelector<HTMLElement>('[data-terminal]');
  const screen = root?.querySelector<HTMLElement>('[data-term-screen]');
  const session = root?.querySelector<HTMLElement>('[data-term-session]');
  const log = root?.querySelector<HTMLElement>('[data-term-log]');
  const form = root?.querySelector<HTMLFormElement>('[data-term-form]');
  const input = root?.querySelector<HTMLInputElement>('[data-term-input]');
  if (!root || !screen || !session || !log || !form || !input) return;

  const ghost = root.querySelector<HTMLElement>('[data-term-ghost]');
  const ps1 = form.querySelector<HTMLElement>('[data-term-ps1]');

  const history = loadHistory();
  let historyIndex = history.length;
  let draft = '';
  let output: HTMLElement | null = null;

  const files = [...root.querySelectorAll<HTMLTemplateElement>('template[data-file]')].map(
    (template) => template.dataset.file ?? '',
  );

  const scrollToEnd = () => {
    screen.scrollTop = screen.scrollHeight;
  };

  const shell: Shell = {
    files,
    sections: readJson<Shell['sections']>(root.dataset.sections, {}),
    links: readJson<Shell['links']>(root.dataset.links, {}),
    history,

    // Typed input only ever reaches the page through textContent.
    print(text, className) {
      const line = document.createElement('p');
      if (className) line.className = className;
      line.textContent = text;
      output?.append(line);
    },

    printTemplate(selector) {
      const template = root.querySelector<HTMLTemplateElement>(selector);
      if (!template) return false;
      output?.append(template.content.cloneNode(true));
      return true;
    },

    clear() {
      session.hidden = true;
      log.replaceChildren();
      output = null;
    },

    navigate(href) {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      // Leave the line on screen for a moment before the page changes.
      window.setTimeout(() => location.assign(url.href), 250);
    },

    open(href) {
      const url = new URL(href, location.href);
      if (url.origin === location.origin) this.navigate(url.href);
      else if (url.protocol === 'https:' || url.protocol === 'http:') {
        window.open(url.href, '_blank', 'noopener,noreferrer');
      }
    },
  };

  /** The dim suggestion shown after the caret: the rest of the one command
      or argument that matches what has been typed so far. */
  const suggestion = (): string => {
    const value = input.value;
    if (value.trim() === '' || input.selectionStart !== value.length) return '';
    if (input.scrollWidth > input.clientWidth) return '';
    const completed = complete(value, shell).value.trimEnd();
    return completed.length > value.length && completed.startsWith(value)
      ? completed.slice(value.length)
      : '';
  };

  const updateGhost = () => {
    if (!ghost) return;
    const rest = suggestion();
    const typed = document.createElement('span');
    typed.className = 'term-ghost__typed';
    typed.textContent = rest ? input.value : '';
    const hint = document.createElement('span');
    hint.textContent = rest;
    ghost.replaceChildren(typed, hint);
    ghost.dataset.rest = rest;
  };

  const run = async (line: string): Promise<void> => {
    const text = line.trim();

    const entry = document.createElement('div');
    entry.className = 'term-entry';

    const echo = document.createElement('p');
    echo.className = 'term-line';
    // The visible parts of the prompt are copied from the form, so the echo
    // matches it exactly. It is not a second <label> for the input.
    const prompt = document.createElement('span');
    prompt.className = 'term-ps1';
    prompt.setAttribute('aria-hidden', 'true');
    for (const part of ps1?.querySelectorAll('[aria-hidden]') ?? []) prompt.append(part.cloneNode(true));
    const typed = document.createElement('span');
    typed.className = 'term-cmd';
    typed.textContent = text;
    const label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = 'Command:';
    echo.append(prompt, label, typed);

    const out = document.createElement('div');
    out.className = 'term-out';
    entry.append(echo, out);
    log.append(entry);
    output = out;

    if (text) {
      if (history.at(-1) !== text) history.push(text);
      if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
      try {
        sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch {
        // History is kept in memory only when storage is blocked.
      }

      const [name = '', ...args] = text.split(/\s+/);
      const command = Object.hasOwn(commands, name.toLowerCase()) ? commands[name.toLowerCase()] : undefined;
      if (command) {
        try {
          await command.run(args, shell);
        } catch {
          shell.print(`${name}: something went wrong`, 'term-error');
        }
      } else {
        shell.print(`command not found: ${name}. Type help for a list.`, 'term-error');
      }
    }

    historyIndex = history.length;
    draft = '';
    updateGhost();
    scrollToEnd();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const line = input.value;
    input.value = '';
    void run(line);
  });

  input.addEventListener('input', updateGhost);
  // Moving the caret away from the end hides the suggestion.
  input.addEventListener('keyup', updateGhost);
  input.addEventListener('click', updateGhost);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (history.length === 0) return;
      event.preventDefault();
      if (historyIndex === history.length) draft = input.value;
      historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = historyIndex === history.length ? draft : (history[historyIndex] ?? '');
      input.setSelectionRange(input.value.length, input.value.length);
      updateGhost();
      return;
    }

    if (event.key === 'Escape') {
      input.value = '';
      updateGhost();
      return;
    }

    // Right arrow at the end of the line accepts the suggestion.
    if (event.key === 'ArrowRight' && ghost?.dataset.rest && input.selectionStart === input.value.length) {
      event.preventDefault();
      input.value += ghost.dataset.rest;
      updateGhost();
      return;
    }

    // Tab completes only when there is something to complete, so an empty
    // prompt never traps keyboard focus inside the terminal.
    if (event.key === 'Tab' && !event.shiftKey && input.value.trim() !== '') {
      event.preventDefault();
      const result = complete(input.value, shell);
      input.value = result.value;
      updateGhost();
      if (result.options.length > 1) {
        const entry = document.createElement('div');
        entry.className = 'term-entry';
        const options = document.createElement('p');
        options.className = 'term-dim';
        options.textContent = result.options.join('   ');
        entry.append(options);
        log.append(entry);
        scrollToEnd();
      }
    }
  });

  // Shortcut buttons under the screen.
  root.querySelector('[data-term-chips]')?.addEventListener('click', (event) => {
    const chip = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-run]');
    if (chip?.dataset.run) void run(chip.dataset.run);
  });

  // With a mouse, clicking anywhere on the screen focuses the prompt, unless
  // the click was on a link or was the end of a text selection.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) {
    screen.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('a, button, input, label')) return;
      if (!window.getSelection()?.isCollapsed) return;
      input.focus({ preventScroll: true });
    });
  }

  // On a keyboard device the prompt is ready as soon as the intro is over.
  // On touch it waits for a tap, so the on-screen keyboard does not cover
  // the screen straight away.
  playIntro(root, () => {
    if (finePointer) input.focus({ preventScroll: true });
  });
}

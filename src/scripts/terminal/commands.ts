import { getCrt, getPhosphor, isPhosphor, nextPhosphor, PHOSPHORS, setCrt, setPhosphor } from './display';
import { notesFlag, submitFlag } from './flags';

/** What a command can do. Implemented by the terminal in index.ts. */
export interface Shell {
  /** Print a line of plain text. Always inserted as text, never as HTML. */
  print(text: string, className?: string): void;
  /** Print a block that was rendered into the page at build time. */
  printTemplate(selector: string): boolean;
  clear(): void;
  /** Go to a site path or an anchor on the current page. */
  navigate(href: string): void;
  /** Follow a link: same-origin links navigate, others open in a new tab. */
  open(href: string): void;
  /** Paths `cat` can print, for example "about.txt" or "projects/x.md". */
  files: string[];
  /** Names `cd` accepts, mapped to where they go. */
  sections: Record<string, string>;
  /** Project ids `open` accepts, with each project's title and live link. */
  links: Record<string, { title: string; href: string | null }>;
  history: string[];
}

export interface Command {
  /** Shown in tab completion. Hidden commands still run when typed. */
  hidden?: boolean;
  /** Candidates for completing the first argument. */
  complete?(shell: Shell): string[];
  run(args: string[], shell: Shell): void | Promise<void>;
}

const DIRECTORIES = ['projects', 'writeups'];

/** "./projects/" and "~/projects" both mean "projects". */
function cleanPath(path: string): string {
  return path.replace(/^(\.\/|~\/|\/)+/, '').replace(/\/+$/, '');
}

function fromTemplate(key: string): Command['run'] {
  return (_args, shell) => {
    shell.printTemplate(`template[data-out="${key}"]`);
  };
}

function fromFile(file: string): Command['run'] {
  return (_args, shell) => {
    shell.printTemplate(`template[data-file="${file}"]`);
  };
}

export const commands: Record<string, Command> = {
  help: { run: fromTemplate('help') },

  // Portfolio
  whoami: { run: fromTemplate('whoami') },
  about: { run: fromFile('about.txt') },
  focus: { run: fromFile('focus.txt') },
  projects: { run: fromTemplate('projects') },
  writeups: { run: fromTemplate('writeups') },
  contact: { run: fromTemplate('contact') },

  open: {
    complete: (shell) => Object.keys(shell.links),
    run(args, shell) {
      // Accept "open projects/name.md" as well as "open name".
      const id = cleanPath(args[0] ?? '')
        .replace(/^projects\//, '')
        .replace(/\.md$/, '');
      if (!id) {
        shell.print('usage: open <id>   (run projects for the ids)');
        return;
      }
      const entry = Object.hasOwn(shell.links, id) ? shell.links[id] : undefined;
      if (!entry) {
        shell.print(`open: ${args[0]}: no such project. Run projects for the ids.`, 'term-error');
      } else if (!entry.href) {
        shell.print(`${entry.title} has no live link.`);
      } else {
        shell.print(`Opening ${entry.title}: ${entry.href}`, 'term-dim');
        shell.open(entry.href);
      }
    },
  },

  // This site
  headers: { run: fromTemplate('headers') },

  cd: {
    complete: (shell) => Object.keys(shell.sections).filter((name) => name !== '~'),
    run(args, shell) {
      const name = cleanPath(args[0] ?? '') || '~';
      const href = shell.sections[name === '..' || name === '.' ? '~' : name];
      if (!href) {
        const known = Object.keys(shell.sections).filter((key) => key !== '~');
        shell.print(`cd: ${args[0]}: no such section. Try: ${known.join(', ')}`, 'term-error');
        return;
      }
      shell.print(`Opening ${href}`, 'term-dim');
      shell.navigate(href);
    },
  },

  submit: {
    async run(args, shell) {
      shell.print(await submitFlag(args.join(' ')));
    },
  },

  // Phase 2: the "break my assistant" challenge. Replace this stub with a
  // call to a single server endpoint (src/pages/api/chat.ts, with
  // `export const prerender = false`). Commands may return a promise, so
  // the fetch can be awaited here and its reply passed to shell.print().
  chat: { run: fromTemplate('chat') },

  // Shell
  ls: {
    complete: () => DIRECTORIES.map((dir) => `${dir}/`),
    run(args, shell) {
      const flags = args.filter((arg) => arg.startsWith('-')).join('');
      const target = cleanPath(args.find((arg) => !arg.startsWith('-')) ?? '');

      if (target === '' || target === '.' || target === '~') {
        shell.printTemplate(`template[data-out="ls:${/a/i.test(flags) ? '-a' : ''}"]`);
      } else if (DIRECTORIES.includes(target)) {
        shell.printTemplate(`template[data-out="ls:${target}"]`);
      } else if (shell.files.includes(target)) {
        shell.print(target);
      } else {
        shell.print(`ls: ${target}: no such file or directory`, 'term-error');
      }
    },
  },

  cat: {
    complete: (shell) => shell.files,
    run(args, shell) {
      if (args.length === 0) {
        shell.print('usage: cat <file>   (try: cat about.txt)');
        return;
      }
      for (const arg of args) {
        const path = cleanPath(arg);
        if (path === '.notes') {
          shell.print(notesFlag());
        } else if (DIRECTORIES.includes(path)) {
          shell.print(`cat: ${path}: is a directory (try: ls ${path}/)`, 'term-error');
        } else {
          // Allow "cat projects/name" without the extension.
          const file = [path, `${path}.md`, `${path}.txt`].find((name) => shell.files.includes(name));
          if (file) shell.printTemplate(`template[data-file="${CSS.escape(file)}"]`);
          else shell.print(`cat: ${arg}: no such file`, 'term-error');
        }
      }
    },
  },

  theme: {
    complete: () => [...PHOSPHORS],
    run(args, shell) {
      const choice = args[0]?.toLowerCase();
      if (choice === undefined) nextPhosphor();
      else if (isPhosphor(choice)) setPhosphor(choice);
      else {
        shell.print(`usage: theme [${PHOSPHORS.join('|')}]`);
        return;
      }
      shell.print(`Phosphor set to ${getPhosphor()}. It will be remembered on this device.`);
    },
  },

  crt: {
    complete: () => ['on', 'off'],
    run(args, shell) {
      const choice = args[0]?.toLowerCase();
      if (choice === 'on' || choice === 'off') setCrt(choice === 'on');
      else if (choice === undefined) setCrt(!getCrt());
      else {
        shell.print('usage: crt [on|off]');
        return;
      }
      shell.print(`Scanlines and glow are ${getCrt() ? 'on' : 'off'}.`);
    },
  },

  banner: { run: fromTemplate('banner') },

  history: {
    run(_args, shell) {
      shell.history.forEach((line, i) => shell.print(`${String(i + 1).padStart(3)}  ${line}`));
    },
  },

  clear: {
    run(_args, shell) {
      shell.clear();
    },
  },

  exit: {
    run(_args, shell) {
      shell.print('Back to the main site.', 'term-dim');
      shell.navigate('/');
    },
  },

  // Not listed by `help`.
  echo: {
    hidden: true,
    run(args, shell) {
      shell.print(args.join(' '));
    },
  },
  pwd: {
    hidden: true,
    run(_args, shell) {
      shell.print('/home/visitor');
    },
  },
  sudo: {
    hidden: true,
    run(_args, shell) {
      shell.print('visitor is not in the sudoers file.');
    },
  },
};

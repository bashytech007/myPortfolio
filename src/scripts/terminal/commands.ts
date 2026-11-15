import { getTheme, setTheme, toggleTheme } from '../theme';
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
  /** Paths `cat` can print, for example "about.txt" or "projects/x.md". */
  files: string[];
  /** Names `cd` accepts, mapped to where they go. */
  sections: Record<string, string>;
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

export const commands: Record<string, Command> = {
  help: { run: fromTemplate('help') },
  whoami: { run: fromTemplate('whoami') },
  projects: { run: fromTemplate('projects') },
  writeups: { run: fromTemplate('writeups') },
  contact: { run: fromTemplate('contact') },

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

  theme: {
    complete: () => ['dark', 'light'],
    run(args, shell) {
      const choice = args[0]?.toLowerCase();
      if (choice === 'dark' || choice === 'light') setTheme(choice);
      else if (choice === undefined) toggleTheme();
      else {
        shell.print('usage: theme [dark|light]');
        return;
      }
      shell.print(`Theme set to ${getTheme()}. It will be remembered on this device.`);
    },
  },

  clear: {
    run(_args, shell) {
      shell.clear();
    },
  },

  // Phase 2: the "break my assistant" challenge. Replace this stub with a
  // call to a single server endpoint (src/pages/api/chat.ts, with
  // `export const prerender = false`). Commands may return a promise, so
  // the fetch can be awaited here and its reply passed to shell.print().
  chat: { run: fromTemplate('chat') },

  submit: {
    async run(args, shell) {
      shell.print(await submitFlag(args.join(' ')));
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
  history: {
    hidden: true,
    run(_args, shell) {
      shell.history.forEach((line, i) => shell.print(`${String(i + 1).padStart(3)}  ${line}`));
    },
  },
  sudo: {
    hidden: true,
    run(_args, shell) {
      shell.print('visitor is not in the sudoers file.');
    },
  },
  exit: {
    hidden: true,
    run(_args, shell) {
      shell.print('Nothing to exit. Close the tab when you are done.');
    },
  },
};

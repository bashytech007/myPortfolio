import { commands, type Shell } from './commands';

export interface Completion {
  /** The input after completing as far as is unambiguous. */
  value: string;
  /** Every candidate, when there is more than one. */
  options: string[];
}

function commonPrefix(words: string[]): string {
  let prefix = words[0] ?? '';
  for (const word of words) {
    while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

/** Tab completion for command names and for each command's first argument. */
export function complete(value: string, shell: Shell): Completion {
  const text = value.replace(/^\s+/, '');
  const parts = text.split(/\s+/);
  const name = (parts[0] ?? '').toLowerCase();

  let candidates: string[];
  let head: string;
  let partial: string;

  if (parts.length <= 1) {
    candidates = Object.keys(commands).filter((key) => !commands[key]?.hidden);
    head = '';
    partial = name;
  } else {
    const command = Object.hasOwn(commands, name) ? commands[name] : undefined;
    candidates = command?.complete?.(shell) ?? [];
    head = `${parts.slice(0, -1).join(' ')} `;
    partial = parts.at(-1) ?? '';
  }

  const matches = candidates.filter((candidate) => candidate.startsWith(partial)).sort();
  if (matches.length === 0) return { value, options: [] };

  if (matches.length === 1) {
    const only = matches[0] ?? '';
    // A directory can be completed further, so it gets no trailing space.
    return { value: `${head}${only}${only.endsWith('/') ? '' : ' '}`, options: [] };
  }

  return { value: `${head}${commonPrefix(matches)}`, options: matches };
}

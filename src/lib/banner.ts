/**
 * Draws a name as dot-matrix capitals for the terminal banner. Built as one
 * SVG path at build time, so it needs no font and scales to any width.
 */

// 5 rows per letter. "#" is a lit dot.
const GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#####', '#...#', '#...#'],
  B: ['####.', '#...#', '####.', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '####.', '#....', '#####'],
  F: ['#####', '#....', '####.', '#....', '#....'],
  G: ['.####', '#....', '#..##', '#...#', '.####'],
  H: ['#...#', '#...#', '#####', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '###..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '####.', '#....', '#....'],
  Q: ['.###.', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '####.', '#..#.', '#...#'],
  S: ['.####', '#....', '.###.', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
  Z: ['#####', '...#.', '..#..', '.#...', '#####'],
};

const ROWS = 5;
const LETTER_GAP = 1;
const LINE_GAP = 2;
/** Each dot is a little smaller than its cell, so the dots read as dots. */
const DOT = 0.82;

export interface Banner {
  /** Size in cells, for the SVG viewBox. */
  width: number;
  height: number;
  /** Path data for every lit dot. */
  path: string;
}

/**
 * One line per word. Returns null if the text has a character the font does
 * not cover, so the caller can fall back to plain text.
 */
export function drawBanner(text: string): Banner | null {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const inset = (1 - DOT) / 2;
  const parts: string[] = [];
  let width = 0;

  for (const [line, word] of words.entries()) {
    let x = 0;
    for (const char of word) {
      const glyph = GLYPHS[char];
      if (!glyph) return null;
      for (const [row, bits] of glyph.entries()) {
        for (const [col, bit] of [...bits].entries()) {
          if (bit !== '#') continue;
          const px = (x + col + inset).toFixed(2);
          const py = (line * (ROWS + LINE_GAP) + row + inset).toFixed(2);
          parts.push(`M${px} ${py}h${DOT}v${DOT}h-${DOT}z`);
        }
      }
      x += (glyph[0]?.length ?? 0) + LETTER_GAP;
    }
    width = Math.max(width, x - LETTER_GAP);
  }

  return {
    width,
    height: words.length * ROWS + (words.length - 1) * LINE_GAP,
    path: parts.join(''),
  };
}

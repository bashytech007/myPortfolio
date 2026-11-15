/**
 * Phase 1 flag hunt. Checking is client-side only: a submitted flag is hashed
 * in the browser and compared with these SHA-256 digests. Nothing is sent
 * anywhere, and nothing here is a secret worth protecting.
 *
 *   robots  lives in /robots.txt
 *   header  is sent as a response header (see vercel.json)
 *   notes   is printed by a terminal command that `help` does not list
 *
 * scripts/verify-build.mjs checks that these digests match the flags the
 * site actually serves.
 */
const DIGESTS: Record<string, string> = {
  robots: 'b0622df41c729006c1b125524e8b0c81029f7994fd3f6f82a73b80978b264d29',
  header: '07b9b3fddd859ed9c52cdb761ed5ce75924c9ca4591e0c2e8c7b12791c226e2d',
  notes: '9f1080ce1be8af7e702afd7c07c67f5854863a50abef1840ebbbb84ea5d8c6d1',
};

const TOTAL = Object.keys(DIGESTS).length;
const STORAGE_KEY = 'flags';

/** The `notes` flag, encoded only so it does not show up in a plain search. */
export function notesFlag(): string {
  return atob('RkxBR3tsc19kNHNoX2Ffc2gwd3NfbTByZX0=');
}

function found(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string' && id in DIGESTS) : [];
  } catch {
    return [];
  }
}

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Check a submitted flag and return the line to print. */
export async function submitFlag(input: string): Promise<string> {
  const candidate = input.trim();
  if (!candidate) return 'usage: submit FLAG{...}';
  if (!globalThis.crypto?.subtle) return 'Flags can only be checked over HTTPS.';

  const digest = await sha256(candidate);
  const id = Object.keys(DIGESTS).find((key) => DIGESTS[key] === digest);
  if (!id) return 'Not a flag. Keep looking.';

  const have = found();
  const isNew = !have.includes(id);
  if (isNew) {
    have.push(id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(have));
    } catch {
      // Progress is not saved when storage is blocked.
    }
  }

  const progress = `${have.length} of ${TOTAL} found`;
  if (have.length === TOTAL) return `Correct. That is all ${TOTAL}. Tell me how you found them.`;
  return isNew ? `Correct. ${progress}.` : `You already have that one. ${progress}.`;
}

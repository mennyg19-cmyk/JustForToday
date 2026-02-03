/**
 * Checks if a new gratitude entry is similar to any past entry.
 * Uses a free word-overlap heuristic (no API key required). Catches duplicates and
 * near-duplicates like "my family" vs "grateful for my family".
 */

export interface MatchingEntry {
  id: string;
  text: string;
  createdAt: string;
}

export interface SimilarityResult {
  similar: boolean;
  matchingText?: string;
  matchingEntry?: MatchingEntry;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'be', 'for', 'i', 'im', 'is', 'it', 'me', 'my', 'of', 'the', 'to', 'was',
]);

/** Tokenize into significant words (no stop words, min length 2). */
function tokenize(s: string): string[] {
  const n = normalize(s);
  return n
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

/**
 * Word-overlap similarity: if most of the shorter phrase's words appear in the longer,
 * treat as similar. Catches "my family" vs "grateful for my family" and exact duplicates.
 */
function wordOverlapSimilarity(
  newText: string,
  pastEntries: { text: string; id: string; createdAt: string }[]
): SimilarityResult {
  const trimmed = newText.trim();
  const nNew = normalize(trimmed);

  for (const entry of pastEntries) {
    const p = entry.text?.trim() ?? '';
    if (!p) continue;

    // Exact match (case-insensitive, normalized whitespace) — always treat as duplicate
    const nPast = normalize(p);
    if (nNew === nPast) {
      return {
        similar: true,
        matchingText: entry.text,
        matchingEntry: {
          id: entry.id,
          text: entry.text,
          createdAt: entry.createdAt,
        },
      };
    }
    // One phrase contains the other (e.g. "my family" vs "grateful for my family")
    if (nNew.includes(nPast) || nPast.includes(nNew)) {
      return {
        similar: true,
        matchingText: entry.text,
        matchingEntry: {
          id: entry.id,
          text: entry.text,
          createdAt: entry.createdAt,
        },
      };
    }

    const newWords = tokenize(trimmed);
    if (newWords.length === 0) continue;
    const pastWords = tokenize(p);
    if (pastWords.length === 0) continue;

    const setA = new Set(newWords);
    const setB = new Set(pastWords);
    const intersection = [...setA].filter((w) => setB.has(w));
    const minLen = Math.min(setA.size, setB.size);

    // Same or almost same words (word-overlap)
    if (minLen >= 1 && intersection.length / minLen >= 0.7) {
      return {
        similar: true,
        matchingText: entry.text,
        matchingEntry: {
          id: entry.id,
          text: entry.text,
          createdAt: entry.createdAt,
        },
      };
    }
  }

  return { similar: false };
}

/**
 * Returns whether the new gratitude text is similar to any past entry.
 * Uses word-overlap only (no API, no key, works offline).
 * pastEntries must include id and createdAt so we can show the date and offer "Edit existing".
 */
export async function checkSimilarGratitude(
  newText: string,
  pastEntries: { text: string; id: string; createdAt: string }[]
): Promise<SimilarityResult> {
  const trimmed = newText.trim();
  if (!trimmed) return { similar: false };

  const withMeta = pastEntries.filter((e) => e.text?.trim());
  if (withMeta.length === 0) return { similar: false };

  return wordOverlapSimilarity(trimmed, withMeta);
}

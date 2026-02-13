/** Shared commitment logic — single source of truth for check-in state. */

import type { DailyCheckIn, CommitmentType } from '@/lib/database/schema';

// Re-exported so consumers don't need to import from two places
export type { DailyCheckIn, CommitmentType };

// Duration constants (ms)
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

/** Duration in ms for commitment type, or null for 'none'. */
export function commitmentDurationMs(type: CommitmentType): number | null {
  switch (type) {
    case '24h':
      return TWENTY_FOUR_HOURS_MS;
    case '12h':
      return TWELVE_HOURS_MS;
    case 'none':
      return null;
  }
}

/**
 * How many ms remain on a commitment, or null if no timed commitment.
 * Returns 0 if the commitment has expired.
 */
export function getCommitmentRemainingMs(checkIn: DailyCheckIn): number | null {
  const durationMs = commitmentDurationMs(checkIn.commitmentType);
  if (durationMs == null) return null;

  const startMs = new Date(checkIn.createdAt).getTime();
  const endMs = startMs + durationMs;
  const remaining = endMs - Date.now();
  return Math.max(0, remaining);
}

/**
 * Is the commitment still active (not expired)?
 */
export function isCommitmentActive(checkIn: DailyCheckIn): boolean {
  const remaining = getCommitmentRemainingMs(checkIn);
  if (remaining == null) return false; // 'none' has no active state
  return remaining > 0;
}

/**
 * Build a TODO string from one or more challenge/plan pairs.
 * Accepts either a single pair (legacy) or an array of pairs.
 * Keeps it short and personal — no formatting, no AI embellishment.
 */
export function buildTodoText(
  challenge: string | Array<{ challenge: string; plan: string }>,
  plan?: string
): string {
  // Normalize to an array of pairs
  const pairs: Array<{ challenge: string; plan: string }> =
    typeof challenge === 'string'
      ? [{ challenge, plan: plan ?? '' }]
      : challenge;

  const lines = pairs
    .map(({ challenge: c, plan: p }) => {
      const ct = c.trim();
      const pt = p.trim();
      if (!ct && !pt) return '';
      if (ct && pt) return `If "${ct}" comes up — ${pt}`;
      if (ct) return `Watch for: ${ct}`;
      return pt;
    })
    .filter(Boolean);

  return lines.join('\n');
}

/** Human-readable commitment label. */
export function commitmentLabel(type: CommitmentType): string {
  switch (type) {
    case '24h':
      return '24-hour commitment';
    case '12h':
      return '12-hour commitment';
    case 'none':
      return 'No commitment';
  }
}

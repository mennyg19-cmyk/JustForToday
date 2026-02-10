/**
 * Rotating encouragement messages — calm, short, non-repetitive.
 *
 * Used after check-in, after inventory, during hard moments, and on
 * the home screen. Never preachy. Never motivational. Think: a steady
 * companion, not a coach.
 *
 * Selection is deterministic per day+context so the same message appears
 * all day for a given context, but different contexts show different messages.
 *
 * If the user has set a name in their profile, some messages use it
 * for a more personal touch without being excessive.
 *
 * Relied on by: CheckInFlow, HardMomentScreen, home screen (index.tsx),
 * InventoryScreen. If you duplicate this logic, messages will drift out of sync.
 */

export type EncouragementContext =
  | 'afterCheckIn'
  | 'afterInventory'
  | 'hardMoment'
  | 'home'
  | 'returnAfterAbsence'
  | 'noCommitment';

/**
 * Base messages — {name} is replaced with the user's first name if available,
 * or removed if not.
 */
const MESSAGES: Record<EncouragementContext, string[]> = {
  afterCheckIn: [
    'Just today.',
    'No rush.',
    "You're still here.",
    'One day. That is enough.',
    'You showed up. That counts.',
    'Quietly forward.',
    'Today is yours, {name}.',
    'Steady.',
  ],
  afterInventory: [
    'Thank you for being honest today.',
    'That took courage.',
    'Honesty is its own reward.',
    'This is the work.',
    'You looked at yourself honestly. That matters.',
    'Not easy. But real.',
  ],
  hardMoment: [
    'This will pass.',
    "You don't have to figure it all out right now.",
    'Breathe.',
    "You're not alone in this.",
    'Stay here for a moment.',
    "It's okay to feel this.",
    'One breath at a time.',
    'You can get through this moment, {name}.',
    "Right now is all you need to handle.",
    'Be gentle with yourself.',
  ],
  home: [
    'You came back. That matters.',
    'One moment at a time.',
    "You're here. That's enough.",
    'Glad you showed up, {name}.',
    'Quietly present.',
    'Still going.',
  ],
  returnAfterAbsence: [
    "You're still welcome here.",
    'Coming back is what counts.',
    'No judgment. Just glad you returned.',
    'Welcome back, {name}.',
    "Absence doesn\u2019t erase anything. You\u2019re here now.",
  ],
  noCommitment: [
    "You're still welcome here. Let's stay present together.",
    'No commitment needed. You showed up.',
    "That's okay. Being here is what matters.",
    'Just being here counts.',
  ],
};

/**
 * Simple numeric hash of a string — used to pick a message deterministically.
 * Same date + same context = same message all day.
 */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Replace {name} placeholder with the user's first name, or clean it up
 * if no name is provided (removes trailing ", {name}" or leading "{name}, " etc).
 */
function personalize(message: string, name?: string): string {
  if (name && name.trim()) {
    return message.replace('{name}', name.trim());
  }
  // Remove the placeholder and any awkward trailing/leading comma+space
  return message
    .replace(', {name}', '')
    .replace('{name}, ', '')
    .replace('{name}', '');
}

/**
 * Get a single encouragement message for the given context.
 * Deterministic per calendar day so the user sees the same message
 * throughout the day, but it rotates daily.
 *
 * Pass the user's name to personalize messages that include {name}.
 */
export function getEncouragement(
  context: EncouragementContext,
  date: Date = new Date(),
  name?: string
): string {
  const pool = MESSAGES[context];
  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const idx = hashString(dateKey + context) % pool.length;
  return personalize(pool[idx], name);
}

// ---------------------------------------------------------------------------
// Commitment-aware encouragement for the Hard Moment screen
// ---------------------------------------------------------------------------

/**
 * Build a commitment-aware encouragement string.
 * @param remainingMs  Milliseconds remaining in the commitment, or null/0.
 * @param name         User's first name for personalization.
 * @param rotatingIdx  Index into the hardMoment pool for the rotating suffix.
 */
export function getCommitmentEncouragement(
  remainingMs: number | null,
  name?: string,
  rotatingIdx?: number
): string {
  const pool = MESSAGES.hardMoment;
  const idx = rotatingIdx ?? 0;
  const rotating = personalize(pool[idx % pool.length], name);

  if (remainingMs == null || remainingMs <= 0) {
    // No active commitment — just return the rotating message
    return rotating;
  }

  const totalMin = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  const timeStr =
    hours > 0
      ? `${hours} hour${hours === 1 ? '' : 's'}${minutes > 0 ? ` and ${minutes} minute${minutes === 1 ? '' : 's'}` : ''}`
      : `${minutes} minute${minutes === 1 ? '' : 's'}`;

  let prefix: string;
  if (hours >= 6) {
    prefix = `You've got ${timeStr} left. That's a long stretch \u2014 maybe break it down into smaller chunks? Check back here in an hour.`;
  } else if (hours >= 2) {
    prefix = `You've got ${timeStr} to go. You're making real progress.`;
  } else {
    prefix = `Only ${timeStr} left. You're almost there \u2014 you can do this.`;
  }

  return `${prefix}\n\n${rotating}`;
}

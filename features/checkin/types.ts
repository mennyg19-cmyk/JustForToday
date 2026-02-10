import type { CommitmentType } from '@/lib/database/schema';

/** A single challenge/plan pair used in the reflection step. */
export interface ChallengePair {
  challenge: string;
  plan: string;
}

/**
 * Per-counter commitment details saved to AsyncStorage.
 * Shared by the home-screen card and the Daily Renewal screen.
 */
export interface CommittedCounterInfo {
  id: string;
  name: string;
  duration: CommitmentType;
}

/** AsyncStorage key prefix for committed counter names. */
export const COMMITTED_KEY_PREFIX = 'lifetrack_committed_';

/** AsyncStorage key for draft challenge/plan pairs. */
export const DRAFT_KEY_PAIRS = 'lifetrack_checkin_draft_pairs';

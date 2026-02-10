import type { InventoryEntry } from '@/lib/database/schema';
import type { MorningInventoryData } from './types';

/** Default empty inventory payload for creating new entries. */
export const emptyPayload = (type: string): Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  type,
  who: '',
  whatHappened: '',
  affects: [],
  defects: [],
  assets: [],
  seventhStepPrayer: '',
  prayed: false,
  amendsNeeded: false,
  amendsTo: '',
  helpWho: '',
  shareWith: '',
  notes: undefined,
});

/** Parse a morning inventory's JSON notes, handling legacy plain-string format. */
export function parseMorningNotes(notes: string | undefined): MorningInventoryData {
  if (!notes?.trim()) return {};
  try {
    const parsed = JSON.parse(notes) as MorningInventoryData;
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {
    // Legacy: plain string stored as askFor
  }
  return { askFor: notes };
}

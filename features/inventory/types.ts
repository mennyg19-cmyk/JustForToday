import type { InventoryEntry as SchemaInventoryEntry } from '@/lib/database/schema';

export type InventoryType = 'morning' | 'nightly' | 'step10';

export type InventoryEntry = SchemaInventoryEntry;

/** Payload for creating/updating any inventory entry. Step10 uses full fields; morning/nightly use notes. */
export type InventoryEntryPayload = Omit<
  SchemaInventoryEntry,
  'id' | 'createdAt' | 'updatedAt'
>;

/** Morning inventory state stored in entry.notes as JSON when type is 'morning'. */
export interface MorningInventoryData {
  plans?: string;
  askFor?: string;
}

/** Nightly inventory state stored in entry.notes as JSON when type is 'nightly'. */
export interface NightlyInventoryData {
  resentful?: boolean | null;
  resentfulDetails?: string;
  selfish?: boolean | null;
  selfishDetails?: string;
  dishonest?: boolean | null;
  dishonestDetails?: string;
  owingApology?: boolean | null;
  owingApologyDetails?: string;
  keptSecret?: boolean | null;
  keptSecretDetails?: string;
  kindLoving?: boolean | null;
  kindLovingDetails?: string;
}

/** Trusted contacts for Hard Moment (SQLite + AsyncStorage fallback). */

import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type { TrustedContact, TrustedContactRow } from '@/lib/database/schema';
import * as asyncContacts from '@/lib/database/asyncFallback/contacts';
import { triggerSync } from '@/lib/sync';

function rowToContact(row: TrustedContactRow): TrustedContact {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    phone: row.phone,
  };
}

export async function getTrustedContacts(): Promise<TrustedContact[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncContacts.getTrustedContactsAsync();
  }

  const db = await getDatabase();
  const rows = await db.getAllAsync<TrustedContactRow>(
    'SELECT * FROM trusted_contacts ORDER BY order_index ASC'
  );
  return rows.map(rowToContact);
}

export async function saveTrustedContact(contact: TrustedContact): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncContacts.saveTrustedContactAsync(contact);
    return;
  }

  const db = await getDatabase();

  // Determine order_index for new contacts (append to end)
  const maxRow = await db.getFirstAsync<{ max_idx: number | null }>(
    'SELECT MAX(order_index) as max_idx FROM trusted_contacts'
  );
  const nextIndex = (maxRow?.max_idx ?? -1) + 1;

  await db.runAsync(
    `INSERT OR REPLACE INTO trusted_contacts (id, name, label, phone, order_index)
     VALUES (?, ?, ?, ?, COALESCE(
       (SELECT order_index FROM trusted_contacts WHERE id = ?),
       ?
     ))`,
    [contact.id, contact.name, contact.label, contact.phone, contact.id, nextIndex]
  );
  triggerSync();
}

export async function deleteTrustedContact(id: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncContacts.deleteTrustedContactAsync(id);
    return;
  }

  const db = await getDatabase();
  await db.runAsync('DELETE FROM trusted_contacts WHERE id = ?', [id]);
  triggerSync();
}

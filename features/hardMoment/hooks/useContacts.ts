/**
 * Hook for managing the trusted contacts list.
 *
 * Contacts are picked from the device phonebook via expo-contacts,
 * stored locally, and displayed only inside Hard Moment mode.
 * Max 5 contacts to keep the list focused and fast.
 */

import { useState, useCallback, useEffect } from 'react';
import type { TrustedContact } from '@/lib/database/schema';
import {
  getTrustedContacts,
  saveTrustedContact,
  deleteTrustedContact,
} from '../database';

const MAX_CONTACTS = 5;

export function useContacts() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getTrustedContacts();
      setContacts(list);
    } catch (err) {
      console.error('Failed to load trusted contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Whether the user can still add more contacts. */
  const canAddMore = contacts.length < MAX_CONTACTS;

  /** Add a new trusted contact (returns false if at limit). */
  const addContact = useCallback(
    async (contact: TrustedContact): Promise<boolean> => {
      if (contacts.length >= MAX_CONTACTS) return false;

      await saveTrustedContact(contact);
      setContacts((prev) => [...prev, contact]);
      return true;
    },
    [contacts.length]
  );

  /** Remove a contact by ID. */
  const removeContact = useCallback(async (id: string) => {
    await deleteTrustedContact(id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    contacts,
    loading,
    canAddMore,
    refresh,
    addContact,
    removeContact,
  };
}

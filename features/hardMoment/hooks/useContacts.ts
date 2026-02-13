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
import { logger } from '@/lib/logger';

const MAX_CONTACTS = 5;

export function useContacts() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await getTrustedContacts();
      setContacts(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load contacts';
      setError(msg);
      logger.error('Failed to load trusted contacts:', err);
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

      try {
        await saveTrustedContact(contact);
        // Only update local state after successful persist
        setContacts((prev) => [...prev, contact]);
        return true;
      } catch (err) {
        logger.error('Failed to save trusted contact:', err);
        return false;
      }
    },
    [contacts.length]
  );

  /** Remove a contact by ID. */
  const removeContact = useCallback(async (id: string) => {
    try {
      await deleteTrustedContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      logger.error('Failed to delete trusted contact:', err);
    }
  }, []);

  return {
    contacts,
    loading,
    error,
    canAddMore,
    refresh,
    addContact,
    removeContact,
  };
}

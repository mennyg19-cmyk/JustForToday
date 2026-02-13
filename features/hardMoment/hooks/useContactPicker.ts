/**
 * Shared hook for the contact-picking + label-selection flow.
 *
 * Used by both the Hard Moment screen and Settings screen so the
 * "add trusted contact" behavior is identical everywhere.
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import type { TrustedContact } from '@/lib/database/schema';
import { logger } from '@/lib/logger';

interface UseContactPickerOptions {
  contacts: TrustedContact[];
  addContact: (contact: TrustedContact) => Promise<boolean>;
}

export function useContactPicker({ contacts, addContact }: UseContactPickerOptions) {
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [pendingContact, setPendingContact] = useState<{ name: string; phone: string } | null>(null);
  const [picking, setPicking] = useState(false);

  // Show the label modal after the contact picker closes
  useEffect(() => {
    if (!pendingContact || showLabelModal) return;
    const timer = setTimeout(() => setShowLabelModal(true), 500);
    return () => clearTimeout(timer);
  }, [pendingContact, showLabelModal]);

  /** Open the device contact picker. */
  const pickContact = useCallback(async () => {
    if (picking) return; // prevent re-entry
    setPicking(true);
    try {
      const Contacts = await import('expo-contacts');

      if (Platform.OS !== 'ios') {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Contacts access needed',
            'Allow access in Settings to add a trusted contact.'
          );
          return;
        }
      }

      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;

      const phone = contact.phoneNumbers?.[0]?.number;
      if (!phone) {
        Alert.alert('No phone number', 'This contact doesn\u2019t have a phone number.');
        return;
      }

      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown';

      // Duplicate check
      const cleanPhone = phone.replace(/[^+\d]/g, '');
      const isDuplicate = contacts.some(
        (c) => c.phone.replace(/[^+\d]/g, '') === cleanPhone
      );
      if (isDuplicate) {
        Alert.alert('Already Added', `${name} is already in your trusted contacts.`);
        return;
      }

      setPendingContact({ name, phone });
    } catch (err) {
      logger.error('Contact picker error:', err);
      Alert.alert('Error', 'Could not open contacts.');
    } finally {
      setPicking(false);
    }
  }, [contacts, picking]);

  /** Save the pending contact with the chosen label. */
  const saveWithLabel = useCallback(
    async (label: string) => {
      if (!pendingContact) return;

      const contact: TrustedContact = {
        id: `contact_${Date.now()}`,
        name: pendingContact.name,
        label,
        phone: pendingContact.phone,
      };

      const saved = await addContact(contact);
      if (!saved) {
        Alert.alert('Could Not Save', 'Failed to save this contact. You may have reached the maximum of 5.');
      }
      setPendingContact(null);
      setShowLabelModal(false);
    },
    [pendingContact, addContact]
  );

  /** Cancel the label selection. */
  const cancelLabel = useCallback(() => {
    setShowLabelModal(false);
    setPendingContact(null);
  }, []);

  return {
    showLabelModal,
    pendingContactName: pendingContact?.name ?? '',
    pickContact,
    saveWithLabel,
    cancelLabel,
  };
}

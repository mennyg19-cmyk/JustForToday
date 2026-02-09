/**
 * TrustedContacts — the "Call someone" section of Hard Moment mode.
 *
 * Shows the user's saved contacts as tappable cards. Tapping a card
 * immediately initiates a phone call via the system dialer. No logging,
 * no tracking, no friction.
 *
 * Adding a contact opens the device contact picker (expo-contacts).
 * The user assigns a label (Sponsor, Friend, Family, or custom text).
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { Phone, UserPlus, X } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { useContacts } from '../hooks/useContacts';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalButtonRow, ModalButton } from '@/components/ModalContent';
import type { TrustedContact } from '@/lib/database/schema';

// Pre-defined label suggestions (user can also type custom)
const LABEL_SUGGESTIONS = ['Sponsor', 'Friend', 'Family', 'Therapist', 'Other'];

export function TrustedContacts() {
  const { contacts, canAddMore, addContact, removeContact } = useContacts();
  const iconColors = useIconColors();
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [pendingContact, setPendingContact] = useState<{ name: string; phone: string } | null>(null);

  /** Open the device contact picker, then show a label selection modal. */
  const handleAddContact = useCallback(async () => {
    try {
      // Dynamically import expo-contacts to avoid crash if not installed yet
      const Contacts = await import('expo-contacts');

      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Contacts access needed',
          'To add a trusted contact, allow access to your contacts in Settings.'
        );
        return;
      }

      // Open the system contact picker
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return; // user cancelled

      // Extract the first phone number
      const phone = contact.phoneNumbers?.[0]?.number;
      if (!phone) {
        Alert.alert('No phone number', 'This contact doesn\u2019t have a phone number.');
        return;
      }

      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown';
      setPendingContact({ name, phone });
      setShowLabelModal(true);
    } catch (err) {
      console.error('Contact picker error:', err);
      Alert.alert('Error', 'Could not open contacts. Make sure expo-contacts is installed.');
    }
  }, []);

  /** Save the pending contact with the chosen label. */
  const handleSaveWithLabel = useCallback(
    async (label: string) => {
      if (!pendingContact) return;

      const contact: TrustedContact = {
        id: `contact_${Date.now()}`,
        name: pendingContact.name,
        label,
        phone: pendingContact.phone,
      };

      await addContact(contact);
      setPendingContact(null);
      setShowLabelModal(false);
    },
    [pendingContact, addContact]
  );

  /** Immediately call this contact — no confirmation, no friction. */
  const handleCall = useCallback((phone: string) => {
    const url = `tel:${phone.replace(/[^+\d]/g, '')}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Cannot call', 'Phone calls are not supported on this device.');
    });
  }, []);

  /** Confirm before removing a contact. */
  const handleRemove = useCallback(
    (contact: TrustedContact) => {
      Alert.alert(
        'Remove contact?',
        `Remove ${contact.name} from your trusted contacts?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeContact(contact.id),
          },
        ]
      );
    },
    [removeContact]
  );

  return (
    <View className="gap-3">
      <Text className="text-foreground font-bold text-lg">
        Call someone
      </Text>

      {contacts.length === 0 && (
        <Text className="text-muted-foreground text-sm">
          Add someone you trust. One tap to call when you need them.
        </Text>
      )}

      {/* Contact cards */}
      {contacts.map((c) => (
        <TouchableOpacity
          key={c.id}
          onPress={() => handleCall(c.phone)}
          onLongPress={() => handleRemove(c)}
          activeOpacity={0.7}
          className="bg-card rounded-xl p-4 border border-border flex-row items-center gap-3"
        >
          <Phone size={20} color={iconColors.primary} />
          <View className="flex-1">
            <Text className="text-foreground font-semibold text-base">
              {c.name}
            </Text>
            {c.label ? (
              <Text className="text-muted-foreground text-sm">{c.label}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => handleRemove(c)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={iconColors.muted} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {/* Add contact button */}
      {canAddMore && (
        <TouchableOpacity
          onPress={handleAddContact}
          className="bg-muted rounded-xl p-4 flex-row items-center justify-center gap-2"
        >
          <UserPlus size={18} color={iconColors.muted} />
          <Text className="text-muted-foreground font-semibold">
            Add trusted contact
          </Text>
        </TouchableOpacity>
      )}

      {/* Label selection modal */}
      <ModalSurface
        visible={showLabelModal}
        onRequestClose={() => setShowLabelModal(false)}
        contentClassName="p-6"
      >
        <Text className="text-lg font-bold text-modal-content-foreground mb-2">
          How do you know {pendingContact?.name}?
        </Text>
        <Text className="text-modal-content-foreground/70 text-sm mb-4">
          This label is just for you.
        </Text>
        <View className="gap-2 mb-4">
          {LABEL_SUGGESTIONS.map((label) => (
            <TouchableOpacity
              key={label}
              onPress={() => handleSaveWithLabel(label)}
              className="bg-muted rounded-xl py-3 px-4"
            >
              <Text className="text-foreground font-semibold text-center">
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ModalButtonRow>
          <ModalButton
            variant="secondary"
            onPress={() => {
              setShowLabelModal(false);
              setPendingContact(null);
            }}
          >
            Cancel
          </ModalButton>
        </ModalButtonRow>
      </ModalSurface>
    </View>
  );
}

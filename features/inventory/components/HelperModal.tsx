import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle } from '@/components/ModalContent';
import type { HelperType } from '../step10Data';
import { HELPER_CONTENT } from '../step10Data';
import { useIconColors } from '@/lib/iconTheme';

interface HelperModalProps {
  visible: boolean;
  onClose: () => void;
  helperType: HelperType;
  /** Currently selected values (e.g. affects, defects, or assets from the form). */
  selectedValues: string[];
  /** Called when user taps an item: add or remove from selection. */
  onSelectItem: (item: string) => void;
}

const TITLES: Record<HelperType, string> = {
  affects: 'Affects my…',
  defects: 'Defects',
  assets: 'Character assets',
};

export function HelperModal({
  visible,
  onClose,
  helperType,
  selectedValues,
  onSelectItem,
}: HelperModalProps) {
  const iconColors = useIconColors();
  const items = HELPER_CONTENT[helperType];
  const isDefects = helperType === 'defects';

  return (
    <ModalSurface visible={visible} onRequestClose={onClose} contentClassName="p-6">
      <View className="flex-row items-center justify-between mb-4">
        <ModalTitle className="mb-0">{TITLES[helperType]}</ModalTitle>
        <TouchableOpacity onPress={onClose} className="px-3 py-2">
          <Text className="text-primary font-semibold">Close</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-sm text-muted-foreground mb-3">
        Tap an item to add or remove it from your inventory.
      </Text>
      <ScrollView className="max-h-96">
        <View className="gap-2">
          {items.map((item) => {
            const selected = selectedValues.includes(item.label);
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => onSelectItem(item.label)}
                activeOpacity={0.7}
                className={`rounded-xl p-4 border-2 ${
                  selected
                    ? isDefects
                      ? 'bg-destructive/20 border-destructive'
                      : 'bg-primary/20 border-primary'
                    : 'bg-muted border-border'
                }`}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Text
                      className={`font-semibold ${selected ? (isDefects ? 'text-destructive' : 'text-primary') : 'text-modal-content-foreground'}`}
                    >
                      {item.label}
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-1">{item.description}</Text>
                  </View>
                  {selected ? (
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${isDefects ? 'bg-destructive' : 'bg-primary'}`}
                    >
                      <Check
                        size={18}
                        color={isDefects ? iconColors.destructiveForeground : iconColors.primaryForeground}
                      />
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </ModalSurface>
  );
}

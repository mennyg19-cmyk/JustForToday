import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';

interface PrivacyLock {
  isLocked: boolean;
  authenticate: (reason?: string) => Promise<boolean>;
}

interface Props {
  title: string;
  emptyMessage: string;
  hasEntries: boolean;
  privacyLock: PrivacyLock;
  iconColors: { muted: string; primaryForeground: string };
  children: React.ReactNode;
}

/** Card wrapper for saved inventory entries with privacy-lock overlay. */
export function SavedSection({ title, emptyMessage, hasEntries, privacyLock, iconColors, children }: Props) {
  return (
    <View className="rounded-2xl p-4 bg-card border border-border mt-4">
      <Text className="text-base font-semibold text-foreground mb-3">{title}</Text>
      {privacyLock.isLocked ? (
        <View className="items-center py-8 gap-3">
          <View className="bg-muted rounded-full p-3">
            <Lock size={24} color={iconColors.muted} />
          </View>
          <Text className="text-muted-foreground text-sm text-center">
            Your saved entries are protected
          </Text>
          <TouchableOpacity
            onPress={() => privacyLock.authenticate('Unlock inventory history')}
            activeOpacity={0.7}
            className="bg-primary rounded-xl px-5 py-2.5"
          >
            <Text className="text-primary-foreground font-semibold text-sm">
              Unlock
            </Text>
          </TouchableOpacity>
        </View>
      ) : !hasEntries ? (
        <Text className="text-sm text-muted-foreground">{emptyMessage}</Text>
      ) : (
        <View className="gap-3">{children}</View>
      )}
    </View>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import {
  User,
  Phone,
  BookOpen,
  BarChart3,
  MessageSquare,
  Lock,
  Shield,
  ChevronRight,
} from 'lucide-react-native';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import type { TrustedContact } from '@/lib/database/schema';
import type { GroundingReading } from '@/lib/groundingReadings';
import type { UserProfile } from '@/lib/settings/database';

const cardClass = 'bg-card rounded-xl p-4 border border-border';

interface Props {
  profile: UserProfile;
  profileSaved: boolean;
  contacts: TrustedContact[];
  readingsList: GroundingReading[];
  privacyLockOn: boolean;
  iconColors: Record<string, string>;
  switchColors: { trackColor: { false: string; true: string }; thumbColor: string };
  onOpenProfile: () => void;
  onOpenContacts: () => void;
  onOpenReadings: () => void;
  onOpenAnalytics: () => void;
  onOpenThoughts: () => void;
  onTogglePrivacyLock: (value: boolean) => void;
}

export function ProfileSection({
  profile,
  profileSaved,
  contacts,
  readingsList,
  privacyLockOn,
  iconColors,
  switchColors,
  onOpenProfile,
  onOpenContacts,
  onOpenReadings,
  onOpenAnalytics,
  onOpenThoughts,
  onTogglePrivacyLock,
}: Props) {
  return (
    <>
      {profileSaved && (
        <Text className="text-primary text-xs mb-2">Profile saved</Text>
      )}
      <CollapsibleSection
        title="Profile"
        subtitle={profile.name ? `${profile.name}${profile.birthday ? ` | ${profile.birthday}` : ''}` : 'Personal info, contacts, readings, analytics'}
        icon={<User size={20} color={iconColors.primary} />}
      >
        <View className="gap-2">
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onOpenProfile}
              activeOpacity={0.7}
              className="flex-1 bg-muted rounded-xl items-center justify-center py-4 px-2"
            >
              <User size={24} color={iconColors.primary} />
              <Text className="text-foreground font-semibold text-xs mt-1.5">Personal Info</Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5" numberOfLines={1}>
                {profile.name || 'Set up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onOpenContacts}
              activeOpacity={0.7}
              className="flex-1 bg-muted rounded-xl items-center justify-center py-4 px-2"
            >
              <Phone size={24} color={iconColors.primary} />
              <Text className="text-foreground font-semibold text-xs mt-1.5">Contacts</Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">
                {contacts.length > 0 ? `${contacts.length} saved` : 'Add people'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onOpenReadings}
              activeOpacity={0.7}
              className="flex-1 bg-muted rounded-xl items-center justify-center py-4 px-2"
            >
              <BookOpen size={24} color={iconColors.primary} />
              <Text className="text-foreground font-semibold text-xs mt-1.5 text-center">Readings</Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">
                {readingsList.filter((r) => r.visible).length} visible
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onOpenAnalytics}
              activeOpacity={0.7}
              className="flex-1 bg-muted rounded-xl items-center justify-center py-4 px-2"
            >
              <BarChart3 size={24} color={iconColors.primary} />
              <Text className="text-foreground font-semibold text-xs mt-1.5">Analytics</Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">Trends & heatmaps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy sub-section */}
        <View className="mt-4">
          <Text className="text-sm text-muted-foreground mb-2">Privacy</Text>
          <View className={`${cardClass} gap-3`}>
            <TouchableOpacity
              onPress={onOpenThoughts}
              activeOpacity={0.7}
              className="flex-row items-center gap-3"
            >
              <MessageSquare size={20} color={iconColors.primary} />
              <View className="flex-1">
                <Text className="text-foreground font-medium">Private Thoughts</Text>
                <Text className="text-xs text-muted-foreground">Saved from hard moments</Text>
              </View>
              {privacyLockOn && <Lock size={16} color={iconColors.muted} />}
              <ChevronRight size={18} color={iconColors.muted} />
            </TouchableOpacity>

            <View className="h-px bg-border" />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Shield size={20} color={iconColors.primary} />
                <View className="flex-1">
                  <Text className="text-foreground font-medium">Privacy Lock</Text>
                  <Text className="text-xs text-muted-foreground">Face ID or passcode for history</Text>
                </View>
              </View>
              <Switch
                value={privacyLockOn}
                onValueChange={onTogglePrivacyLock}
                {...switchColors}
              />
            </View>
          </View>
        </View>
      </CollapsibleSection>
    </>
  );
}

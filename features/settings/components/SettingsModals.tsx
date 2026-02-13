import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import {
  CheckCircle,
  Phone,
  UserPlus,
  X,
  Eye,
  EyeOff,
  Plus,
  ChevronRight,
  Trash2,
  MessageSquare,
} from 'lucide-react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalButton, ModalButtonRow } from '@/components/ModalContent';
import { SECTIONS, DEFAULT_GOALS } from '../constants';
import type { TrustedContact, ModuleSettingsMap, ModuleId } from '@/lib/database/schema';
import type { GroundingReading } from '@/lib/groundingReadings';
import type { UserProfile } from '@/lib/settings/database';

interface Props {
  iconColors: Record<string, string>;
  switchColors: { trackColor: { false: string; true: string }; thumbColor: string };

  // Module settings modal
  moduleSettingsModal: { moduleId: (typeof SECTIONS)[number]['id']; label: string } | null;
  moduleSettings: ModuleSettingsMap;
  effectiveGoals: Record<string, number>;
  resetTrackingMessage: boolean;
  onCloseModuleSettings: () => void;
  onResetModuleTrackingStartDate: (id: ModuleId) => Promise<void>;
  onSetResetTrackingMessage: (v: boolean) => void;
  onGoalsChange: (patch: Record<string, number>) => void;
  onPersistGoals: () => void;
  onSetModuleCountInScore: (id: ModuleId, v: boolean) => void;

  // Import confirmation
  confirmImport: boolean;
  onCloseImport: () => void;
  onConfirmImport: () => void;

  // Clear confirmation
  confirmClear: boolean;
  onCloseClear: () => void;
  onClearBackupFirst: () => void;
  onClearConfirm: () => void;

  // Reset defaults confirmation
  confirmResetDefaults: boolean;
  onCloseResetDefaults: () => void;
  onConfirmResetDefaults: () => void;

  // Trusted contacts modal
  showContactsModal: boolean;
  contacts: TrustedContact[];
  canAddMore: boolean;
  onCloseContacts: () => void;
  onAddContact: () => void;
  onRemoveContact: (contact: TrustedContact) => void;

  // Label selection modal
  showLabelModal: boolean;
  pendingContactName: string;
  onCloseLabelModal: () => void;
  onSaveWithLabel: (label: string) => void;

  // Readings modal
  showReadingsModal: boolean;
  readingsList: GroundingReading[];
  showAddReadingForm: boolean;
  newReadingTitle: string;
  newReadingSubtitle: string;
  onCloseReadings: () => void;
  onToggleReadingVisibility: (id: string) => void;
  onOpenReading: (readingId: string) => void;
  onRemoveReading: (reading: GroundingReading) => void;
  onSetShowAddReadingForm: (v: boolean) => void;
  onSetNewReadingTitle: (v: string) => void;
  onSetNewReadingSubtitle: (v: string) => void;
  onAddReading: () => void;

  // Profile modal
  showProfileModal: boolean;
  profile: UserProfile;
  onCloseProfile: () => void;
  onUpdateProfileField: (field: keyof UserProfile, value: string) => void;
  onSaveProfile: () => void;

  // Story modal
  showStoryModal: boolean;
  onCloseStory: () => void;

  // Thoughts modal
  showThoughtsModal: boolean;
  thoughtsList: Array<{ text: string; date: string }>;
  onCloseThoughts: () => void;
  onDeleteThought: (index: number) => void;
}

const LABEL_SUGGESTIONS = ['Sponsor', 'Friend', 'Family', 'Therapist', 'Other'];

/** Goal field mapping for the module settings modal. */
const GOAL_FIELDS: Record<string, { key: string; placeholder: string }> = {
  habits: { key: 'habitsGoal', placeholder: '0 = all' },
  steps: { key: 'stepsGoal', placeholder: String(DEFAULT_GOALS.stepsGoal) },
  workouts: { key: 'workoutsGoal', placeholder: String(DEFAULT_GOALS.workoutsGoal) },
  fasting: { key: 'fastingHoursGoal', placeholder: String(DEFAULT_GOALS.fastingHoursGoal) },
  step11: { key: 'inventoriesPerDayGoal', placeholder: String(DEFAULT_GOALS.inventoriesPerDayGoal) },
  gratitude: { key: 'gratitudesPerDayGoal', placeholder: String(DEFAULT_GOALS.gratitudesPerDayGoal) },
};

export function SettingsModals(props: Props) {
  const { iconColors, switchColors } = props;

  return (
    <>
      {/* Module settings modal */}
      <ModalSurface
        visible={!!props.moduleSettingsModal}
        onRequestClose={props.onCloseModuleSettings}
        contentClassName="p-5 w-[90%] max-w-sm max-h-[85%]"
      >
        {props.moduleSettingsModal && (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text className="text-lg font-bold text-modal-content-foreground mb-3">
              {props.moduleSettingsModal.label}
            </Text>
            <View className="flex-row gap-4 mb-3">
              <View className="flex-1 py-2 border border-border rounded-lg px-3">
                <Text className="text-modal-content-foreground text-xs font-semibold mb-1">Tracking start date</Text>
                <Text className="text-modal-content-foreground/80 text-sm mb-2">
                  {props.moduleSettings[props.moduleSettingsModal.moduleId]?.trackingStartDate ?? 'Not set'}
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    await props.onResetModuleTrackingStartDate(props.moduleSettingsModal!.moduleId);
                    props.onSetResetTrackingMessage(true);
                  }}
                  className="bg-primary/20 rounded-lg py-2 px-3 self-start"
                >
                  <Text className="text-primary font-medium text-sm">Reset to today</Text>
                </TouchableOpacity>
                {props.resetTrackingMessage && (
                  <Text className="text-modal-content-foreground/90 text-xs mt-2">
                    Fresh start for {props.moduleSettingsModal.label}.
                  </Text>
                )}
              </View>
              <View className="flex-1 py-2 border border-border rounded-lg px-3">
                <Text className="text-modal-content-foreground text-xs font-semibold mb-2">Goal</Text>
                {(() => {
                  const field = GOAL_FIELDS[props.moduleSettingsModal.moduleId];
                  if (!field) return <Text className="text-modal-content-foreground/60 text-sm">—</Text>;
                  return (
                    <TextInput
                      className="bg-background border border-border rounded-lg px-3 py-2 text-modal-content-foreground text-sm"
                      value={props.effectiveGoals[field.key] ? String(props.effectiveGoals[field.key]) : ''}
                      onChangeText={(t) => props.onGoalsChange({ [field.key]: parseInt(t.replace(/\D/g, ''), 10) || 0 })}
                      onBlur={props.onPersistGoals}
                      keyboardType="number-pad"
                      placeholder={field.placeholder}
                      placeholderTextColor={iconColors.muted}
                    />
                  );
                })()}
              </View>
            </View>
            <View className="flex-row items-center justify-between py-2 mb-3 border border-border rounded-lg px-3">
              <Text className="text-modal-content-foreground text-sm flex-1">Count in daily score</Text>
              <Switch
                value={props.moduleSettings[props.moduleSettingsModal.moduleId]?.countInScore !== false}
                onValueChange={(v) => props.onSetModuleCountInScore(props.moduleSettingsModal!.moduleId, v)}
                {...switchColors}
              />
            </View>
            <Text className="text-xs text-muted-foreground mb-3">
              When off, this module stays visible but is not included in your daily progress or analytics score.
            </Text>
            <TouchableOpacity onPress={props.onCloseModuleSettings} className="bg-primary rounded-lg py-2.5">
              <Text className="text-center font-semibold text-primary-foreground">Done</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </ModalSurface>

      {/* Import confirmation */}
      <ModalSurface visible={props.confirmImport} onRequestClose={props.onCloseImport} contentClassName="p-6">
        <Text className="text-xl font-bold text-modal-content-foreground mb-2">Restore from Backup</Text>
        <Text className="text-modal-content-foreground mb-4">
          Select a previously exported backup file. This will replace your current data. Continue?
        </Text>
        <ModalButtonRow>
          <ModalButton variant="secondary" onPress={props.onCloseImport}>Cancel</ModalButton>
          <ModalButton variant="primary" onPress={props.onConfirmImport}>Choose File</ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Clear confirmation */}
      <ModalSurface visible={props.confirmClear} onRequestClose={props.onCloseClear} contentClassName="p-6">
        <Text className="text-xl font-bold text-modal-content-foreground mb-2">Clear All Data</Text>
        <Text className="text-modal-content-foreground mb-4">
          This will erase all your data and reset the app. Would you like to create a backup first?
        </Text>
        <View className="gap-2">
          <TouchableOpacity onPress={props.onClearBackupFirst} className="bg-primary rounded-xl py-3 items-center">
            <Text className="text-primary-foreground font-semibold">Backup First</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={props.onClearConfirm} className="bg-destructive/20 border border-destructive/50 rounded-xl py-3 items-center">
            <Text className="text-destructive font-semibold">Clear Without Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={props.onCloseClear} className="bg-muted rounded-xl py-3 items-center">
            <Text className="text-muted-foreground font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </ModalSurface>

      {/* Reset defaults confirmation */}
      <ModalSurface visible={props.confirmResetDefaults} onRequestClose={props.onCloseResetDefaults} contentClassName="p-6">
        <Text className="text-xl font-bold text-modal-content-foreground mb-2">Reset Display Settings</Text>
        <Text className="text-modal-content-foreground mb-4">
          This will reset theme, card layout, and ordering to their defaults. Your data will not be affected, but this cannot be undone.
        </Text>
        <ModalButtonRow>
          <ModalButton variant="secondary" onPress={props.onCloseResetDefaults}>Cancel</ModalButton>
          <ModalButton variant="primary" onPress={props.onConfirmResetDefaults}>Reset</ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Trusted contacts modal */}
      <ModalSurface visible={props.showContactsModal} onRequestClose={props.onCloseContacts} contentClassName="p-6">
        <Text className="text-lg font-bold text-modal-content-foreground mb-1">Trusted Contacts</Text>
        <Text className="text-modal-content-foreground/70 text-sm mb-4">
          People you can call during a hard moment. One tap to reach them.
        </Text>
        {props.contacts.length === 0 && (
          <Text className="text-muted-foreground text-sm mb-4">No contacts added yet.</Text>
        )}
        <View className="gap-2 mb-4">
          {props.contacts.map((c) => (
            <View key={c.id} className="bg-muted rounded-xl p-3 flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => {
                  const url = `tel:${c.phone.replace(/[^+\d]/g, '')}`;
                  import('react-native').then(({ Linking: L }) => L.openURL(url).catch(() => {}));
                }}
                className="flex-1 flex-row items-center gap-3"
              >
                <Phone size={18} color={iconColors.primary} />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-sm">{c.name}</Text>
                  {c.label ? <Text className="text-muted-foreground text-xs">{c.label}</Text> : null}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => props.onRemoveContact(c)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={iconColors.muted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        {props.canAddMore && (
          <TouchableOpacity onPress={props.onAddContact} className="bg-muted rounded-xl p-3 flex-row items-center justify-center gap-2 mb-4">
            <UserPlus size={16} color={iconColors.muted} />
            <Text className="text-muted-foreground font-semibold text-sm">Add trusted contact</Text>
          </TouchableOpacity>
        )}
        <ModalButtonRow>
          <ModalButton variant="primary" onPress={props.onCloseContacts}>Done</ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Label selection */}
      <ModalSurface visible={props.showLabelModal} onRequestClose={props.onCloseLabelModal} contentClassName="p-6">
        <Text className="text-lg font-bold text-modal-content-foreground mb-2">
          How do you know {props.pendingContactName}?
        </Text>
        <Text className="text-modal-content-foreground/70 text-sm mb-4">This label is just for you.</Text>
        <View className="gap-2 mb-4">
          {LABEL_SUGGESTIONS.map((label) => (
            <TouchableOpacity key={label} onPress={() => props.onSaveWithLabel(label)} className="bg-muted rounded-xl py-3 px-4">
              <Text className="text-foreground font-semibold text-center">{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ModalButtonRow>
          <ModalButton variant="secondary" onPress={props.onCloseLabelModal}>Cancel</ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Grounding Readings modal */}
      <ModalSurface
        visible={props.showReadingsModal}
        onRequestClose={props.onCloseReadings}
        contentClassName="p-6 max-h-[85%]"
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text className="text-lg font-bold text-modal-content-foreground mb-1">Grounding Readings</Text>
          <Text className="text-modal-content-foreground/70 text-sm mb-4">
            Manage your reading list for hard moments. Toggle visibility or add your own PDFs.
          </Text>
          <View className="gap-2 mb-4">
            {props.readingsList.map((reading) => (
              <View key={reading.id} className="bg-muted rounded-xl p-3 flex-row items-center gap-3">
                <TouchableOpacity onPress={() => props.onToggleReadingVisibility(reading.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  {reading.visible ? <Eye size={18} color={iconColors.primary} /> : <EyeOff size={18} color={iconColors.muted} />}
                </TouchableOpacity>
                <TouchableOpacity className="flex-1" activeOpacity={0.6} onPress={() => props.onOpenReading(reading.id)}>
                  <Text className={`font-semibold text-sm ${reading.visible ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {reading.title}
                  </Text>
                  {reading.subtitle ? <Text className="text-muted-foreground text-xs">{reading.subtitle}</Text> : null}
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    {reading.type === 'local' ? 'Uploaded PDF' : 'Tap to read'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => props.onOpenReading(reading.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <ChevronRight size={16} color={iconColors.muted} />
                </TouchableOpacity>
                {!reading.isDefault && (
                  <TouchableOpacity onPress={() => props.onRemoveReading(reading)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color={iconColors.muted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          {props.showAddReadingForm ? (
            <View className="gap-3 mb-4 p-3 bg-muted rounded-xl">
              <Text className="text-foreground font-semibold text-sm">Add a PDF</Text>
              <TextInput
                value={props.newReadingTitle}
                onChangeText={props.onSetNewReadingTitle}
                placeholder="Title (required)"
                placeholderTextColor={iconColors.muted}
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              />
              <TextInput
                value={props.newReadingSubtitle}
                onChangeText={props.onSetNewReadingSubtitle}
                placeholder="Subtitle (optional)"
                placeholderTextColor={iconColors.muted}
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              />
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={props.onAddReading} activeOpacity={0.7} className="flex-1 bg-primary rounded-xl py-2.5 items-center">
                  <Text className="text-primary-foreground font-semibold text-sm">Choose PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    props.onSetShowAddReadingForm(false);
                    props.onSetNewReadingTitle('');
                    props.onSetNewReadingSubtitle('');
                  }}
                  activeOpacity={0.7}
                  className="bg-background border border-border rounded-xl py-2.5 px-4 items-center"
                >
                  <Text className="text-muted-foreground font-semibold text-sm">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => props.onSetShowAddReadingForm(true)} className="bg-muted rounded-xl p-3 flex-row items-center justify-center gap-2 mb-4">
              <Plus size={16} color={iconColors.muted} />
              <Text className="text-muted-foreground font-semibold text-sm">Upload a PDF</Text>
            </TouchableOpacity>
          )}
          <ModalButtonRow>
            <ModalButton variant="primary" onPress={props.onCloseReadings}>Done</ModalButton>
          </ModalButtonRow>
        </ScrollView>
      </ModalSurface>

      {/* Profile edit modal */}
      <ModalSurface visible={props.showProfileModal} onRequestClose={props.onCloseProfile} contentClassName="p-6">
        <Text className="text-lg font-bold text-modal-content-foreground mb-4">Edit Profile</Text>
        <View className="gap-3 mb-4">
          <View className="gap-1">
            <Text className="text-muted-foreground text-xs font-semibold">Name</Text>
            <TextInput
              value={props.profile.name}
              onChangeText={(t) => props.onUpdateProfileField('name', t)}
              placeholder="Your first name"
              placeholderTextColor={iconColors.muted}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
            />
          </View>
          <View className="gap-1">
            <Text className="text-muted-foreground text-xs font-semibold">Birthday</Text>
            <TextInput
              value={props.profile.birthday}
              onChangeText={(t) => props.onUpdateProfileField('birthday', t)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={iconColors.muted}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
        <ModalButtonRow>
          <ModalButton variant="secondary" onPress={props.onCloseProfile}>Cancel</ModalButton>
          <ModalButton variant="primary" onPress={props.onSaveProfile}>Save</ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Our Story modal */}
      <ModalSurface visible={props.showStoryModal} onRequestClose={props.onCloseStory} contentClassName="p-6" noScroll>
        <ScrollView showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
          <View className="gap-5">
            <View className="gap-3">
              <Text className="text-xl font-bold text-modal-content-foreground">Why This Exists</Text>
              <Text className="text-sm text-modal-content-foreground leading-6">
                When I started my recovery, I tried every habit tracker and sobriety app I could find. They all wanted $10/month to track more than 3 things.
              </Text>
              <Text className="text-sm text-modal-content-foreground leading-6">So I built my own. Just for me at first.</Text>
              <Text className="text-sm text-modal-content-foreground leading-6">
                Then my sponsor suggested stoicism. My therapist reminded me: one day at a time. An old-timer taught me about gratitude journals.
              </Text>
              <Text className="text-sm text-modal-content-foreground leading-6">
                As I worked out to boost my self-esteem, I added step tracking and workout logging.
              </Text>
              <Text className="text-sm text-modal-content-foreground leading-6 font-semibold">
                Each feature here comes from someone's real advice on my real journey.
              </Text>
              <Text className="text-sm text-modal-content-foreground leading-6">This isn't a product. It's a tool I use every day.</Text>
              <Text className="text-sm text-primary font-semibold text-center">And now it's yours too.</Text>
            </View>
            <View className="gap-3">
              <Text className="text-xl font-bold text-modal-content-foreground">Just For Today</Text>
              <Text className="text-sm text-muted-foreground leading-6">You'll notice this app is different.</Text>
              <View className="gap-2">
                {[
                  'No notifications nagging you',
                  'No guilt-inducing streaks',
                  'No judgment when you skip a day',
                  "Analytics exist, but they're hidden (one day at a time, remember?)",
                ].map((principle) => (
                  <View key={principle} className="flex-row items-start gap-2">
                    <CheckCircle size={16} color={iconColors.primary} style={{ marginTop: 2 }} />
                    <Text className="text-sm text-modal-content-foreground leading-6 flex-1">{principle}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-sm text-modal-content-foreground font-semibold text-center mt-2">
                This is about presence, not performance.
              </Text>
              <Text className="text-sm text-muted-foreground text-center">Show up when you can. That's enough.</Text>
            </View>
          </View>
          <View className="mt-6">
            <ModalButtonRow>
              <ModalButton variant="primary" onPress={props.onCloseStory}>Close</ModalButton>
            </ModalButtonRow>
          </View>
        </ScrollView>
      </ModalSurface>

      {/* Private Thoughts modal */}
      <ModalSurface visible={props.showThoughtsModal} onRequestClose={props.onCloseThoughts} contentClassName="p-6">
        <Text className="text-lg font-bold text-modal-content-foreground mb-1">Private Thoughts</Text>
        <Text className="text-xs text-muted-foreground mb-4">Saved from hard moments</Text>
        {props.thoughtsList.length === 0 ? (
          <View className="items-center py-6">
            <MessageSquare size={32} color={iconColors.muted} />
            <Text className="text-muted-foreground text-sm mt-3 text-center">
              No saved thoughts yet.{'\n'}They'll appear here when you save them during a hard moment.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {props.thoughtsList.map((thought, idx) => (
              <View key={`${thought.date}-${idx}`} className="rounded-xl p-3 bg-background border border-border">
                <Text className="text-modal-content-foreground text-sm leading-5">{thought.text}</Text>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-xs text-muted-foreground">
                    {new Date(thought.date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Delete Thought', 'Are you sure you want to delete this entry?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => props.onDeleteThought(idx) },
                      ]);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color={iconColors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        <View className="mt-4">
          <ModalButtonRow>
            <ModalButton variant="primary" onPress={props.onCloseThoughts}>Close</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </>
  );
}

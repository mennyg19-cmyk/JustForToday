import React from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, Linking, Platform } from 'react-native';
import {
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Activity,
  Cloud,
  RefreshCw,
  FolderOpen,
} from 'lucide-react-native';
import { CollapsibleSection } from '@/components/CollapsibleSection';

const cardClass = 'bg-card rounded-xl p-4 border border-border';

interface Props {
  backupMode: 'manual' | 'auto';
  cloudSyncOn: boolean;
  syncing: boolean;
  lastSyncTime: Date | null;
  safFolder: string | null;
  iconColors: Record<string, string>;
  switchColors: { trackColor: { false: string; true: string }; thumbColor: string };
  onSetBackupMode: (mode: 'manual' | 'auto') => void;
  onExport: () => void;
  onImport: () => void;
  onToggleCloudSync: (value: boolean) => void;
  onSyncNow: () => void;
  onChooseSafFolder: () => void;
  onClearAll: () => void;
}

export function DataSection({
  backupMode,
  cloudSyncOn,
  syncing,
  lastSyncTime,
  safFolder,
  iconColors,
  switchColors,
  onSetBackupMode,
  onExport,
  onImport,
  onToggleCloudSync,
  onSyncNow,
  onChooseSafFolder,
  onClearAll,
}: Props) {
  const handleHealthKit = async () => {
    try {
      const hk = await import('@/lib/healthKit');
      const granted = await hk.requestFitnessPermissions();
      if (granted) {
        Alert.alert('Connected', 'HealthKit access is active. Steps and workouts will sync automatically.');
      } else {
        Alert.alert(
          'Open Health App',
          'HealthKit permissions are managed in the Health app. Go to Sharing > Apps > Just For Today to enable step and workout tracking.',
          [
            { text: 'Open Health', onPress: () => Linking.openURL('x-apple-health://') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch {
      Alert.alert(
        'Open Health App',
        'Open the Health app and go to Sharing > Apps > Just For Today.',
        [
          { text: 'Open Health', onPress: () => Linking.openURL('x-apple-health://') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <CollapsibleSection
      title="Data & Connections"
      subtitle="Backups, sync, and health connections"
      icon={<Cloud size={20} color={iconColors.primary} />}
    >
      <View className="gap-4">
        {/* Health & Fitness */}
        <View>
          <Text className="text-sm text-muted-foreground mb-2">Health & Fitness</Text>
          <View className={`${cardClass}`}>
            <TouchableOpacity onPress={handleHealthKit} activeOpacity={0.7} className="flex-row items-center gap-3">
              <Activity size={24} color={iconColors.primary} />
              <View className="flex-1">
                <Text className="text-foreground font-semibold">HealthKit</Text>
                <Text className="text-xs text-muted-foreground">Connect for steps and workouts</Text>
              </View>
              <ChevronRight size={20} color={iconColors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Backups */}
        <View>
          <Text className="text-sm text-muted-foreground mb-2">Backups</Text>
          <View className={`${cardClass} gap-3`}>
            <View className="flex-row bg-muted rounded-xl overflow-hidden">
              <TouchableOpacity
                onPress={() => onSetBackupMode('manual')}
                className={`flex-1 py-2.5 items-center ${backupMode === 'manual' ? 'bg-primary' : ''}`}
              >
                <Text className={`font-semibold text-sm ${backupMode === 'manual' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  Manual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSetBackupMode('auto')}
                className={`flex-1 py-2.5 items-center ${backupMode === 'auto' ? 'bg-primary' : ''}`}
              >
                <Text className={`font-semibold text-sm ${backupMode === 'auto' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  Auto
                </Text>
              </TouchableOpacity>
            </View>

            {backupMode === 'manual' ? (
              <View className="gap-2">
                <TouchableOpacity onPress={onExport} activeOpacity={0.7} className="flex-row items-center gap-3 py-2">
                  <Download size={20} color={iconColors.primary} />
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">Export Backup</Text>
                    <Text className="text-xs text-muted-foreground">Save all your data as a file</Text>
                  </View>
                </TouchableOpacity>
                <View className="h-px bg-border" />
                <TouchableOpacity onPress={onImport} activeOpacity={0.7} className="flex-row items-center gap-3 py-2">
                  <Upload size={20} color={iconColors.primary} />
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">Import from Backup</Text>
                    <Text className="text-xs text-muted-foreground">Restore a previously exported file</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-2">
                <View className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center gap-3 flex-1">
                    <Cloud size={20} color={iconColors.primary} />
                    <View className="flex-1">
                      <Text className="text-foreground font-medium">
                        {Platform.OS === 'ios' ? 'iCloud Sync' : 'Cloud Folder Sync'}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {Platform.OS === 'ios' ? 'Sync via iCloud Drive' : 'Sync to a folder (Google Drive, Dropbox, etc.)'}
                      </Text>
                    </View>
                  </View>
                  <Switch value={cloudSyncOn} onValueChange={onToggleCloudSync} {...switchColors} />
                </View>

                {Platform.OS === 'android' && cloudSyncOn && (
                  <>
                    <View className="h-px bg-border" />
                    <TouchableOpacity onPress={onChooseSafFolder} activeOpacity={0.7} className="flex-row items-center gap-3 py-2">
                      <FolderOpen size={20} color={iconColors.primary} />
                      <View className="flex-1">
                        <Text className="text-foreground font-medium">Choose Sync Folder</Text>
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                          {safFolder ? 'Folder selected' : 'No folder chosen yet'}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={iconColors.muted} />
                    </TouchableOpacity>
                  </>
                )}

                {cloudSyncOn && (
                  <>
                    <View className="h-px bg-border" />
                    <TouchableOpacity
                      onPress={onSyncNow}
                      activeOpacity={0.7}
                      disabled={syncing}
                      className="flex-row items-center gap-3 py-2"
                    >
                      <RefreshCw size={20} color={syncing ? iconColors.muted : iconColors.primary} />
                      <View className="flex-1">
                        <Text className={`font-medium ${syncing ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {syncing ? 'Syncing...' : 'Sync Now'}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleString()}` : 'Never synced'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Clear All Data */}
        <TouchableOpacity
          onPress={onClearAll}
          activeOpacity={0.7}
          className="rounded-xl p-4 border border-destructive/50 bg-destructive/5 flex-row items-center gap-3"
        >
          <Trash2 size={24} color={iconColors.destructive} />
          <View className="flex-1">
            <Text className="text-destructive font-semibold">Clear All Data</Text>
            <Text className="text-xs text-destructive/80">Erase everything and start fresh</Text>
          </View>
        </TouchableOpacity>
      </View>
    </CollapsibleSection>
  );
}

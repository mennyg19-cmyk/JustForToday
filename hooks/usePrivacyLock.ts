/**
 * usePrivacyLock — reusable hook for biometric / passcode gating.
 *
 * Used by: InventoryScreen (blurs saved history), Settings > Profile
 * (Private Thoughts tile).
 *
 * Session-based: once unlocked it stays unlocked until the app goes
 * to background, then re-locks automatically.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { getPrivacyLockEnabled } from '@/lib/settings/database';

/**
 * Lazily import expo-local-authentication so the module is only
 * loaded when actually needed (avoids crash if not installed yet).
 */
async function getLocalAuth() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return await import('expo-local-authentication');
}

export function usePrivacyLock() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await getPrivacyLockEnabled();
        setIsEnabled(enabled);
      } catch {
        setIsEnabled(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current === 'active' &&
        (nextState === 'background' || nextState === 'inactive')
      ) {
        setIsUnlocked(false);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  /** Trigger biometric / passcode authentication. Returns true on success. */
  const authenticate = useCallback(
    async (promptMessage?: string): Promise<boolean> => {
      try {
        const LA = await getLocalAuth();
        const hasHardware = await LA.hasHardwareAsync();
        if (!hasHardware) {
          setIsUnlocked(true);
          return true;
        }

        const result = await LA.authenticateAsync({
          promptMessage: promptMessage ?? 'Unlock private content',
          disableDeviceFallback: false,
          cancelLabel: 'Cancel',
        });

        if (result.success) {
          setIsUnlocked(true);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  /** Refresh the enabled state (call after toggling the setting). */
  const refresh = useCallback(async () => {
    const enabled = await getPrivacyLockEnabled();
    setIsEnabled(enabled);
    if (!enabled) setIsUnlocked(false);
  }, []);

  return {
    /** Whether the privacy lock setting is turned on. */
    isEnabled,
    /** Whether content is currently locked (enabled + not yet unlocked). */
    isLocked: isEnabled && !isUnlocked,
    /** Whether the setting is still loading. */
    loading,
    /** Trigger authentication. */
    authenticate,
    /** Force unlock (used after successful auth from outside). */
    unlock: () => setIsUnlocked(true),
    /** Re-read the enabled setting from storage. */
    refresh,
  };
}

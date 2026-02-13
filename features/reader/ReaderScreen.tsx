/**
 * ReaderScreen — in-app reader for grounding readings.
 *
 * Supports both web URLs (opens in a WebView) and local PDF files.
 * Saves the user's scroll position per reading so they can pick up
 * where they left off next time.
 *
 * Route params:
 *   - readingId: the ID of the GroundingReading to open
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from '@/components/AppHeader';
import { LoadingView } from '@/components/common/LoadingView';
import { useColorScheme } from 'nativewind';
import { getReadings, type GroundingReading } from '@/lib/groundingReadings';
import { logger } from '@/lib/logger';

/** AsyncStorage key prefix for saving scroll positions. */
const BOOKMARK_PREFIX = 'lifetrack_reader_bookmark_';

/** Debounce interval for saving scroll position (ms). */
const SAVE_DEBOUNCE_MS = 1500;

export function ReaderScreen() {
  const params = useLocalSearchParams<{ readingId: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [reading, setReading] = useState<GroundingReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedScrollY, setSavedScrollY] = useState(0);

  const webViewRef = useRef<WebView>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the reading and its saved scroll position
  useEffect(() => {
    (async () => {
      try {
        const all = await getReadings();
        const found = all.find((r) => r.id === params.readingId);
        setReading(found ?? null);

        if (found) {
          const raw = await AsyncStorage.getItem(BOOKMARK_PREFIX + found.id);
          if (raw) {
            const pos = parseFloat(raw);
            if (!isNaN(pos)) setSavedScrollY(pos);
          }
        }
      } catch (err) {
        logger.error('Failed to load reading:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.readingId]);

  /** Save scroll position (debounced). */
  const handleSavePosition = useCallback(
    (scrollY: number) => {
      if (!reading) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        AsyncStorage.setItem(
          BOOKMARK_PREFIX + reading.id,
          String(scrollY)
        ).catch(() => {});
      }, SAVE_DEBOUNCE_MS);
    },
    [reading]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /**
   * JavaScript injected into the WebView to:
   *   1. Restore saved scroll position on load
   *   2. Report scroll position changes back to React Native
   */
  const getInjectedJS = useCallback(() => {
    return `
      (function() {
        // Restore scroll position after content loads
        var restored = false;
        var savedY = ${savedScrollY};
        
        function tryRestore() {
          if (!restored && savedY > 0 && document.body.scrollHeight > savedY) {
            window.scrollTo(0, savedY);
            restored = true;
          }
        }
        
        // Try restore on multiple events for reliability
        window.addEventListener('load', function() {
          setTimeout(tryRestore, 500);
          setTimeout(tryRestore, 1500);
          setTimeout(tryRestore, 3000);
        });
        
        // Report scroll position changes
        var lastReported = 0;
        window.addEventListener('scroll', function() {
          var y = window.scrollY || document.documentElement.scrollTop || 0;
          if (Math.abs(y - lastReported) > 50) {
            lastReported = y;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', y: y }));
          }
        }, { passive: true });
        
        true; // Required for iOS
      })();
    `;
  }, [savedScrollY]);

  /** Handle messages from WebView (scroll position updates). */
  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'scroll' && typeof data.y === 'number') {
          handleSavePosition(data.y);
        }
      } catch {
        // Ignore invalid messages
      }
    },
    [handleSavePosition]
  );

  /** Build the correct WebView source based on reading type. */
  const webViewSource = reading ? { uri: reading.uri } : undefined;

  /** Handle WebView load errors. */
  const handleError = useCallback(
    (syntheticEvent: { nativeEvent: { description?: string; code?: number } }) => {
      const { description } = syntheticEvent.nativeEvent;
      setError(description || 'Failed to load this reading. Please try again later.');
    },
    []
  );

  /** Handle HTTP errors (e.g. 404, 403). */
  const handleHttpError = useCallback(
    (syntheticEvent: { nativeEvent: { statusCode?: number; description?: string } }) => {
      const { statusCode, description } = syntheticEvent.nativeEvent;
      setError(
        `This page returned an error (${statusCode ?? 'unknown'}). ${description || 'The site may be blocking in-app viewing.'}`
      );
    },
    []
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Reader" showBack />
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (!reading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Reader" showBack />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-lg font-bold mb-2">
            Reading not found
          </Text>
          <Text className="text-muted-foreground text-center text-sm">
            This reading may have been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader
        title={reading.title}
        showBack
      />
      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-lg font-bold mb-2">
            Could not load reading
          </Text>
          <Text className="text-muted-foreground text-center text-sm mb-4">
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              webViewRef.current?.reload();
            }}
            className="bg-primary rounded-xl py-2.5 px-6"
          >
            <Text className="text-primary-foreground font-semibold text-sm">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={webViewSource}
          style={{ flex: 1 }}
          injectedJavaScript={getInjectedJS()}
          onMessage={handleMessage}
          onError={handleError}
          onHttpError={handleHttpError}
          startInLoadingState
          renderLoading={() => (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isDark ? 'rgba(22, 18, 12, 0.9)' : 'rgba(252, 249, 242, 0.9)',
              }}
            >
              <LoadingView message={`Loading ${reading.title}...`} />
            </View>
          )}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          originWhitelist={['*']}
          javaScriptEnabled
        />
      )}
    </SafeAreaView>
  );
}

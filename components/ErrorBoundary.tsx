/**
 * Root-level React error boundary.
 *
 * Catches unhandled JS errors in the component tree and shows a
 * recovery UI instead of a white screen. In dev mode the error
 * details are logged to the console.
 */

import React, { Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Appearance } from 'react-native';
import { logger } from '@/lib/logger';
import { themeColors } from '@/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDark = Appearance.getColorScheme() === 'dark';
      const colors = themeColors[isDark ? 'dark' : 'light'];
      const dynamicStyles = getStyles(isDark, colors);

      return (
        <View style={dynamicStyles.container}>
          <View style={dynamicStyles.card}>
            <Text style={dynamicStyles.title}>Something went wrong</Text>
            <Text style={dynamicStyles.subtitle}>
              The app ran into an unexpected error. You can try restarting this
              screen or reloading the app.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={dynamicStyles.detailScroll}>
                <Text style={dynamicStyles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={this.handleReset}
              style={dynamicStyles.button}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.buttonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

function getStyles(isDark: boolean, colors: typeof themeColors.dark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 360,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      color: isDark ? '#F0EBE1' : '#241E18',
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      color: isDark ? '#B4AA96' : '#807869',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: 16,
    },
    detailScroll: {
      maxHeight: 120,
      backgroundColor: isDark ? '#1A1408' : '#F5F1E8',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      color: isDark ? '#DC5050' : '#C83232',
      fontSize: 12,
      fontFamily: 'monospace',
    },
    button: {
      backgroundColor: isDark ? '#D4B26A' : '#B48C3C',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: isDark ? '#1E1910' : '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
  });
}

import React, { createContext, useContext } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Theme context so modals (and any view outside the main tree) can apply
 * the same theme variables and get correct colors. Modals must wrap their
 * content in a View with style={themeStyle} so that classes like bg-card,
 * text-foreground, border-border resolve correctly.
 */
export interface ThemeContextValue {
  /** Apply this style to the root View of modal content so theme vars are set */
  themeStyle: StyleProp<ViewStyle>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeStyle(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeStyle must be used within ThemeProvider');
  }
  return ctx;
}

export const ThemeStyleProvider = ThemeContext.Provider;
export function useThemeStyleOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

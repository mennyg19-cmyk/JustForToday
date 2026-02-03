import { vars } from 'nativewind';

/**
 * Theme tokens are applied at the root and (for modals) must be re-applied
 * to modal content Views so modals get correct colors. All surfaces used in
 * modals (card, input, modal-content) are opaque with visible borders.
 */

export const lightTheme = vars({
  '--radius': '14',
  '--background': '253 251 255',
  '--foreground': '30 27 36',
  '--card': '255 255 255',
  '--card-foreground': '30 27 36',
  '--primary': '139 92 246',
  '--primary-foreground': '255 255 255',
  '--secondary': '237 233 254',
  '--secondary-foreground': '91 33 182',
  '--muted': '245 243 255',
  '--muted-foreground': '113 113 122',
  '--accent': '196 181 253',
  '--accent-foreground': '76 29 149',
  '--destructive': '220 38 38',
  '--destructive-foreground': '255 255 255',
  '--border': '233 228 250',
  '--input': '245 243 255',
  '--input-foreground': '30 27 36',
  '--ring': '139 92 246',
  // Progress bar (dashboard)
  '--progress-track': '233 228 250',
  '--progress-fill': '16 185 129',
  // Modal: always opaque so overlays and content are visible
  '--modal-overlay': '0 0 0',
  '--modal-content': '255 255 255',
  '--modal-content-foreground': '30 27 36',
  '--modal-border': '233 228 250',
  '--chart-1': '59 130 246',
  '--chart-2': '139 92 246',
  '--chart-3': '16 185 129',
  '--chart-4': '251 146 60',
  '--chart-5': '244 63 94',
});

/** Dashboard "Today's Progress" card gradient - light purple, eye-catching */
export const progressCardGradient = {
  light: ['#8B5CF6', '#7C3AED'] as const,
  dark: ['#A78BFA', '#8B5CF6'] as const,
};

export const darkTheme = vars({
  '--radius': '14',
  '--background': '18 15 26',
  '--foreground': '250 250 255',
  '--card': '45 42 62',
  '--card-foreground': '250 250 255',
  '--primary': '167 139 250',
  '--primary-foreground': '30 27 36',
  '--secondary': '46 38 75',
  '--secondary-foreground': '221 214 254',
  '--muted': '55 48 80',
  '--muted-foreground': '200 196 220',
  '--accent': '91 33 182',
  '--accent-foreground': '237 233 254',
  '--destructive': '248 113 113',
  '--destructive-foreground': '30 27 36',
  '--border': '75 68 110',
  '--input': '55 48 80',
  '--input-foreground': '250 250 255',
  '--ring': '167 139 250',
  // Progress bar (dashboard)
  '--progress-track': '55 48 80',
  '--progress-fill': '52 211 153',
  // Modal: opaque dark surface, light text, visible border
  '--modal-overlay': '0 0 0',
  '--modal-content': '45 42 62',
  '--modal-content-foreground': '250 250 255',
  '--modal-border': '75 68 110',
  '--chart-1': '96 165 250',
  '--chart-2': '167 139 250',
  '--chart-3': '52 211 153',
  '--chart-4': '251 191 36',
  '--chart-5': '251 113 133',
});

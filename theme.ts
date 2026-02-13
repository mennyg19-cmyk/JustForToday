import { vars } from 'nativewind';

/**
 * Theme tokens — brass/amber warm palette.
 *
 * Applied at the root View and re-applied to modal content Views so modals
 * render with correct colors. All modal surfaces are opaque with visible borders.
 *
 * Color philosophy: dark warm background (never pure black), soft off-white text
 * (never pure white), one muted brass/amber accent. No bright colors, no gradients.
 */

export const lightTheme = vars({
  '--radius': '14',
  '--background': '252 249 242',       // warm off-white
  '--foreground': '36 32 24',           // warm dark brown
  '--card': '255 253 247',              // warm white card
  '--card-foreground': '36 32 24',
  '--primary': '180 140 60',            // brass accent
  '--primary-foreground': '255 255 255',
  '--secondary': '245 238 220',         // warm cream
  '--secondary-foreground': '140 105 40', // dark brass
  '--muted': '245 241 232',             // warm muted surface
  '--muted-foreground': '128 120 105',  // warm gray text
  '--accent': '212 178 106',            // amber highlight
  '--accent-foreground': '100 75 25',   // dark amber text
  '--destructive': '200 50 50',         // muted red (less harsh)
  '--destructive-foreground': '255 255 255',
  '--border': '230 222 205',            // warm border
  '--input': '245 241 232',             // matches muted
  '--input-foreground': '36 32 24',
  '--ring': '180 140 60',
  // Progress bar (dashboard)
  '--progress-track': '230 222 205',
  '--progress-fill': '180 140 60',      // brass fill
  // Modal: opaque warm surfaces
  '--modal-overlay': '0 0 0',
  '--modal-content': '255 253 247',
  '--modal-content-foreground': '36 32 24',
  '--modal-border': '230 222 205',
  '--chart-1': '180 140 60',            // brass
  '--chart-2': '160 120 50',            // darker brass
  '--chart-3': '120 140 90',            // muted olive
  '--chart-4': '170 100 60',            // warm sienna
  '--chart-5': '140 120 100',           // warm gray
});

/**
 * Flat amber accent color for the dashboard check-in card.
 * Kept as a pair (light/dark) for backward compatibility with any
 * code that still references it, but the home screen should use a
 * flat surface rather than a gradient.
 */
export const progressCardColors = {
  light: '#B48C3C',
  dark: '#D4B26A',
};

/**
 * Hex values for React Native style objects (tab bar, FAB, etc.) where
 * CSS variables cannot be used. Derived from theme RGB tokens.
 */
export const themeColors = {
  light: {
    card: '#FFFDF7',
    background: '#FCF9F2',
    secondary: '#F5EEDC',
    muted: '#F5F1E8',
    border: '#E6DEC5',
  },
  dark: {
    card: '#262119',
    background: '#16120C',
    secondary: '#322A1C',
    muted: '#302A1E',
    border: '#413828',
  },
};

export const darkTheme = vars({
  '--radius': '14',
  '--background': '22 18 12',           // warm charcoal (not pure black)
  '--foreground': '240 235 225',         // soft warm white
  '--card': '38 33 25',                 // warm dark card
  '--card-foreground': '240 235 225',
  '--primary': '212 178 106',            // lighter brass for dark mode
  '--primary-foreground': '30 25 16',
  '--secondary': '50 42 28',            // warm dark secondary
  '--secondary-foreground': '230 215 170',
  '--muted': '48 42 30',                // warm muted surface
  '--muted-foreground': '180 170 150',  // warm muted text
  '--accent': '160 125 60',             // amber accent
  '--accent-foreground': '240 230 200',
  '--destructive': '220 80 80',         // muted red
  '--destructive-foreground': '30 25 16',
  '--border': '65 56 40',               // warm border
  '--input': '48 42 30',                // matches muted
  '--input-foreground': '240 235 225',
  '--ring': '212 178 106',
  // Progress bar (dashboard)
  '--progress-track': '48 42 30',
  '--progress-fill': '212 178 106',     // brass fill
  // Modal: opaque warm dark surface
  '--modal-overlay': '0 0 0',
  '--modal-content': '38 33 25',
  '--modal-content-foreground': '240 235 225',
  '--modal-border': '65 56 40',
  '--chart-1': '212 178 106',           // brass
  '--chart-2': '180 150 90',            // warm gold
  '--chart-3': '140 160 110',           // muted sage
  '--chart-4': '200 140 80',            // warm amber
  '--chart-5': '170 150 130',           // warm gray
});

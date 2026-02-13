# JustForToday (LifeTrack Pro)

## What This Is

A privacy-first recovery and wellness tracking iOS app built with React Native / Expo. No backend — all data stored locally with optional iCloud sync. Designed for individuals in 12-step recovery programs.

## Tech Stack

- **Expo 54** + **React Native 0.81** (Expo Router for file-based navigation)
- **TypeScript 5.9** (strict mode, `noUnusedLocals`, `noUnusedParameters`)
- **SQLite** (expo-sqlite) with 7 migrations, AsyncStorage fallback for Expo Go
- **NativeWind 4 / Tailwind CSS 3** for styling
- **SF Pro Display** (system font) for premium iOS feel
- **iCloud Drive** sync via `@oleg_svetlichnyi/expo-icloud-storage`
- **HealthKit** via `@kingstinct/react-native-healthkit` (steps, workouts, active energy) — supports new architecture via Nitro modules

## Architecture

### Route Pattern
All routes in `app/` are thin wrappers that import feature screens:
```tsx
// app/habits.tsx
import { HabitsScreen } from '@/features/habits/HabitsScreen';
export default function HabitsRoute() { return <HabitsScreen />; }
```

### Feature Module Pattern
Each feature is self-contained in `features/{name}/`:
```
features/habits/
  database.ts       # SQLite queries
  hooks/useHabits.ts # Business logic hook
  components/       # Feature-specific UI
  HabitsScreen.tsx  # Main screen
  types.ts          # Types (re-exports from schema)
```

### Data Flow
```
Screen → Hook (useXxx) → Database (features/xxx/database.ts) → SQLite
                                                              → triggerSync() → iCloud
```

### Key Files
- `theme.ts` — Light/dark theme tokens (warm brass/amber palette)
- `lib/modules.ts` — Single source of truth for all modules
- `lib/cardConfigs.tsx` — Dashboard card visual configs
- `lib/analytics.ts` — Scoring and drilldown logic
- `lib/iconTheme.ts` — `useIconColors()` hook for themed icon colors
- `components/cardStyles.ts` — Shared card class constants
- `components/common/` — `LoadingView`, `ErrorView`, `EmptyState`

## Conventions

### Styling
- Use Tailwind classes via `className` (NativeWind)
- Card styling: import `CARD`, `CARD_MB`, `CARD_SHADOW` from `@/components/cardStyles`
- Colors: always use theme tokens, never hardcode hex in components
- Icon colors: `useIconColors()` from `@/lib/iconTheme`

### Loading / Error States
- Use `<LoadingView />` from `@/components/common/LoadingView`
- Use `<ErrorView message={...} onRetry={...} />` from `@/components/common/ErrorView`
- Never inline `<ActivityIndicator>` in feature screens

### Database
- All mutations must call `triggerSync()` from `@/lib/sync` after writes
- Always provide AsyncStorage fallback in `lib/database/asyncFallback/`
- Use parameterized queries (never string interpolation in SQL)

### Constants
- `DEFAULT_GOALS` lives in `features/settings/constants.ts` — import it, don't duplicate
- `getWeekStart()` lives in `utils/date.ts` — don't recreate week-start logic

### Unused Variables
- Prefix with underscore: `_unusedParam`
- ESLint rule: `argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`

## Modules

sobriety, habits, inventory, stoic, steps, workouts, fasting, gratitude, daily_renewal

Each module is registered in `lib/modules.ts` and has:
- A visibility toggle in settings
- A dashboard card config in `lib/cardConfigs.tsx`
- An analytics drilldown row in `features/analytics/AnalyticsScreen.tsx`

## Build & Run

```sh
npm install              # Install dependencies
npx expo start           # Start dev server
npx expo start --ios     # iOS simulator
npx tsc --noEmit         # Type check (must be zero errors)
npx expo lint            # ESLint check
eas build --platform ios  # Production iOS build
```

## iOS Build Notes

- **User Script Sandboxing must be OFF**: `ENABLE_USER_SCRIPT_SANDBOXING = NO` must be set in both Debug and Release configs in `ios/JustForToday.xcodeproj/project.pbxproj` — CocoaPods build fails without this. If `npx expo prebuild` resets it to YES, change it back.
- **HealthKit entitlement must be present**: `ios/JustForToday/JustForToday.entitlements` must include `com.apple.developer.healthkit` and `com.apple.developer.healthkit.access` — without these, HealthKit permission dialogs silently fail on device. If `npx expo prebuild` strips them, re-add manually.

## App Store Details
- **Bundle ID:** com.mennyg19.lifetrackpro
- **Name:** LifeTrack Pro (display: "Just For Today" in-app)
- **iOS Features:** iCloud sync, HealthKit, Contacts (trusted contacts)
- **Dark Mode:** System-aware via `userInterfaceStyle: "automatic"`

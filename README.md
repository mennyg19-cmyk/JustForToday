# Just For Today

A privacy-first recovery and wellness tracking app built with React Native and Expo. All data is stored locally on-device with optional iCloud / cloud folder sync. Designed for individuals in 12-step recovery programs.

## Features

| Module | Description |
|--------|-------------|
| **Sobriety** | Multiple counters with live timers, commitment tracking, and milestone celebrations |
| **Habits** | Daily habit tracking with streaks, calendar history, and optional metrics |
| **Step 10 Inventory** | Resentment inventory with affects, defects, assets, and Big Book passages. Fear tab coming soon |
| **Step 11 Inventory** | Morning reflection and nightly review inventories |
| **Daily Renewal** | Daily commitment flow with challenge/plan pairs and countdown timer |
| **Stoic Handbook** | Weekly stoic lessons with reflection prompts |
| **Steps** | HealthKit integration for step counting with manual entry fallback |
| **Workouts** | HealthKit workout tracking with active energy stats |
| **Fasting** | Intermittent fasting timer with session history |
| **Gratitude** | Daily gratitude journal with similarity detection |
| **Analytics** | Scoring dashboard with heatmaps and per-module drilldowns |
| **Hard Moment** | Emergency support screen with grounding exercises, trusted contacts, and thought journaling |

### Additional Capabilities

- **Daily commitment prompt** — on first open each day, prompts to commit or renew
- **Privacy lock** — opt-in biometric/passcode protection for inventory history and private thoughts
- **Onboarding flow** — 10-step guided setup for new users
- **Dark mode** — system-aware with manual override (warm brass/amber palette)
- **Cloud sync** — iCloud Drive (iOS) or Storage Access Framework folders (Android)
- **Error boundary** — graceful crash recovery at root level

## Tech Stack

- **Expo 54** + **React Native 0.81** with Expo Router (file-based navigation)
- **TypeScript 5.9** (strict mode)
- **SQLite** (expo-sqlite) with 7 migrations, AsyncStorage fallback for Expo Go
- **NativeWind 4 / Tailwind CSS 3** for styling
- **iCloud Drive** sync via `@oleg_svetlichnyi/expo-icloud-storage`
- **HealthKit** via `react-native-health`
- **Biometrics** via `expo-local-authentication`

## Architecture

```
app/                        Expo Router screens (thin wrappers)
components/                 Shared UI (ErrorBoundary, ModalSurface, cards, etc.)
  common/                   LoadingView, ErrorView, EmptyState
features/                   Feature modules (self-contained)
  habits/                   database.ts, hooks/, components/, HabitsScreen.tsx
  sobriety/                 database.ts, hooks/, components/, SobrietyScreen.tsx
  inventory/                Step 10 + Step 11 screens, helpers, step10Data
  checkin/                  Daily check-in flow, types
  settings/                 Split into section components + modals
  ...                       (14 feature modules total)
hooks/                      Shared hooks (useAsyncResource, useOrderedList, usePrivacyLock)
lib/
  database/                 SQLite layer + migrations + AsyncStorage fallback
  sync/                     Cloud sync (iCloud, Android SAF, syncManager)
  settings/                 Settings storage
  logger.ts                 Environment-gated logging (__DEV__ only)
  constants.ts              App-wide defaults (goals)
  modules.ts                Module registry (single source of truth)
  analytics.ts              Scoring and drilldown logic
  iconTheme.ts              useIconColors() for themed icon colors
utils/                      Pure utilities (date, format, sorting, comparison)
theme.ts                    Light/dark theme tokens
```

### Data Flow

```
Screen → Hook (useXxx) → Database (features/xxx/database.ts) → SQLite
                                                               → triggerSync() → iCloud/SAF
```

## Setup

```sh
npm install                 # Install dependencies
npx expo start              # Start dev server (Expo Go)
npx expo start --clear      # Start with cleared Metro cache
npx expo start --ios        # iOS simulator
npx tsc --noEmit            # Type check
npx expo lint               # ESLint
eas build --platform ios    # Production iOS build
```

## iOS Build Notes

- **User Script Sandboxing** must be OFF: set `ENABLE_USER_SCRIPT_SANDBOXING = NO` in both Debug and Release configs in `ios/JustForToday.xcodeproj/project.pbxproj`. CocoaPods fails without this. If `npx expo prebuild` resets it, change it back.
- **HealthKit entitlements** must be present in `ios/JustForToday/JustForToday.entitlements` — `com.apple.developer.healthkit` and `com.apple.developer.healthkit.access`. If `npx expo prebuild` strips them, re-add manually.

## App Details

- **Bundle ID:** `com.gurumedia.JustForToday`
- **iOS features:** iCloud sync, HealthKit, Contacts (trusted contacts), Face ID / Touch ID
- **Dark mode:** System-aware via `userInterfaceStyle: "automatic"`
- **Privacy:** No backend, no analytics, no tracking. All data on-device.

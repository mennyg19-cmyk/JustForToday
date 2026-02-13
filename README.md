# LifeTrack Pro - Clean Architecture

This is the refactored version of LifeTrack Pro with:

- **SQLite Database** instead of AsyncStorage JSON files
- **iCloud Drive Sync** for privacy-first cross-device sync
- **Feature-based architecture** for better maintainability
- **Strict TypeScript** for type safety
- **Performance optimizations** with memoization

## Architecture

```
app/                    # Expo Router screens (thin wrappers)
features/              # Feature-based organization
  habits/
  sobriety/
  inventory/
  steps/
  gratitude/
  dashboard/
components/            # Shared UI components
hooks/                 # Reusable hooks
lib/
  database/           # SQLite database layer
  sync/               # iCloud Drive sync
utils/                # Pure utility functions
```

## Database

- SQLite database stored locally
- Automatic migrations on app start
- iCloud Drive sync for cross-device access
- Privacy-first: data never touches backend servers

## Setup

1. Install dependencies: `npm install` or `bun install`
2. Run migrations: Automatic on first app start
3. Start dev server: `npm start` or `bun start`

## Development

- Format code: `npm run format`
- Lint code: `npm run lint`
- Type check: `tsc --noEmit`

## Features

- Habits tracking with streaks
- Sobriety counters
- Step 10 inventory (morning/nightly/step10)
- Steps tracking (HealthKit + manual)
- Gratitude journal
- Dashboard with progress cards

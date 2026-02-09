# LifeTrack Pro

A recovery-focused personal development companion built with React Native and Expo. Designed to support sobriety, step work, and daily wellness practices with a calm, pressure-free interface. All data stays private with local SQLite storage and optional iCloud sync.

## Philosophy

**"Just for today."** This app is built around presence, not performance. It emphasizes showing up over perfection, honesty over metrics, and steady forward motion without pressure. The warm brass-and-amber design creates a quiet, grounding space for recovery work.

No tracking. No analytics. No servers. Just you and your journey.

## Features

### 🎯 Recovery Core

**Daily Check-In**  
Start each day with a structured commitment flow that adapts to your recovery journey:
- **Intelligent commitment system** - Offer 24-hour or 12-hour commitments based on your tracked substances
- **Multi-substance support** - Different commitment durations for different counters
- **Challenge & plan pairs** - Identify what might make today hard and plan responses
- **Encouragement messages** - Gentle, rotating messages that change daily
- **No pressure** - Declining a commitment is never treated as failure

**Sobriety Tracking**  
Track multiple substances/behaviors with comprehensive counter system:
- **Multiple counters** - Track different substances or behaviors separately
- **Display name & actual name** - Public and private labels for discretion
- **Current streak & longest streak** - See both ongoing and best records
- **Complete history** - Full daily tracking with calendar visualization
- **Daily renewal integration** - Counters connect to commitment timers

**Step 10 Inventory**  
Three types of structured inventory work with Big Book integration:
- **Morning inventory** - Set intentions, pray, identify whom to help today
- **Nightly inventory** - Review the day: who, what happened, affects, defects, assets
- **Step 10 spot check** - On-the-spot inventory for situations as they arise
- **Big Book passages** - Relevant 4th Step instructions embedded in the flow
- **Guided prompts** - Pre-populated lists of affects, defects, and assets
- **7th Step prayer** - Built into nightly inventory workflow
- **Amends tracking** - Note when amends are needed, to whom, and follow-through

**Hard Moment Support**  
An emergency landing page accessible from anywhere in the app:
- **Grounding message** - Calm, rotating encouragement specific to crisis moments
- **Breathing exercise** - 4-second in, 4-second hold, 4-second out pattern with visual timer
- **Grounding tools** - Walk, water, warm drink, music, reading suggestions
- **Trusted contacts** - One-tap calling to sponsor or support people
- **Thought writing** - Ephemeral or savable free-form writing space
- **No data logged** - This screen leaves no trace; it's just for support

**Daily Renewal**  
Per-counter commitment timers that count down throughout the day:
- **Visual countdown rings** - Clean circular progress display
- **24-hour or 12-hour timers** - Duration set during daily check-in
- **One-tap renewal** - Refresh your commitment any time
- **Multi-counter display** - See all active commitments at once
- **Expiry labels** - "until tomorrow at 10:45am" for clarity

### 📝 Daily Practice

**Habits**  
Build and break habits with intelligent tracking:
- **Daily and weekly frequencies** - Track habits on different schedules
- **Build vs break** - Visual distinction for positive habits vs breaking negative ones
- **Current streak & high score** - See ongoing and best performance
- **Calendar view** - Full year of history at a glance
- **Comparison stats** - This week vs last week, this month vs last month
- **Reorderable list** - Drag to rearrange habit order
- **Customizable goals** - Set how many habits constitute a "complete" day

**Gratitude Journal**  
Daily gratitude with anti-repetition encouragement:
- **Similarity detection** - Gentle nudge when entries are very similar to recent ones
- **Simple, fast** - Single text field, quick save
- **Full history** - Review all past entries
- **Today's entries** - See if you've already journaled today

**Stoic Handbook**  
52-week journey through Epictetus's *Enchiridion* organized by discipline:
- **Three disciplines** - Desire, Action, Assent (in sequence)
- **Weekly themes** - Each week focuses on one teaching from the Handbook
- **Daily lessons** - Monday–Saturday: study and reflection; Sunday: review
- **Reflection tracking** - Mark lessons as "useful" and save personal notes
- **Calendar & custom start modes** - Follow actual weeks or progress at your own pace
- **History view** - Review past weeks organized by discipline and part

**Reader**  
In-app reader for recovery literature and personal PDFs:
- **Default recovery resources** - AA Big Book, 12&12, NA Basic Text, Daily Reflections
- **Upload custom PDFs** - Add your own literature or personal readings
- **Bookmark support** - Automatically saves scroll position per reading
- **Manage visibility** - Hide/show readings without deleting

### 💪 Health & Wellness

**Steps**  
Track physical activity with HealthKit integration:
- **Automatic step counting** - Syncs with Apple Health (iOS only)
- **Manual entry** - Add step counts manually when needed
- **Daily goal** - Set target steps per day
- **History & charts** - View step trends over time

**Workouts**  
Log exercise and activity:
- **Manual logging** - Record workout name, duration, calories
- **HealthKit integration** - Import workout data from Apple Health
- **Calendar view** - See workout history visually
- **Goal tracking** - Set daily workout target

**Fasting**  
Intermittent fasting tracker with timer:
- **Active fast timer** - See elapsed time for current fast
- **History** - All past fasting sessions with durations
- **Daily summary** - Total hours fasted today
- **Goal setting** - Set daily fasting hour target

### 📊 Analytics

**Year Heatmap**  
GitHub-style contribution graph showing 52 weeks of daily scores:
- **Overall score** - Weighted composite across all enabled modules
- **Color-coded intensity** - 5 levels from 0% to 100%
- **Daily detail** - Tap any day to see breakdown by module
- **Weekday labels** - S M T W T F S column headers

**Module Breakdown**  
Detailed performance per module:
- **Progress bars** - Visual representation of completion rates
- **Tap to navigate** - Jump directly to any module from analytics
- **Filtered by visibility** - Only shows modules you've enabled

**Smart Suggestions**  
Data-driven recommendations based on your patterns:
- **Identifies weak spots** - "Your gratitude journal entries are low"
- **Actionable next steps** - Concrete suggestions, not generic advice
- **Adaptive** - Changes based on current performance

**Check-In History**  
Calendar view of past check-ins:
- **Commitment types** - See 24h, 12h, or none commitments per day
- **Tap to view** - See full challenge/plan details from past check-ins
- **Streak visibility** - Quickly identify consistent check-in patterns

### ⚙️ Settings

**Module Visibility**  
Toggle which features appear in your dashboard:
- **Three sections** - Sobriety, Daily Practice, Health
- **Per-module on/off** - Only see what's relevant to you
- **Reorder modules** - Drag to change dashboard card order
- **Reorder sections** - Customize section sequence

**Daily Goals**  
Set targets for each module:
- **Habits** - How many to complete for 100%
- **Steps** - Daily step target
- **Workouts** - Workouts per day goal
- **Fasting** - Hours to fast per day
- **Inventory** - Inventories per day target
- **Gratitude** - Gratitude entries per day

**User Profile**  
Personalize the experience:
- **Name** - Used for personalized encouragement messages
- **Greeting toggle** - Show/hide time-based greetings on home screen

**Data Management**  
Full control over your data:
- **Export data** - JSON file of entire database
- **Import data** - Restore from backup or merge data
- **iCloud sync status** - See last sync time (iOS only)
- **Reset app** - Clear all data and start fresh

**Trusted Contacts**  
Emergency contacts for Hard Moment screen:
- **Add from Contacts app** - Or enter manually
- **Label contacts** - "Sponsor", "Friend", "Family", etc.
- **One-tap calling** - Reordered list with quick access
- **Privacy** - Stored locally only

**Grounding Readings**  
Manage reading list for Hard Moment screen:
- **Default recovery literature** - Pre-loaded links to AA/NA resources
- **Upload PDFs** - Add your own readings
- **Toggle visibility** - Show/hide without deleting
- **Cannot delete defaults** - Built-in readings can only be hidden

**Appearance**  
Customize look and feel:
- **Theme toggle** - Light or dark mode
- **Grouped vs compact view** - Dashboard layout preference
- **Icon colors** - Consistent brass/amber theming

## User Experience

**Home Screen (Today)**  
Your daily anchor:
- **Today's date** - Warm, human-readable format (Monday, February 9)
- **Time-based greeting** - "Good morning, [Name]" / afternoon / evening
- **Check-in card** - Primary action; shows status if already complete
- **Commitment countdown** - If you've checked in with a timed commitment
- **Daily quote** - Rotating recovery wisdom (deterministic per day)
- **Module cards** - Customizable grid of your enabled tools
- **Goal completion badges** - Quick visual on progress for each module

**Navigation**  
- **Bottom tabs** - Today (home) and Settings always accessible
- **Floating Hard Moment button** - Red beacon visible on all screens except its own page
- **Back navigation** - Consistent patterns; analytics deep-links return correctly

**Module Cards**  
- **Image banner** - Relevant photo at top
- **Icon + title** - Clear identification
- **Subtitle** - Current status ("3/8 complete", "All habits done", etc.)
- **Badge** - Prominent number for at-a-glance tracking
- **Tap to open** - Direct navigation to full feature

**Modals**  
- **Opaque surfaces** - Warm, card-like appearance with visible borders
- **Consistent buttons** - Primary and cancel actions clearly distinguished
- **Keyboard handling** - Smart scrolling and dismiss-on-tap-outside

**Empty States**  
- **Encouraging messages** - "No habits yet. Tap + to add your first."
- **Clear CTAs** - Always show next action
- **Not nagging** - Gentle guidance without pressure

**Loading & Error**  
- **Consistent loading views** - Spinner with icon colors
- **Error boundaries** - Graceful failure with retry option
- **Refresh gestures** - Pull-to-refresh on list screens

## Technical Architecture

### Stack

**Frontend**  
- React Native **0.81.5** (New Architecture enabled)
- React **19.1.0**
- Expo SDK **54**
- Expo Router **6** (file-based routing)
- TypeScript **5.9.3** (strict mode)

**Styling**  
- NativeWind **4.2.1** (Tailwind CSS for React Native)
- Custom theme system with CSS variables
- Lucide React Native **0.510.0** for icons
- Warm brass/amber color palette (light & dark modes)

**Data Layer**  
- Expo SQLite **16** for local relational database
- iCloud Storage for cross-device sync (iOS only, via `@oleg_svetlichnyi/expo-icloud-storage`)
- AsyncStorage for ephemeral state (drafts, bookmarks, UI preferences)

**Libraries**  
- `date-fns` **4.1.0** - Date manipulation and formatting
- `react-native-gifted-charts` **1.4.64** - Analytics visualizations
- `react-native-health` **1.19.0** - HealthKit integration (iOS)
- `react-native-reanimated` **4.1.1** - Smooth animations
- `react-native-gesture-handler` **2.28.0** - Touch interactions
- `react-native-svg` **15.12.1** - Vector graphics (for charts and breathing ring)
- `expo-file-system` **19** - File access for sync and exports
- `expo-document-picker` **14** - PDF uploads for reader

### Architecture Overview

**Feature-based organization** - Each major feature lives in `features/[name]/`:
- `[Feature]Screen.tsx` - Main UI component
- `database.ts` - SQLite queries specific to that feature
- `types.ts` - TypeScript interfaces
- `hooks/use[Feature].ts` - Custom React hooks encapsulating business logic
- `components/` - Feature-specific reusable components

**Expo Router file-based routing** - Pages in `app/` map directly to routes:
- `app/index.tsx` → `/` (home screen)
- `app/habits.tsx` → `/habits`
- `app/hard-moment.tsx` → `/hard-moment`
- `app/_layout.tsx` → root layout (tab bar + hard moment floating button)

**Shared components** in `components/`:
- `AppHeader.tsx` - Consistent page headers with back button
- `ModalSurface.tsx` - Modal container with proper theming
- `CalendarGrid.tsx` - Generic calendar component used by habits, sobriety, analytics
- `HeatmapGrid.tsx` - Year heatmap used by analytics
- `common/` - Loading, error, and empty state components

**Utilities** in `utils/`:
- `date.ts` - Formatting, weekStart, isToday, day/week/month calculations
- `format.ts` - Number formatting (formatCompact, formatStepsLeft)
- `comparison.ts` - Calculate trends (week-over-week, month-over-month)
- `sorting.ts` - Generic sort helpers

**Core libraries** in `lib/`:
- `database/` - SQLite initialization, migrations, connection management
- `sync/` - iCloud sync orchestration
- `settings/` - Settings database queries and defaults
- `dashboard.ts` - Aggregates data from all modules for home screen
- `analytics.ts` - Calculates daily/weekly/monthly scores and suggestions
- `cardConfigs.tsx` - Dashboard card configuration (icons, colors, subtitle logic)
- `modules.ts` - Single source of truth for all app modules and their metadata

### Database Schema

**SQLite tables:**
- `habits` + `habit_history` - Habit tracking with daily completion records
- `sobriety_counters` + `sobriety_history` - Counter definitions and daily tracking
- `inventory_entries` - Morning, nightly, and step 10 inventories
- `daily_check_ins` - Daily check-in with commitment type, challenge, plan, TODO
- `trusted_contacts` - Emergency contacts for hard moment
- `steps_data` - Daily step counts (HealthKit + manual)
- `workouts` - Workout logs
- `fasting_sessions` - Fasting start/end times
- `gratitude_entries` - Gratitude journal entries
- `stoic_entries` - Stoic Handbook reflections per week/day
- `app_settings` - Key-value store for goals, visibility, UI preferences

**Automatic migrations** - Numbered migration files in `lib/database/migrations/`:
- Applied on app startup in sequence
- Tracked in `schema_migrations` table
- Safe to re-run (checks if migration already applied)

### Sync Strategy

**iCloud Drive sync:**
- Database file uploaded to `iCloud Drive/LifeTrackPro/lifetrack.db`
- Background sync on app startup and after data changes
- Conflict resolution: newest file wins (based on modification time)
- Fallback: If iCloud unavailable, app works offline with local data
- User can manually export/import JSON as additional backup

**Privacy:**
- No telemetry, no analytics, no external servers
- iCloud sync is end-to-end encrypted by Apple (not accessible to app developers)
- Data never leaves user's devices or iCloud account

### Theme System

**CSS variables defined in `theme.ts`:**
- Light mode: warm off-white background (#FCF9F2), dark brown text, brass accent (#B48C3C)
- Dark mode: warm charcoal background (#16120C), soft off-white text, lighter brass (#D4B26A)
- All colors are warm-toned (no pure black, no pure white, no cool grays)
- Applied via NativeWind: `className="bg-background text-foreground"`

**Modal theming:**
- Modals use opaque backgrounds (not transparent overlays)
- `ModalSurface` applies theme vars to modal content
- Consistent across all modal screens

### Code Quality

**TypeScript strict mode** - `tsconfig.json` has all strict flags enabled  
**ESLint** - `eslint-config-expo` with recommended rules  
**Prettier** - Consistent formatting (including Tailwind class sorting via plugin)  

**No inline styling** except for dynamic values (e.g., width percentages, animations)  
**No hardcoded colors** - All colors use theme variables  
**No duplicate helpers** - (See CODEBASE_APPRAISAL.md for refactoring opportunities)

## Setup & Development

### Prerequisites

- **Node.js 18+** or **Bun**
- **iOS Simulator** (macOS only) or **Android Emulator** or **physical device**
- **Xcode** (for iOS development, macOS only)
- **Android Studio** (for Android development)

### Installation

```bash
# Clone the repository
cd JustForToday

# Install dependencies
npm install
# or
bun install
```

### Running the App

```bash
# Start Expo dev server
npm start
# or
bun start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (limited functionality)
npm run web

# Run with tunnel (for physical device testing over different networks)
npm run start:tunnel
```

### Code Quality Commands

```bash
# Format all files
npm run format

# Check formatting without changing files
npm run format:check

# Lint code
npm run lint

# Type check (no output = success)
npx tsc --noEmit
```

### First Launch

On first app launch:
1. **Database auto-initializes** with all tables and default data
2. **Module tracking start dates** set to today (so graphs start clean)
3. **iCloud sync** initializes (if available)
4. **Default readings** loaded into grounding readings list

### Testing on Device

**iOS (requires macOS and Apple Developer account):**
1. Connect iPhone via USB
2. `npx expo run:ios --device`
3. Trust developer certificate in device settings
4. HealthKit permissions will prompt on first use
5. iCloud sync requires iCloud Drive enabled on device

**Android:**
1. Enable Developer Mode and USB Debugging on device
2. Connect via USB
3. `npx expo run:android --device`
4. Note: HealthKit features unavailable; step tracking requires manual entry

## Known Limitations

- **HealthKit iOS-only** - Step tracking on Android requires manual entry
- **iCloud iOS-only** - Android users should use manual export/import
- **Web limited** - Many features (database, file system, health) unavailable on web
- **Simulator limitations** - HealthKit does not work in iOS Simulator; test on device
- **Large PDFs** - Reader performance degrades with very large PDF files (>50MB)

## Privacy & Data

- **No servers** - All data stored locally in SQLite database
- **No analytics** - No tracking, no telemetry, no usage data collected
- **No ads** - Never
- **iCloud optional** - Sync is entirely user-controlled and can be disabled
- **Export anytime** - Full data export available in Settings → Data Management
- **Open source** - Code available for audit (private repository)

## Roadmap Ideas

(Not committed; ideas for potential future improvements)

- Android auto-sync via Google Drive or local wifi sync
- Apple Watch complications for quick check-in
- Shortcuts integration for Siri check-in
- Widget for countdown timers
- Better PDF rendering (switch from WebView to native renderer)
- Step work reading library (built-in Big Book text, not just links)
- Meeting finder integration
- Service hour tracking
- Multi-device real-time sync (beyond iCloud's eventual consistency)

## Contributing

This is a private project. If you have access and want to contribute:

1. **Read `CODEBASE_APPRAISAL.md`** first - Understand current architecture and conventions
2. **Check `IMPLEMENTATION_STATUS.md`** - See what's implemented and what's not
3. **Follow existing patterns** - Feature-based structure, TypeScript strict, shared utilities
4. **Write migrations** - Never alter schema directly; add numbered migration files
5. **Test on device** - Always test HealthKit and iCloud features on real device

## Support

For issues, questions, or suggestions, contact the maintainer (private repository).

## License

Private / Proprietary

## Version

**2.0.0** - Clean architecture with SQLite, iCloud sync, and feature-based organization

---

*Built with care for those on the journey.*

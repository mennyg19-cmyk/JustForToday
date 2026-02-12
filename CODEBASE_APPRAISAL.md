# Codebase Appraisal — Refactoring & Consistency

Brutal, honest review of the Just For Today codebase: helpers, file structure, styling, and consistency.

---

## 1. Single-use helpers that should be shared

### Date/time formatting (duplicated in 4+ places)

- **`utils/date.ts`** has `formatDateDisplay`, `formatDateShort`, `formatDateWithWeekday` (date only).
- **`features/fasting/utils.ts`** has `formatDateTimeDisplay(iso)`, `formatTimeDisplay(iso)` — same idea as above but for ISO strings with time. Used by FastingScreen and DateTimePickerBlock.
- **`features/gratitude/GratitudeScreen.tsx`** defines local `formatGratitudeDate(isoDate)` using `toLocaleDateString` (weekday + long date). Could use a shared formatter (e.g. extend `utils/date` with `formatDateWithWeekdayLong` or take options).
- **`features/sobriety/components/CounterDetailModal.tsx`** (lines 271–276) inlines `toLocaleDateString` + `toLocaleTimeString` for "Tap to select date & time". Same as fasting’s `formatDateTimeDisplay` — should use one shared function.
- **`lib/analytics.ts`** uses raw `toLocaleDateString` for chart labels (month/short, year/2-digit, etc.). Could use small helpers from `utils/date` for consistency.

**Recommendation:** Add `formatDateTimeDisplay(iso)` and `formatTimeDisplay(iso)` to `utils/date` (or `utils/format`), and have fasting/utils re-export or call those. Use them in CounterDetailModal and GratitudeScreen (and optionally in analytics). Remove duplicate inline formatting.

### `isToday` (three implementations)

- **`utils/date.ts`** — `isToday(date)` using **local** date (getDate/getMonth/getFullYear).
- **`lib/dashboard.ts`** — local `isToday(isoDate)` using **UTC** (getUTCDate, etc.). Different semantics; can give wrong day near midnight.
- **`features/gratitude/GratitudeScreen.tsx`** — same UTC-based `isToday(isoDate)`.

**Recommendation:** Pick one semantics (local is usually what users expect). Use `utils/date` `isToday` everywhere. If ISO strings are used, parse with `new Date(iso)` and pass to `isToday` (utils already accepts Date | string). Remove the two duplicate implementations and fix dashboard/gratitude to use `isToday` from `@/utils/date`.

### Week start (Sunday)

- **`utils/date.ts`** — `getWeekStart(date)` returns Sunday (start of week).
- **`features/stoic/weekUtils.ts`** — private `getSundayBefore(d)` does the same thing.

**Recommendation:** In `weekUtils.ts`, import `getWeekStart` from `@/utils/date` and use it instead of `getSundayBefore`. Delete `getSundayBefore`.

### `daysSince` (dashboard only)

- **`lib/dashboard.ts`** has a local `daysSince(startDate)` for sobriety. Could live in `utils/date` as `daysBetween(startDate, endDate?)` or `daysSince(startDate)` for reuse (e.g. other “days since” UIs).

**Recommendation:** Optional: add `daysSince(start: Date | string)` to `utils/date` and use it in dashboard.

### Comparison helpers

- **`utils/comparison.ts`** — `compareWeeks` and `compareMonths` are one-liners that call `calculateTrend`. Not wrong, but they don’t add logic.

**Recommendation:** Either keep for semantic API or remove and call `calculateTrend` directly from HabitCard. Low priority.

---

## 2. Helpers grouped correctly?

- **`utils/`** — date, format, comparison, sorting: good. Well exported via `utils/index.ts`.
- **Feature-level utils:**  
  - `features/fasting/utils.ts` — duration/time formatting and fasting-specific helpers. Some of it (date/time display) belongs in `utils/date`.  
  - `features/gratitude/similarity.ts` — domain-specific; fine where it is.  
  - `features/stoic/weekUtils.ts` — week numbers; fine, but should use `getWeekStart` from utils.
- **`lib/dashboard.ts`** — contains private `daysSince` and `isToday`; those could move to `utils/date` so “date math” lives in one place.

**Verdict:** Mostly good. Move generic date/time display and “today”/week logic into `utils`; keep feature-specific logic in features.

---

## 3. File structure

- **App routes** — `app/*.tsx` with clear names (index, analytics, fasting, gratitude, habits, inventory, settings, sobriety, steps, stoic). Good.
- **Features** — Each feature has screen, hooks, database, sometimes components and utils. Inconsistent:  
  - habits and sobriety have `index.ts`; others don’t. Not a problem, but you could add index re-exports for cleaner imports.
- **`lib/`** — Holds shared app logic (dashboard, analytics, database, settings, theme, sync). Good.
- **`components/`** — Mix of shared (AppHeader, ModalSurface, MetricCard, HeatmapGrid) and `common/` (LoadingView, ErrorView, EmptyState). Structure is fine; the issue is **usage** (see below).

**Verdict:** Structure is fine. No major reshuffling needed; focus on consistent use of shared components and utils.

---

## 4. Styles and “main stylesheet” consistency

- **Theme:** `theme.ts` with CSS variables and `tailwind.config.js` extending colors/fonts/shadows is the real “main stylesheet.” `global.css` only pulls in Tailwind. So styling is **driven by theme + Tailwind**, not a single classic CSS file. That’s consistent with the stack.

### Inconsistencies

1. **Card style (biggest issue)**  
   The same card look is repeated in many places with small variations:
   - `app/analytics.tsx`: `const cardClass = 'rounded-2xl p-4 bg-card border border-border mb-4'`
   - `features/stoic/StoicScreen.tsx`: same `cardClass`.
   - `features/steps/StepsScreen.tsx`: `const cardClass = 'rounded-2xl p-4 bg-card border border-border'` (no mb-4).
   - `features/settings/SettingsScreen.tsx`: `const cardClass = 'bg-card rounded-xl p-4 border border-border'` (**rounded-xl**, not 2xl).
   - `components/MetricCard.tsx`: `const CARD_CLASS = 'rounded-2xl p-4 bg-card border border-border'`.
   - FastingScreen, GratitudeScreen, InventoryScreen, BigBookPassage, SobrietyCard: inline `rounded-2xl p-4/p-5 bg-card border border-border` (sometimes `rounded-xl`, `p-3`, `shadow-card`).

   So you have **multiple local constants** and **inline copies** with inconsistent radius (xl vs 2xl), padding (p-3 vs p-4 vs p-5), and optional shadow. That will drift over time.

   **Recommendation:** Define one or two shared constants, e.g. in `lib/constants.ts` or `theme.ts`:
   - `CARD_CLASS = 'rounded-2xl p-4 bg-card border border-border'`
   - Optionally `CARD_CLASS_WITH_MARGIN = CARD_CLASS + ' mb-4'`.
   Use them in every screen and in MetricCard. Use a single choice for radius (e.g. always `rounded-2xl` for standard cards).

2. **Loading and error states**  
   - **HabitsScreen** uses `LoadingView` and `ErrorView` from `@/components/common`.
   - **Steps, Fasting, Gratitude, Inventory, Settings, Sobriety** each implement their own loading (SafeAreaView + ActivityIndicator) and error (SafeAreaView + AppHeader + “Failed to load” + text). Copy-paste with minor differences (e.g. Sobriety uses AlertCircle icon).
   - **LoadingView** doesn’t accept a `color` prop; some screens pass `color={iconColors.primary}` to ActivityIndicator, others don’t.

   **Recommendation:** Use `LoadingView` and `ErrorView` everywhere. Add optional `color` (or `tintColor`) to `LoadingView` so it matches the rest of the app. Optionally add a small “screen with header” wrapper that handles loading/error so screens don’t repeat the same block.

3. **Inline `style={{}}`**  
   Used where dynamic values are needed (e.g. `width: ${pct}%`, `maxHeight`, `aspectRatio`). That’s fine. A few places mix theme with hardcoded values:
   - **HabitCalendar.tsx** — `backgroundColor: '#8B5CF6'` and `fontSize: 14`. Prefer theme (e.g. `bg-primary`) and Tailwind `text-sm` so dark mode and theme changes stay consistent.
   - **ErrorView** — Retry button uses `text-white`; should use `text-primary-foreground` so it respects theme.

4. **ModalSurface**  
   Uses `StyleSheet` for layout (overlay, positioning) and `className` for theme. Reasonable mix; no change needed.

**Verdict:** Theming is centralized; **card style and loading/error UI are not**. Centralize card class(es) and standardize on LoadingView/ErrorView.

---

## 5. Other issues

### DEFAULT_GOALS defined in three places

- **`features/settings/constants.ts`** — exported, used in SettingsScreen for placeholders.
- **`lib/settings/database.ts`** — private const, used in `getGoals()`.
- **`lib/database/asyncFallback/settings.ts`** — private const, used in `getGoalsAsync()`.

If you change a default (e.g. steps 10000 → 8000), you must remember to change it in three files. High risk of drift.

**Recommendation:** Define `DEFAULT_GOALS` once (e.g. in `lib/settings/constants.ts` or in `lib/settings/database.ts` and export it). Import in the other two and in `features/settings/constants.ts` (re-export for Settings if desired).

### GratitudeScreen local helpers

- **`renderSection`** — Renders a card + title + empty state or list. Only used inside GratitudeScreen. Could stay local or be a small shared `SectionCard` in `components/common` if you want the same pattern elsewhere.
- **`useDeleteEntry`** — Small hook; fine to keep in the screen file.

### FastingScreen card wrapper

- **`function Card({ children, className })`** wrapping a card View. Only used in FastingScreen. Could be replaced by using the shared card class and a single `View` with that class + `className`.

### format.ts

- **`formatStepsLeft`** is steps-specific but lives in generic `utils/format`. Acceptable; the name makes the use case clear. No change required.

---

## 6. Summary table

| Area              | Issue                                      | Severity | Fix |
|-------------------|--------------------------------------------|----------|-----|
| Card style        | Repeated in 10+ places, xl vs 2xl, p-3/4/5 | High     | Single CARD_CLASS (and optional variant), use everywhere. |
| Loading/Error     | Only Habits uses common components         | High     | Use LoadingView/ErrorView everywhere; add color to LoadingView. |
| Date/time format  | formatDateTimeDisplay, formatTimeDisplay, inlines | Medium   | Centralize in utils/date; use in fasting, sobriety, gratitude, analytics. |
| isToday           | Three implementations (local vs UTC)       | Medium   | Use utils/date isToday everywhere; fix dashboard/gratitude. |
| DEFAULT_GOALS     | Defined in 3 files                         | Medium   | Single source; import elsewhere. |
| getSundayBefore   | Duplicate of getWeekStart                  | Low      | Use getWeekStart in weekUtils. |
| ErrorView button  | text-white                                 | Low      | Use text-primary-foreground. |
| HabitCalendar     | Hardcoded #8B5CF6, fontSize                | Low      | Use theme + Tailwind. |

---

## 7. Overall verdict

- **Strengths:** Clear feature folders, good use of `utils` for date/format/sorting, theme and Tailwind are set up sensibly, and most logic is in the right place (hooks, database, lib).
- **Weaknesses:** Card styling and loading/error UI are copy-pasted and will drift; date/time and “today” logic are duplicated; DEFAULT_GOALS is triplicated; a few hardcoded colors/fonts.

The codebase is in good shape for a refactor pass: no need to restructure folders, but **centralizing card style, loading/error, date helpers, and DEFAULT_GOALS** will improve consistency and maintainability a lot. Doing that will make the app feel more coherent and make future theme/layout changes easier.

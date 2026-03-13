# Revamp Implementation Plan

## Goal

Revamp the Expo React Native app into a cleaner, more scalable "personal OS"
experience by:

- keeping the current Expo/Supabase foundation,
- porting selected BELTECH product ideas and UI patterns,
- refactoring oversized route files into feature-owned modules,
- improving safety, consistency, and maintainability before deeper redesign.

## Guiding Decisions

- Use this repository as the implementation base.
- Use BELTECH as the product and UX reference, not as a direct architectural copy.
- Keep Expo Router route files thin.
- Move screen logic into `src/features/<feature>/components`.
- Keep Supabase access in feature services and shared infra in `src/lib`.

## Target Product IA

Primary tabs:

1. Home
2. Calendar
3. Finance
4. Tasks
5. Assistant
6. Profile

Secondary routed tools:

- Settings
- Analytics
- Budgets
- Recurring
- Export
- Income

## BELTECH Ideas To Port

### UI

- Dark glassmorphism baseline
- Layered gradient backgrounds
- Frosted cards with stronger hierarchy
- Dashboard-first Home experience
- Tools/settings hub rather than hiding all extra capability in tabs

### Features

- Dedicated assistant chat experience
- Richer profile/settings area
- Budget alerts and daily digest logic
- Broader recurring engine beyond only tasks
- Analytics as a routed tool rather than a primary tab

## Target Feature Structure

```text
apps/mobile/src/
  components/
    ui/
  features/
    auth/
      components/
      hooks/
      services/
      schemas/
    home/
      components/
      hooks/
      selectors/
    tasks/
      components/
      hooks/
      services/
      utils/
    calendar/
      components/
      hooks/
      services/
      utils/
    finance/
      components/
      hooks/
      services/
      utils/
    assistant/
      components/
      hooks/
      services/
    analytics/
      components/
      hooks/
      services/
    profile/
      components/
      hooks/
      services/
    settings/
      components/
      hooks/
      services/
    recurring/
      components/
      hooks/
      services/
  hooks/
  lib/
  store/
```

## Phases

### Phase 1: Foundation Hardening

- Remove hardcoded backend configuration fallbacks
- Tighten biometric lock behavior
- Clean obvious code artifacts
- Install dependencies and restore validation

Status:

- Completed

### Phase 2: Structural Refactor

- Thin Expo route files
- Move tab screen implementations into feature-owned screen components
- Break giant screens into reusable sections
- Prepare shared UI system for redesign

Status:

- In progress

Completed so far:

- Home extracted to `src/features/home/components/HomeScreen.tsx`
- Tasks extracted to `src/features/tasks/components/TasksScreen.tsx`
- Calendar extracted to `src/features/calendar/components/CalendarScreen.tsx`
- Profile extracted to `src/features/profile/components/ProfileScreen.tsx`
- Insights extracted to `src/features/insights/components/InsightsScreen.tsx`
- Finance extracted to `src/features/finance/components/FinanceScreen.tsx`

Next targets:

- Break `Finance` and `Insights` into smaller sections/components
- Add `assistant`, `settings`, `analytics`, and `recurring` feature shells
- Start shared UI token refresh before screen-by-screen redesign

### Phase 3: UI System Refresh

- Expand theme tokens
- Rework `GlassCard`, buttons, chips, inputs, banners, loaders
- Add page shell/header patterns
- Introduce stronger spacing and visual hierarchy

### Phase 4: Navigation and IA Revamp

- Replace `Insights` tab with `Assistant`
- Route analytics and tools into secondary screens
- Add settings/tooling entry points from Home/Profile

### Phase 5: Product Capability Port

- Assistant chat
- Richer profile/settings
- Budget alerts and digest
- Recurring engine expansion
- Export/income tools polish

## UI Porting Decisions

### Keep From The Current React Native App

- The floating bottom tab bar as the base navigation shell
- The dark glass baseline and blur-backed cards
- Existing shared primitives like `GlassCard`, `Button`, `TextInput`, and `Capsule`

### Port And Adapt From BELTECH

- Layered gradient page backgrounds with a tab-aware accent glow
- Stronger card hierarchy with accent and standard glass variants
- Dashboard-first Home composition instead of a flatter utility layout
- Assistant as a first-class tab instead of keeping Insights as a primary destination
- A richer Profile/Settings tool hub with account, preferences, exports, and analytics entry points

### Do Not Port 1:1

- Flutter navigation patterns
- Flutter-specific theme structure
- Polling-oriented data flow
- Large single-screen files that combine layout, forms, charts, and data logic

## Immediate UI Targets

- Expand `src/lib/theme.ts` from simple tokens into semantic surface, border, glow, and accent variants
- Upgrade `src/components/ui/GlassCard.tsx` to support standard and accent tones, stronger shadows, and more consistent border treatment
- Add a reusable page shell/background wrapper so tab screens share the same atmosphere
- Update `src/components/ui/FloatingTabBar.tsx` to support the future tab swap from `Insights` to `Assistant`

## Quality Gates

- `npm run typecheck` must pass after each extraction batch
- Route files should become thin wrappers only
- New feature screens should live under `src/features/*/components`
- Avoid adding new oversized screen files
- Keep secrets out of source

## Current Risks

- No automated tests yet
- ESLint is referenced in scripts but not installed/configured
- Finance and Insights remain oversized and should be split before major UI changes
- Assistant tab and settings/tool hub are not yet implemented

# Personal OS

Mobile-first personal management app built with Expo React Native, Supabase, and AI insights.

## What This Project Includes

This repository is a Turborepo monorepo with:

- Mobile app (`apps/mobile`) using Expo Router.
- Shared domain types package (`packages/types`).
- Supabase SQL migrations and an Edge Function (`supabase`).
- Android SMS import support for M-Pesa transactions (Android builds only).

## Current Feature Coverage

Implemented and working in code:

- Authentication
  - Email/password sign up, sign in, sign out.
  - Forgot password flow.
  - Session bootstrap and auth state listener at app root.
  - Secure token persistence on device using `expo-secure-store`.
- Task Management
  - CRUD for tasks with category/priority/status.
  - Search + category filtering.
  - Recurring tasks (`daily|weekly|monthly|yearly`) with next-instance auto-creation when completed.
  - Swipe actions (toggle status / delete).
  - Deadline countdown labels and due-date badges.
  - Local task notifications (1h and 10m before deadline).
- Calendar
  - CRUD for events.
  - Month/Week/Day views.
  - Selected-day strip showing both events and task deadlines.
  - Event notifications (1h and 10m before start time).
- Finance
  - Transaction CRUD (income/expense).
  - Date filters (`today|week|month|year|all`).
  - Search across category, description, and M-Pesa code.
  - Summary metrics (income, expense, balance, savings rate).
  - Category breakdown and weekly spending chart.
  - CSV export + share.
  - Budget per category (`budgets` table + upsert flow).
- M-Pesa SMS Import (Android)
  - Manual SMS scan modal with preview and selective import.
  - Duplicate prevention via `mpesa_code`.
  - Parser error logging to `sms_parse_errors`.
  - Background auto-import task via `expo-background-fetch`/`expo-task-manager`.
  - Gradle compatibility patch for `react-native-get-sms-android`.
- Insights
  - AI insights fetched from Supabase Edge Function (`ai-insights`).
  - Analytics charts for task completion, spending trend, and weekly learning hours.
  - Learning sessions tracking (create/toggle/delete).
- App UX Foundations
  - React Query offline-first behavior with retries and reconnect refetch.
  - Offline banner driven by network state.
  - Error boundary + centralized error-message mapping.
  - Biometric lock screen when app returns from background.
  - OTA update check using `expo-updates` in production.

## Architecture

### Monorepo Structure

```text
.
├─ apps/
│  └─ mobile/                 # Expo React Native app
├─ packages/
│  └─ types/                  # Shared TypeScript domain types
├─ supabase/
│  ├─ migrations/             # SQL schema and incremental migrations
│  └─ functions/ai-insights/  # Edge Function that calls OpenAI
├─ patches/                   # patch-package fixes
├─ turbo.json                 # Turborepo task pipeline
└─ package.json               # Workspace root
```

### Mobile App Layers

```text
app/(routes) -> hooks -> services -> Supabase tables/functions
            \-> UI components -> lib (theme, notifications, errors)
```

- Routes/screens live under `apps/mobile/app`.
- Business logic is in `apps/mobile/src/features/*`.
- Data fetching/mutations are React Query hooks in each feature.
- Supabase access is encapsulated in feature service files.
- Global auth/session state uses Zustand (`auth.store.ts`).

## Tech Stack

- Mobile: Expo SDK 55, React Native 0.83, React 19, Expo Router.
- State/data: Zustand + TanStack React Query.
- Forms/validation: React Hook Form + Zod.
- UI: NativeWind + custom themed components (`GlassCard`, `Capsule`, etc.).
- Backend: Supabase Postgres + Auth + RLS + Edge Functions.
- AI: OpenAI API called only from Supabase Edge Function.
- Build/monorepo: Turborepo + npm workspaces.

## Data Model and Security

### Core Tables

From migrations:

- `tasks`
  - Includes recurrence fields: `recurring`, `frequency`, `recurring_parent_id`.
- `events`
  - Calendar events with optional `related_task_id`.
- `transactions`
  - Financial records with `source`, `mpesa_code`, `auto_imported`.
- `learning_sessions`
  - Topic, duration, completed status.
- `sms_parse_errors`
  - Failed parser rows for diagnostics.
- `budgets`
  - Category budget amount and period.

### RLS

All user-scoped tables enforce row-level security with policies equivalent to:

- `SELECT`: `auth.uid() = user_id`
- `INSERT`: `WITH CHECK (auth.uid() = user_id)`
- `UPDATE`/`DELETE`: `auth.uid() = user_id`

This keeps each user isolated to their own records.

## How Key Features Are Implemented

### Auth Flow

- `app/_layout.tsx`:
  - Bootstraps session with `supabase.auth.getSession()`.
  - Subscribes to `onAuthStateChange`.
  - Stores session/user in Zustand auth store.
- `app/index.tsx`:
  - Redirects to `/(tabs)` if session exists, else `/(auth)/login`.

### Tasks + Recurrence

- Query/mutation hooks in `src/features/tasks/tasks.hooks.ts`.
- Data access in `src/features/tasks/tasks.service.ts`.
- Recurring behavior:
  - When a recurring task is marked done, `tasks.tsx` computes next deadline using `getNextDeadline(...)` and inserts the next instance automatically.

### Calendar

- Calendar screen (`app/(tabs)/calendar.tsx`) renders month/week/day modes.
- Uses `events` + `tasks` to show both events and deadline indicators.
- Event reminders are scheduled/cancelled from mutation hooks.

### Finance + Budgets

- Transactions queried by period in `finance.service.ts`.
- Client-side aggregates:
  - summary totals,
  - category breakdown,
  - daily trend.
- Budgets in dedicated table + upsert flow (`budget.service.ts`).

### M-Pesa SMS Pipeline

1. Request SMS permissions (Android).
2. Read messages from sender `MPESA`.
3. Parse via regex rules (`mpesa-parser.ts`).
4. Skip duplicates based on existing `mpesa_code`.
5. Log parse failures to `sms_parse_errors`.
6. User confirms selected rows in preview modal.
7. Bulk insert confirmed rows into `transactions`.

Background mode uses `sms-background.task.ts` with 15-minute fetch intervals.

### Notifications

- Uses lazy-loaded `expo-notifications`.
- No-op in Expo Go, active in dev/prod builds.
- Schedules:
  - task reminders at -1h and -10m.
  - event reminders at -1h and -10m.

### AI Insights

- Mobile calls `supabase.functions.invoke('ai-insights')`.
- Edge function:
  - reads user transactions/tasks/learning data,
  - computes summary metrics,
  - prompts OpenAI (`gpt-4o-mini`),
  - returns 5 structured insight cards.
- `OPENAI_API_KEY` is stored as Supabase secret (server-side only).

## Build and Run

## Prerequisites

- Node.js 18+
- npm 11+
- Android Studio + SDK (for local Android builds)
- EAS CLI (for cloud builds)

## Setup

```bash
npm install
```

Create env file for mobile app:

```bash
copy apps\mobile\.env.example apps\mobile\.env
```

Required env values:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Run Mobile App

```bash
cd apps/mobile
npm run android
```

## Build APK (EAS, recommended)

`apps/mobile/eas.json` already defines:

- `preview` profile -> Android `apk`
- `production` profile -> Android app bundle (`aab`)

Commands:

```bash
cd apps/mobile
npx eas login
npx eas build --platform android --profile preview
```

## Build Debug APK Locally (without emulator dependency)

```bash
cd apps/mobile/android
gradlew.bat assembleDebug
```

APK output path:

```text
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## APK/Gradle Compatibility Note

This repo includes:

- `patches/react-native-get-sms-android+2.1.0.patch`

It replaces `jcenter()` with `mavenCentral()` in the SMS library Gradle file to avoid modern Gradle build failures.

Root `postinstall` runs `patch-package`, and `apps/mobile` Android script also applies patch before build.

## Supabase Setup

Apply migrations in order from:

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_sms_parse_errors.sql`
- `supabase/migrations/003_budgeting_v1.sql`
- `supabase/migrations/004_recurring_tasks.sql`

Deploy edge function:

```bash
supabase functions deploy ai-insights
supabase secrets set OPENAI_API_KEY=your_key_here
```

## Scripts

Workspace root:

- `npm run dev` -> turbo dev
- `npm run build` -> turbo build
- `npm run lint` -> turbo lint
- `npm run typecheck` -> turbo typecheck

Mobile app (`apps/mobile/package.json`):

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`

## Notes and Operational Constraints

- SMS import/background SMS requires Android dev/prod build (not Expo Go).
- Notification scheduling is also no-op in Expo Go.
- AI insights require deployed Edge Function and `OPENAI_API_KEY` secret.
- Offline mode serves cached React Query data and auto-refetches on reconnect.

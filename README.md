# ⚡ Personal OS

A mobile-first Personal Operations System built with React Native (Expo), Supabase, and AI.

## Tech Stack

- **Mobile:** React Native (Expo) + Expo Router + TypeScript (strict)
- **Styling:** NativeWind (Tailwind for RN)
- **State:** TanStack React Query + Zustand
- **Forms:** React Hook Form + Zod
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **AI:** OpenAI API (server-side via Edge Functions)
- **Monorepo:** Turborepo

## Features (Roadmap)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Auth + Tasks + Home Dashboard | ✅ Done |
| 2 | Calendar & Events | 🔜 Next |
| 3 | M-Pesa Expense Tracker (Manual) | 🔜 |
| 4 | SMS Auto-Import (Android) | 🔜 |
| 5 | AI Insights | 🔜 |
| 6 | Optimization & Hardening | 🔜 |

## Project Structure

```
/apps
  /mobile          → Expo React Native app
/packages
  /types           → Shared TypeScript types
/supabase
  /migrations      → PostgreSQL schema migrations
  /functions       → Edge Functions (AI, secure ops)
```

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env` in `apps/mobile/` and fill in Supabase credentials
3. Run the database migrations in Supabase SQL editor
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the mobile app:
   ```bash
   cd apps/mobile && npm run android
   ```

### Android build note (Gradle 9+)

`react-native-get-sms-android` still references `jcenter()` in its Gradle file, which fails on newer Gradle versions. This repo includes a `patch-package` fix that swaps `jcenter()` for `mavenCentral()`.

Use the provided `npm run android` script (from `apps/mobile`) so the patch is re-applied before building.

## Database Setup

Run `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.

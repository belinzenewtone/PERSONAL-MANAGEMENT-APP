# Home

Purpose: dashboard entry point for daily productivity, finance summary, and quick navigation.

Main components:
- `components/HomeScreen.tsx`
- `components/HomeDashboardSections.tsx`

Dependencies and integration points:
- Reads auth data from `src/store/auth.store.ts`
- Aggregates task and finance hooks from other features
- Serves as the default tab landing screen

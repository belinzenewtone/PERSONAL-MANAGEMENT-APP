# Recurring

Purpose: reusable templates that materialize into tasks, events, expenses, or
income records on schedule.

Main modules:
- `recurring.service.ts`
- `recurring.hooks.ts`
- `components/RecurringScreen.tsx`

Integration points:
- Uses task, calendar, and finance tables via the recurring template service
- Can materialize due templates on app launch or when the recurring tool opens

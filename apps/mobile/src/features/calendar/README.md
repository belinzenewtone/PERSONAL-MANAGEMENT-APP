# Calendar

Purpose: calendar event creation, editing, deletion, and month/week/day planning views.

Main components:
- `components/CalendarScreen.tsx`
- `components/CalendarViews.tsx`
- `components/EventFormModal.tsx`
- `components/EventDetailModal.tsx`
- `calendar.hooks.ts`

Dependencies and integration points:
- Uses calendar data hooks and service layer under this feature
- Reads task deadlines from `features/tasks`
- Exposed through the Calendar tab route

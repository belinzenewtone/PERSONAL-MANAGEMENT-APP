# Tasks

Purpose: task creation, editing, status changes, recurring handling, and list management.

Main components:
- `components/TasksScreen.tsx`
- `components/TaskCard.tsx`
- `components/TaskModal.tsx`
- `tasks.hooks.ts`
- `tasks.service.ts`

Dependencies and integration points:
- Exposed through the Tasks tab route
- Feeds deadline and progress data into Home and Insights
- Calendar reads task deadlines for shared planning views

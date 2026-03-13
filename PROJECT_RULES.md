# PROJECT_RULES.md

## Engineering Rules for the React Native Revamp

This document defines the working rules for the Expo/React Native project.
It adapts the strongest engineering constraints from the Flutter codebase to
the current stack and repository layout.

## Scope

- Applies to code under this repository.
- `AGENTS.md` controls agent behavior and workflow.
- `PROJECT_RULES.md` controls architecture, structure, quality, and maintainability.
- When both apply, follow both. If they conflict, use the stricter engineering rule unless an explicit written exemption is provided.

## PR-01: Project Structure

- Expo Router files must stay under `apps/mobile/app/`.
- Product code must live under `apps/mobile/src/`.
- Shared UI belongs in `apps/mobile/src/components/ui/`.
- Shared infra belongs in `apps/mobile/src/lib/`.
- Feature code belongs in `apps/mobile/src/features/<feature>/`.

## PR-02: Thin Route Files

- Files in `apps/mobile/app/` must stay thin.
- Route files should primarily:
  - export a feature-owned screen,
  - define route options,
  - compose providers/layouts that are required by routing.
- Route files must not hold large screen implementations, data orchestration, or detailed business logic.

## PR-03: Feature Isolation

- Each feature should be isolated under `apps/mobile/src/features/<feature>/`.
- A feature should prefer this structure when applicable:
  - `components/`
  - `hooks/`
  - `services/`
  - `utils/`
  - `schemas/`
- Cross-feature imports should stay limited and intentional.
- Shared abstractions should move to `src/lib` or `src/components/ui` instead of creating tangled feature dependencies.

## PR-04: File Size Rule

- No new or materially edited `.ts`, `.tsx`, `.js`, or `.jsx` file may exceed 300 lines.
- Existing legacy files already above 300 lines must not grow.
- Legacy exceptions must be listed in `tools/file-size-allowlist.json`.
- If a file exceeds 300 lines, split it by responsibility before continuing.

Allowed split strategies:

- extract presentational components,
- extract hooks,
- extract service/query logic,
- extract schemas/constants/helpers.

## PR-05: Screen Composition Rule

- Screen files should orchestrate sections, not implement every detail inline.
- Repeated UI blocks must be extracted into reusable components.
- Complex forms, charts, lists, and empty states should be separated into focused components once they make a screen hard to scan.

## PR-06: State Management Rule

- React Query owns server/cache state.
- Zustand owns app/session/global UI state when shared state is required.
- Local component state is for local view concerns only.
- Global mutable module state is forbidden for app state.
- Async flows must expose explicit loading, success, and error states.

## PR-07: Data Access Rule

- UI leaf components must not call Supabase directly.
- Data access belongs in feature services, hooks, or shared infra.
- Schema changes must go through Supabase migrations.
- Business rules should not be spread across random screen components.

## PR-08: Styling Rule

- Hardcoded feature-level color systems are forbidden.
- Shared design tokens must stay centralized in `apps/mobile/src/lib/theme.ts` or adjacent shared theme files.
- Shared surfaces must use reusable primitives such as `GlassCard`.
- When a visual pattern repeats, it should become a shared component or variant instead of being restyled ad hoc.

## PR-09: UI Direction Rule

- The default visual direction is dark glassmorphism with strong hierarchy.
- Surfaces should use shared tokens for blur, radius, border, shadow, and accent glow.
- Major transitions and state changes should remain smooth and intentional.

## PR-10: Security Rule

- Secrets must not be hardcoded in source.
- Sensitive values must use secure storage when persisted on device.
- Sensitive logs should be avoided or redacted.
- Auth and AI integration must prefer backend-mediated patterns over shipping sensitive keys to clients.

## PR-11: Error Handling Rule

- All async flows must handle failure explicitly.
- Silent failure paths are forbidden.
- User-facing operations must surface actionable errors or fallback states.

## PR-12: Testing Rule

- New or changed business logic should include tests.
- Repositories, services, parsers, and business-rule helpers are the first priority for test coverage.
- UI-only refactors do not need exhaustive tests, but logic extractions should be tested when practical.

## PR-13: Performance Rule

- Design for large datasets such as 10,000+ transactions/tasks.
- Avoid unnecessary rerenders and heavy work during render.
- Move expensive transforms into focused helpers or memoized selectors when justified.

## PR-14: Dependency Rule

- Avoid adding heavy dependencies when Expo, React Native, or current project utilities already cover the need.
- Before adding a package, verify:
  - the platform does not already cover the requirement,
  - the package is maintained,
  - the package is reliable and appropriate for production use.

## PR-15: Documentation Rule

- Every major feature should include a local `README.md` as the revamp progresses.
- A feature README should document:
  - purpose,
  - main components/hooks/services,
  - dependencies and integration points.

## Compliance Checklist

- Route files stay thin.
- No new file exceeds 300 lines.
- Legacy oversized files did not grow.
- Shared theme tokens are used instead of new hardcoded styling systems.
- Async logic has explicit loading/error handling.
- No secrets were added to source.
- Business logic changes include tests where practical.

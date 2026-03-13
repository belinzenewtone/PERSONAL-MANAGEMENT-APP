# OTA Release Flow

This app uses `expo-updates` with EAS Update channels.

## Channels

- `development`: dev client and local testing
- `preview`: internal QA builds and preview updates
- `production`: store builds and production OTA updates

## Build a binary

From `apps/mobile`:

```bash
npm run build:preview
npm run build:production
```

## Publish an OTA update

From `apps/mobile`:

```bash
npm run ota:preview -- --message "Preview update message"
npm run ota:production -- --message "Production update message"
```

## Rules

- OTA only changes JavaScript/assets. Native dependency or config changes require a new binary build.
- Keep `runtimeVersion` aligned with `appVersion` so incompatible updates do not target old binaries.
- Test on `preview` before publishing to `production`.
- Deploy required Supabase migrations and Edge Functions before shipping features that depend on them.

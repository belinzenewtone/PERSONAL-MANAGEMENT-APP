-- ─── OTA update metadata fields ────────────────────────────────────────────
-- bundle_size_bytes: shown in the update banner ("3.2 MB download")
-- changelog: array of bullet points shown in the banner ("What's new")

alter table app_updates
  add column if not exists bundle_size_bytes bigint default null,
  add column if not exists changelog text[] default null;

comment on column app_updates.bundle_size_bytes is
  'Size of the OTA JS bundle in bytes, shown in the update download banner.';

comment on column app_updates.changelog is
  'Array of bullet-point strings describing what changed, shown in the update banner.';

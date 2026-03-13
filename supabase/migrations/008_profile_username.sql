ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_username_format'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_username_format
    CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,24}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
  ON profiles (lower(username))
  WHERE username IS NOT NULL;

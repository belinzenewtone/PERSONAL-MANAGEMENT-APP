ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS merchant_category_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant text NOT NULL,
  normalized_merchant text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, normalized_merchant)
);

CREATE INDEX IF NOT EXISTS idx_merchant_category_rules_user_lookup
  ON merchant_category_rules(user_id, normalized_merchant);

ALTER TABLE merchant_category_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant_category_rules_select" ON merchant_category_rules;
CREATE POLICY "merchant_category_rules_select" ON merchant_category_rules
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "merchant_category_rules_insert" ON merchant_category_rules;
CREATE POLICY "merchant_category_rules_insert" ON merchant_category_rules
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "merchant_category_rules_update" ON merchant_category_rules;
CREATE POLICY "merchant_category_rules_update" ON merchant_category_rules
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "merchant_category_rules_delete" ON merchant_category_rules;
CREATE POLICY "merchant_category_rules_delete" ON merchant_category_rules
FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS merchant_category_rules_set_updated_at ON merchant_category_rules;
CREATE TRIGGER merchant_category_rules_set_updated_at
BEFORE UPDATE ON merchant_category_rules
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS app_updates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform text NOT NULL CHECK (platform IN ('android', 'ios')),
  current_version text NOT NULL,
  minimum_supported_version text,
  store_url text,
  title text,
  message text,
  is_force boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_updates_platform_active
  ON app_updates(platform, active, created_at DESC);

ALTER TABLE app_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_updates_select" ON app_updates;
CREATE POLICY "app_updates_select" ON app_updates
FOR SELECT USING (true);

DROP TRIGGER IF EXISTS app_updates_set_updated_at ON app_updates;
CREATE TRIGGER app_updates_set_updated_at
BEFORE UPDATE ON app_updates
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

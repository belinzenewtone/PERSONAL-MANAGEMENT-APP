CREATE TABLE IF NOT EXISTS app_client_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scope text NOT NULL,
  message text NOT NULL,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_client_events_user_created
  ON app_client_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_client_events_scope
  ON app_client_events(scope, created_at DESC);

ALTER TABLE app_client_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_client_events_select" ON app_client_events;
CREATE POLICY "app_client_events_select" ON app_client_events
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "app_client_events_insert" ON app_client_events;
CREATE POLICY "app_client_events_insert" ON app_client_events
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

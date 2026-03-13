-- ─── Profiles ────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  timezone text NOT NULL DEFAULT 'Africa/Nairobi',
  theme_mode text NOT NULL DEFAULT 'dark' CHECK (theme_mode IN ('dark', 'light', 'system')),
  notifications_enabled boolean NOT NULL DEFAULT true,
  biometric_lock_enabled boolean NOT NULL DEFAULT true,
  assistant_suggestions_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_timezone ON profiles(timezone);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_user();

INSERT INTO profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_select" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatars_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatars_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ─── Assistant Conversations ────────────────────────────────────────────────

CREATE TABLE assistant_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_conversations_user_id
  ON assistant_conversations(user_id, updated_at DESC);

ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_conversations_select" ON assistant_conversations
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assistant_conversations_insert" ON assistant_conversations
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assistant_conversations_update" ON assistant_conversations
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "assistant_conversations_delete" ON assistant_conversations
FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER assistant_conversations_set_updated_at
BEFORE UPDATE ON assistant_conversations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE assistant_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_messages_conversation_id
  ON assistant_messages(conversation_id, created_at ASC);

ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_messages_select" ON assistant_messages
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assistant_messages_insert" ON assistant_messages
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assistant_messages_delete" ON assistant_messages
FOR DELETE USING (auth.uid() = user_id);

-- ─── Recurring Templates ────────────────────────────────────────────────────

CREATE TYPE recurring_entity_type AS ENUM ('task', 'event', 'expense', 'income');
CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

CREATE TABLE recurring_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  entity_type recurring_entity_type NOT NULL,
  frequency recurring_frequency NOT NULL,
  start_date timestamptz NOT NULL DEFAULT now(),
  next_run_at timestamptz NOT NULL,
  last_run_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_templates_user_id
  ON recurring_templates(user_id, active, next_run_at);

ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_templates_select" ON recurring_templates
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring_templates_insert" ON recurring_templates
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_templates_update" ON recurring_templates
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurring_templates_delete" ON recurring_templates
FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SMS Parse Error Log
-- Stores M-Pesa SMS messages that could not be parsed.
-- Useful for improving the parser over time.
-- ============================================================

CREATE TABLE sms_parse_errors (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_body   text NOT NULL,
  reason     text NOT NULL,
  failed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_parse_errors_user_id  ON sms_parse_errors(user_id);
CREATE INDEX idx_sms_parse_errors_failed_at ON sms_parse_errors(failed_at);

ALTER TABLE sms_parse_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_errors_select" ON sms_parse_errors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sms_errors_insert" ON sms_parse_errors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sms_errors_delete" ON sms_parse_errors FOR DELETE USING (auth.uid() = user_id);

-- ─── Budgets ─────────────────────────────────────────────────────────────

CREATE TABLE budgets (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    text NOT NULL,
  amount      numeric(12, 2) NOT NULL,
  period      text NOT NULL DEFAULT 'month',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, period)
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON budgets FOR DELETE USING (auth.uid() = user_id);

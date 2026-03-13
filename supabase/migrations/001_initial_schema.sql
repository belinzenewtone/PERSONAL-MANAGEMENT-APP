-- ============================================================
-- Personal OS – Initial Schema Migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tasks ────────────────────────────────────────────────────────────────────

CREATE TYPE task_category AS ENUM ('work', 'growth', 'personal');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status   AS ENUM ('todo', 'in_progress', 'done');

CREATE TABLE tasks (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             text NOT NULL,
  description       text,
  category          task_category NOT NULL DEFAULT 'personal',
  priority          task_priority NOT NULL DEFAULT 'medium',
  estimated_minutes int,
  deadline          timestamptz,
  status            task_status NOT NULL DEFAULT 'todo',
  ticket_reference  text,
  recurring         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user_id  ON tasks(user_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_status   ON tasks(status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- ─── Events ───────────────────────────────────────────────────────────────────

CREATE TYPE event_type AS ENUM ('meeting', 'study', 'personal', 'bill');

CREATE TABLE events (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  start_time      timestamptz NOT NULL,
  end_time        timestamptz NOT NULL,
  type            event_type NOT NULL DEFAULT 'personal',
  related_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_user_id    ON events(user_id);
CREATE INDEX idx_events_start_time ON events(start_time);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_update" ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "events_delete" ON events FOR DELETE USING (auth.uid() = user_id);

-- ─── Transactions ─────────────────────────────────────────────────────────────

CREATE TYPE transaction_type   AS ENUM ('income', 'expense');
CREATE TYPE transaction_source AS ENUM ('mpesa', 'bank', 'cash');

CREATE TABLE transactions (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount           numeric(12, 2) NOT NULL,
  type             transaction_type NOT NULL,
  category         text NOT NULL,
  description      text,
  source           transaction_source NOT NULL DEFAULT 'cash',
  mpesa_code       text UNIQUE,
  auto_imported    boolean NOT NULL DEFAULT false,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_id          ON transactions(user_id);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category         ON transactions(category);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- ─── Learning Sessions ────────────────────────────────────────────────────────

CREATE TABLE learning_sessions (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic            text NOT NULL,
  duration_minutes int NOT NULL DEFAULT 0,
  completed        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);

ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_select" ON learning_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "learning_insert" ON learning_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learning_update" ON learning_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "learning_delete" ON learning_sessions FOR DELETE USING (auth.uid() = user_id);

-- ─── Analytics: Materialized Views ───────────────────────────────────────────

CREATE MATERIALIZED VIEW daily_spend_summary AS
SELECT
  user_id,
  transaction_date::date AS date,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
  SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income
FROM transactions
GROUP BY user_id, transaction_date::date;

CREATE UNIQUE INDEX ON daily_spend_summary(user_id, date);

CREATE MATERIALIZED VIEW monthly_spend_summary AS
SELECT
  user_id,
  date_trunc('month', transaction_date) AS month,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
  SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
  CASE
    WHEN SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) > 0
    THEN ROUND(
      (1 - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) /
           SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END)) * 100, 2
    )
    ELSE 0
  END AS savings_rate
FROM transactions
GROUP BY user_id, date_trunc('month', transaction_date);

CREATE UNIQUE INDEX ON monthly_spend_summary(user_id, month);

CREATE MATERIALIZED VIEW category_breakdown_monthly AS
SELECT
  user_id,
  date_trunc('month', transaction_date) AS month,
  category,
  SUM(amount) AS total
FROM transactions
WHERE type = 'expense'
GROUP BY user_id, date_trunc('month', transaction_date), category;

CREATE UNIQUE INDEX ON category_breakdown_monthly(user_id, month, category);

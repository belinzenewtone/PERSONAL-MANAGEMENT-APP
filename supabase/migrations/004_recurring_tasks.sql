-- ─── Recurring Tasks Refinement ──────────────────────────────────────────────

-- Note: 'recurring' column already exists from initial schema.
-- We only need to add 'frequency' and 'recurring_parent_id'.

ALTER TABLE tasks ADD COLUMN frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')) DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN recurring_parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

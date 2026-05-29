-- Migration 010: reminder_completions for photo update dismissal persistence
-- Run AFTER 006_create_reminders.sql

CREATE TABLE IF NOT EXISTS reminder_completions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            TEXT NOT NULL DEFAULT 'local-user',
  reminder_type       TEXT NOT NULL,
  fish_id             UUID REFERENCES user_fish(id) ON DELETE CASCADE,
  completed_for_date  DATE NOT NULL,
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reminder_completions_unique
    UNIQUE (owner_id, reminder_type, fish_id, completed_for_date)
);

CREATE INDEX IF NOT EXISTS idx_reminder_completions_lookup
  ON reminder_completions (owner_id, reminder_type, completed_for_date);

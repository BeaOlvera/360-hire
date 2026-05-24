-- 360 Hire, store structured fit result so admin overrides can regenerate the report

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS score_data JSONB;

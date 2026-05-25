-- 360 Hire, per-application overrides for assessments and competencies.
-- When NULL, the application uses the job's defaults. When set, overrides them
-- for just this candidate (e.g. shorter battery, narrower competency focus).

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS assessments_override JSONB,
  ADD COLUMN IF NOT EXISTS competencies_override JSONB;

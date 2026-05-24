-- 360 Hire, Phase 6
-- Generic evaluations: applications can exist without a job (admin assesses a candidate
-- before having a target role).
-- Culture fit: per-job target culture profile (OCAI 4-quadrant points distribution).

-- Allow nullable job_id
ALTER TABLE applications ALTER COLUMN job_id DROP NOT NULL;

-- Per-job company-culture profile, e.g. {"clan": 25, "adhocracy": 30, "market": 30, "hierarchy": 15}
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS culture_profile JSONB;

-- The assessment_responses check constraint must allow the new culture_fit code
ALTER TABLE assessment_responses
  DROP CONSTRAINT IF EXISTS assessment_responses_assessment_code_check;
ALTER TABLE assessment_responses
  ADD CONSTRAINT assessment_responses_assessment_code_check
  CHECK (assessment_code IN ('thinking_style', 'growth_orientation', 'career_values', 'culture_fit'));

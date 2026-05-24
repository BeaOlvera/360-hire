-- 360 Hire, complementary assessments (Phase 5)
-- Per-job: which tests admin has enabled.
-- Per-application: completed responses with raw answers + computed scores.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS assessments JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS assessment_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  assessment_code VARCHAR NOT NULL
                    CHECK (assessment_code IN ('thinking_style', 'growth_orientation', 'career_values')),
  language        VARCHAR NOT NULL CHECK (language IN ('en','es')),
  raw_answers     JSONB NOT NULL,
  scores          JSONB NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, assessment_code)
);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_app ON assessment_responses(application_id);

ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON assessment_responses;
CREATE POLICY "Service role only" ON assessment_responses FOR ALL USING (false);

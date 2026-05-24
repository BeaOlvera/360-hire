-- 360 Hire, initial schema
-- Separate Supabase project from 360_app. Service-role-only access (RLS enabled).
-- Safe to re-run on an empty project. Drops and policy creations are idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Jobs, role descriptions candidates are assessed against
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR NOT NULL,
  description     TEXT NOT NULL,
  competencies    JSONB,
  org_level       VARCHAR,
  language        VARCHAR NOT NULL DEFAULT 'en' CHECK (language IN ('en','es')),
  hiring_manager  VARCHAR,
  status          VARCHAR NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','closed','archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Candidates, people applying for jobs
CREATE TABLE IF NOT EXISTS candidates (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name                    VARCHAR NOT NULL,
  surname1                      VARCHAR,
  surname2                      VARCHAR,
  email                         VARCHAR NOT NULL,
  phone                         VARCHAR,
  preferred_language            VARCHAR DEFAULT 'en' CHECK (preferred_language IN ('en','es')),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_deletion_requested_at    TIMESTAMPTZ,
  data_deletion_completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(LOWER(email));

-- Applications, one candidate x one job. Holds interview token + outcome.
CREATE TABLE IF NOT EXISTS applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  token           UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status          VARCHAR NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','completed','reviewed','rejected','hired')),
  cv_url          TEXT,
  cv_text         TEXT,
  video_url       TEXT,
  fit_score       NUMERIC,
  recommendation  VARCHAR CHECK (recommendation IN ('strong_hire','hire','maybe','no_hire')),
  report_html     TEXT,
  reviewed_by     VARCHAR,
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  UNIQUE (job_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_token ON applications(token);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Messages, interview chat turns per application
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  role            VARCHAR NOT NULL CHECK (role IN ('assistant','user')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_application ON messages(application_id, created_at);

-- Audit logs (mirrors 360_app pattern)
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_type    VARCHAR NOT NULL CHECK (actor_type IN ('admin','system','candidate')),
  actor_id      VARCHAR,
  action        VARCHAR NOT NULL,
  resource_type VARCHAR NOT NULL,
  resource_id   VARCHAR,
  details       JSONB,
  ip_address    VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- AI interaction logs (EU AI Act)
CREATE TABLE IF NOT EXISTS ai_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  application_id  UUID,
  action_type     VARCHAR NOT NULL,
  model           VARCHAR NOT NULL,
  prompt_length   INTEGER,
  response_length INTEGER,
  tokens_used     INTEGER,
  duration_ms     INTEGER,
  details         JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_application ON ai_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_timestamp ON ai_logs(timestamp DESC);

-- Privacy consents (per-application; signed at interview start)
CREATE TABLE IF NOT EXISTS privacy_consents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
  consent_type    VARCHAR NOT NULL,
  consent_text    TEXT NOT NULL,
  accepted        BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at     TIMESTAMPTZ,
  ip_address      VARCHAR,
  user_agent      TEXT
);

CREATE INDEX IF NOT EXISTS idx_privacy_consents_application ON privacy_consents(application_id);

-- updated_at trigger for jobs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-level security: service-role-only (mirrors 360_app)
ALTER TABLE jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_consents  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON jobs;
DROP POLICY IF EXISTS "Service role only" ON candidates;
DROP POLICY IF EXISTS "Service role only" ON applications;
DROP POLICY IF EXISTS "Service role only" ON messages;
DROP POLICY IF EXISTS "Service role only" ON audit_logs;
DROP POLICY IF EXISTS "Service role only" ON ai_logs;
DROP POLICY IF EXISTS "Service role only" ON privacy_consents;

CREATE POLICY "Service role only" ON jobs              FOR ALL USING (false);
CREATE POLICY "Service role only" ON candidates        FOR ALL USING (false);
CREATE POLICY "Service role only" ON applications      FOR ALL USING (false);
CREATE POLICY "Service role only" ON messages          FOR ALL USING (false);
CREATE POLICY "Service role only" ON audit_logs        FOR ALL USING (false);
CREATE POLICY "Service role only" ON ai_logs           FOR ALL USING (false);
CREATE POLICY "Service role only" ON privacy_consents  FOR ALL USING (false);

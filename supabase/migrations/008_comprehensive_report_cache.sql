-- Migration 008: cache the Comprehensive Report HTML on the application row.
--
-- The /api/admin/applications/[id]/comprehensive endpoint runs a single Claude
-- sonnet-4-6 call with full transcript + every assessment, which can take 30-60s
-- and costs ~$0.20 per generation. Cache the rendered HTML so the second view
-- is instant and free.
--
-- Pattern: when the endpoint is hit, first read comprehensive_html; if set,
-- return it. Otherwise generate, store, and return. A "Regenerate" admin button
-- can clear the column to force a fresh run after new data arrives.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS comprehensive_html      TEXT,
  ADD COLUMN IF NOT EXISTS comprehensive_generated_at TIMESTAMPTZ;

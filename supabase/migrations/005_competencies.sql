-- 360 Hire, per-job competencies for the in-depth interview prompt.
-- Array of {name: string, weight: 1|2|3, behaviours?: [string]}.
-- weight: 1 = Relevant (touch on), 2 = Important (probe well), 3 = Critical (deep dive).

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS competencies JSONB NOT NULL DEFAULT '[]'::jsonb;

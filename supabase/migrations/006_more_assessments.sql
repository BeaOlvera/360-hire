-- 360 Hire, allow three new assessment codes: big_five, icar_reasoning, resilience.

ALTER TABLE assessment_responses
  DROP CONSTRAINT IF EXISTS assessment_responses_assessment_code_check;

ALTER TABLE assessment_responses
  ADD CONSTRAINT assessment_responses_assessment_code_check
  CHECK (assessment_code IN (
    'thinking_style',
    'growth_orientation',
    'career_values',
    'culture_fit',
    'big_five',
    'icar_reasoning',
    'resilience'
  ));

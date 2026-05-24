import { thinkingStyle } from './thinking_style'
import { growthOrientation } from './growth_orientation'
import { careerValues } from './career_values'
import { cultureFit } from './culture_fit'
import { bigFive } from './big_five'
import { icarReasoning } from './icar_reasoning'
import { resilience } from './resilience'
import type { AssessmentCode, AssessmentDefinition } from './types'

export type { AssessmentCode, AssessmentDefinition, Question, RawAnswers, ScoreResult, Language } from './types'

export const ASSESSMENTS: Record<AssessmentCode, AssessmentDefinition> = {
  thinking_style: thinkingStyle,
  growth_orientation: growthOrientation,
  career_values: careerValues,
  culture_fit: cultureFit,
  big_five: bigFive,
  icar_reasoning: icarReasoning,
  resilience,
}

export const ASSESSMENT_CODES: AssessmentCode[] = [
  'thinking_style', 'growth_orientation', 'career_values', 'culture_fit',
  'big_five', 'icar_reasoning', 'resilience',
]

export function getAssessment(code: string): AssessmentDefinition | null {
  return (ASSESSMENTS as Record<string, AssessmentDefinition>)[code] ?? null
}

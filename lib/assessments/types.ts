export type Language = 'en' | 'es'

export type LikertQuestion = {
  id: string
  type: 'likert5'
  text: { en: string; es: string }
  meta: { subscale: string }       // 'DL' | 'SF' | 'DS' for growth_orientation; anchor code for career_values
}

export type ChoiceQuestion = {
  id: string
  type: 'choice'
  text: { en: string; es: string }
  options: Array<{ value: 'a' | 'b' | 'c' | 'd'; label: { en: string; es: string } }>
}

export type Question = LikertQuestion | ChoiceQuestion

export type RawAnswers = Record<string, string | number>

// Each assessment exports its own ScoreResult shape; we store as JSONB so we
// keep the type loose at the registry level.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScoreResult = Record<string, any>

export type AssessmentCode =
  | 'thinking_style'
  | 'growth_orientation'
  | 'career_values'
  | 'culture_fit'
  | 'big_five'
  | 'icar_reasoning'
  | 'resilience'

export type AssessmentDefinition = {
  code: AssessmentCode
  name: { en: string; es: string }
  description: { en: string; es: string }
  estimatedMinutes: number
  intro: { en: string; es: string }
  questions: Question[]
  /**
   * Compute the structured scores from the raw candidate answers.
   * Pure function. Validates inputs. Throws on malformed input.
   */
  score(raw: RawAnswers): ScoreResult
  /**
   * Render a standalone HTML report (printable A4) for this test's result.
   * Used by the admin review page and the PDF endpoint.
   */
  generateHtml(args: {
    scores: ScoreResult
    candidateName: string
    jobTitle: string
    completedAt: string | null
    language: Language
  }): string
}

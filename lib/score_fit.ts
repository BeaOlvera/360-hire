import Anthropic from '@anthropic-ai/sdk'
import { logAI } from './audit'

export type CompetencyScore = {
  name: string
  score: number // 0..5
  weight: number // 0..1, defaults to 1/N if not specified
  evidence: string[] // quotes / specifics that support the score
  gaps: string[]    // what's missing or weak
}

export type FitResult = {
  overall_fit: number // 0..1
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire'
  one_line_summary: string
  competencies: CompetencyScore[]
  strengths: string[]
  concerns: string[]
  risk_flags: string[]
  next_steps: string[]
}

const SYSTEM_PROMPT_EN = `You are a senior recruiter and assessment expert evaluating a candidate's fit for a specific role.

You will be given:
1. JOB DESCRIPTION (the requirements and context for the role)
2. CANDIDATE CV (their background, may be partial or missing)
3. INTERVIEW TRANSCRIPT (a recent structured interview between an AI interviewer and the candidate)

Your task: produce a structured fit assessment. Be specific, evidence-based, and fair. Quote directly from the transcript where possible. Do not invent details.

Output STRICT JSON matching this TypeScript type:

{
  "overall_fit": number,           // 0..1, weighted average of competency scores divided by 5
  "recommendation": "strong_hire" | "hire" | "maybe" | "no_hire",
  "one_line_summary": string,      // 1-2 sentences, plain-language verdict
  "competencies": [
    {
      "name": string,              // e.g. "Stakeholder management"
      "score": number,             // 0..5, 5 = excellent fit
      "weight": number,            // 0..1, your importance estimate from the JD; sums to ~1.0 across all competencies
      "evidence": [string],        // specific behaviours / quotes supporting the score
      "gaps": [string]             // what's missing for a higher score
    }
  ],
  "strengths": [string],           // 2-5 bullets
  "concerns": [string],            // 2-5 bullets
  "risk_flags": [string],          // 0-4 bullets, things to verify in next round (e.g. "compensation expectation unclear", "limited team mgmt depth")
  "next_steps": [string]           // 2-3 concrete suggestions for the hiring team
}

Rules:
- Extract 4-7 competencies from the JD. Do not invent generic ones not relevant to this role.
- "evidence" and "gaps" must be grounded in the transcript or CV. If CV/transcript is silent on a topic, list it as a gap, not as evidence.
- "overall_fit" must equal (sum of weight*score) / 5.
- "recommendation" maps approximately to overall_fit: strong_hire >= 0.80, hire >= 0.65, maybe >= 0.45, no_hire < 0.45 — but the recommendation can override this if there is a serious red flag.
- Write in plain natural language. Never use em dashes or en dashes (the "—" or "–" characters); use commas, parentheses, colons, or separate sentences instead.
- Output JSON only, no surrounding prose.`

const SYSTEM_PROMPT_ES = `Eres una reclutadora senior y experta en evaluación, valorando el encaje de una persona candidata para un puesto específico.

Recibirás:
1. DESCRIPCIÓN DEL PUESTO
2. CV DE LA PERSONA CANDIDATA (puede ser parcial o estar ausente)
3. TRANSCRIPCIÓN DE LA ENTREVISTA (entrevista estructurada reciente entre una entrevistadora IA y la persona candidata)

Tu tarea: produce una evaluación estructurada de encaje. Sé específica, basada en evidencia y justa. Cita directamente la transcripción cuando sea posible. No inventes detalles.

Devuelve JSON ESTRICTO con esta estructura (los nombres de los campos en INGLÉS):

{
  "overall_fit": number,
  "recommendation": "strong_hire" | "hire" | "maybe" | "no_hire",
  "one_line_summary": string,
  "competencies": [
    { "name": string, "score": number, "weight": number, "evidence": [string], "gaps": [string] }
  ],
  "strengths": [string],
  "concerns": [string],
  "risk_flags": [string],
  "next_steps": [string]
}

Reglas:
- El contenido de los textos (one_line_summary, evidence, gaps, strengths, concerns, risk_flags, next_steps) debe estar en ESPAÑOL con tildes y signos de apertura ¿ ¡.
- Extrae 4-7 competencias de la descripción del puesto. No inventes competencias genéricas no relevantes.
- Las "evidence" y "gaps" deben fundamentarse en la transcripción o el CV. Si no hay información, listarlo como gap, no como evidence.
- "overall_fit" debe igualar (suma de weight*score) / 5.
- "recommendation": strong_hire >= 0.80, hire >= 0.65, maybe >= 0.45, no_hire < 0.45, salvo bandera roja seria.
- Escribe en lenguaje natural. Nunca uses la raya ni el guion largo (los caracteres "—" o "–"); usa comas, paréntesis, dos puntos o frases separadas.
- Devuelve solo el JSON, sin texto adicional.`

export async function scoreCandidateFit(args: {
  applicationId: string
  jobTitle: string
  jobDescription: string
  orgLevel: string | null
  candidateName: string
  cvText: string | null
  transcript: Array<{ role: 'assistant' | 'user'; content: string }>
  language: 'en' | 'es'
}): Promise<FitResult> {
  const { applicationId, jobTitle, jobDescription, orgLevel, candidateName, cvText, transcript, language } = args

  const transcriptText = transcript
    .map((m) => `${m.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE'}: ${m.content}`)
    .join('\n\n')

  const userContent = `JOB TITLE: ${jobTitle}
${orgLevel ? `ROLE LEVEL: ${orgLevel}` : ''}

JOB DESCRIPTION:
"""
${jobDescription}
"""

CANDIDATE: ${candidateName}

${cvText ? `CV:\n"""\n${cvText.slice(0, 8000)}\n"""\n` : '(No CV text available.)\n'}

INTERVIEW TRANSCRIPT:
"""
${transcriptText}
"""`

  const systemPrompt = language === 'es' ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const started = Date.now()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const block = response.content[0]
  const raw = block.type === 'text' ? block.text : ''

  logAI({
    applicationId,
    actionType: 'ai.fit_scoring',
    model: 'claude-sonnet-4-6',
    promptLength: systemPrompt.length + userContent.length,
    responseLength: raw.length,
    tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    durationMs: Date.now() - started,
  })

  return parseFitResult(raw)
}

function parseFitResult(raw: string): FitResult {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Score response did not contain JSON')
  const parsed = JSON.parse(match[0])

  // Defensive normalisation
  const competencies: CompetencyScore[] = Array.isArray(parsed.competencies)
    ? parsed.competencies.map((c: any) => ({
        name: String(c.name ?? ''),
        score: clamp01_5(Number(c.score ?? 0)),
        weight: Math.max(0, Math.min(1, Number(c.weight ?? 0))),
        evidence: Array.isArray(c.evidence) ? c.evidence.map(String) : [],
        gaps: Array.isArray(c.gaps) ? c.gaps.map(String) : [],
      }))
    : []

  // Re-normalise weights if they don't sum to ~1
  const wSum = competencies.reduce((s, c) => s + c.weight, 0)
  if (wSum > 0 && Math.abs(wSum - 1) > 0.05) {
    for (const c of competencies) c.weight = c.weight / wSum
  } else if (wSum === 0 && competencies.length > 0) {
    for (const c of competencies) c.weight = 1 / competencies.length
  }

  const weighted = competencies.reduce((s, c) => s + c.weight * c.score, 0)
  const computedFit = competencies.length > 0 ? weighted / 5 : 0
  const overall_fit = isFinite(Number(parsed.overall_fit))
    ? clamp01(Number(parsed.overall_fit))
    : clamp01(computedFit)

  const recValue = String(parsed.recommendation ?? '')
  const recommendation = (['strong_hire', 'hire', 'maybe', 'no_hire'] as const).includes(recValue as any)
    ? (recValue as FitResult['recommendation'])
    : recommendationFromFit(overall_fit)

  return {
    overall_fit,
    recommendation,
    one_line_summary: String(parsed.one_line_summary ?? ''),
    competencies,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns.map(String) : [],
    risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags.map(String) : [],
    next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps.map(String) : [],
  }
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)) }
function clamp01_5(n: number) { return Math.max(0, Math.min(5, n)) }
function recommendationFromFit(f: number): FitResult['recommendation'] {
  if (f >= 0.80) return 'strong_hire'
  if (f >= 0.65) return 'hire'
  if (f >= 0.45) return 'maybe'
  return 'no_hire'
}

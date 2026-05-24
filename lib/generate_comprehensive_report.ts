/**
 * Comprehensive candidate report.
 *
 * One Claude call that integrates every signal we have:
 *   - Job description and competencies
 *   - Candidate CV text
 *   - Full interview transcript
 *   - Existing fit-scoring result (if any)
 *   - All completed complementary assessment scores
 *
 * Produces a structured synthesis with an executive summary + final
 * recommendation + strengths/concerns + per-competency interview coding,
 * then renders to a single printable HTML report.
 */

import Anthropic from '@anthropic-ai/sdk'
import { logAI } from './audit'
import type { FitResult } from './score_fit'

export type AssessmentSnapshot = {
  code: string         // 'thinking_style' | 'growth_orientation' | ...
  name: string         // human label
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scores: any          // arbitrary structured scores from each test's score() function
}

export type CompetencyCoded = {
  name: string
  rating: 'strong' | 'adequate' | 'gap' | 'unclear'
  interview_evidence: string[]
  interview_gaps: string[]
  assessment_signals: string[]
}

export type ComprehensiveResult = {
  executive_summary: string                    // 3-5 sentences
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire'
  recommendation_rationale: string             // 1 short paragraph
  top_strengths: string[]                      // 3-5 bullets, synthesized across signals
  top_concerns: string[]                       // 2-4 bullets
  risk_flags: string[]                         // 0-4 bullets
  competencies: CompetencyCoded[]
  cross_signal_observations: string[]          // 2-4 bullets noting where signals converge or diverge
  next_steps: string[]                         // 2-4 concrete next steps for the hiring team
}

const SYSTEM_PROMPT_EN = `You are a senior hiring assessor producing an integrated candidate report. You will receive five sources of evidence:
1. JOB DESCRIPTION and target COMPETENCIES (with weights: critical, important, relevant)
2. CANDIDATE CV (extracted text)
3. INTERVIEW TRANSCRIPT (a recent structured AI-led interview)
4. EXISTING FIT-SCORING RESULT (per-competency scores produced by an earlier scoring step)
5. COMPLEMENTARY ASSESSMENT RESULTS (e.g. Big Five, Cognitive reasoning, Resilience, Career Values, Culture Fit, Thinking Style, Growth Orientation), each with structured scores

Your job: synthesise ALL signals into one coherent decision. Be specific, evidence-based, fair. Quote sparingly from the transcript when it adds clarity. Do NOT invent facts. Where signals diverge across sources (e.g. interview suggests confidence but personality reports low extraversion), call that out in cross_signal_observations.

Output STRICT JSON matching this TypeScript type:

{
  "executive_summary": string,                              // 3-5 sentences; what the hiring team most needs to know
  "recommendation": "strong_hire" | "hire" | "maybe" | "no_hire",
  "recommendation_rationale": string,                       // 1 paragraph explaining the recommendation
  "top_strengths": [string],                                // 3-5 bullets synthesizing across signals
  "top_concerns": [string],                                 // 2-4 bullets
  "risk_flags": [string],                                   // 0-4 bullets, things to verify in next round
  "competencies": [
    {
      "name": string,                                       // from the JD competencies if provided, else extracted by you
      "rating": "strong" | "adequate" | "gap" | "unclear",
      "interview_evidence": [string],                       // specific evidence from the transcript
      "interview_gaps": [string],                           // what was NOT demonstrated for this competency
      "assessment_signals": [string]                        // bullets pointing to relevant test scores, e.g. "Big Five Conscientiousness 4.3 (high) supports follow-through"
    }
  ],
  "cross_signal_observations": [string],                    // 2-4 bullets where signals converge or diverge
  "next_steps": [string]                                    // 2-4 concrete next steps for the hiring team
}

Rules:
- Write in plain natural language. Never use em or en dashes ("—" / "–"); use commas, parentheses, colons, or separate sentences.
- If a section has nothing to report, return an empty array rather than padding with fluff.
- Be honest about uncertainty (use "unclear" rating, surface risk flags).
- Output JSON only, no surrounding prose.`

const SYSTEM_PROMPT_ES = `Eres una evaluadora senior de selección que produce un informe integrado de candidatura. Recibirás cinco fuentes de evidencia:
1. DESCRIPCIÓN DEL PUESTO y COMPETENCIAS objetivo (con pesos: crítica, importante, relevante)
2. CV del candidato (texto extraído)
3. TRANSCRIPCIÓN DE LA ENTREVISTA (entrevista estructurada reciente conducida por IA)
4. RESULTADO PREVIO DE SCORING DE ENCAJE (puntuaciones por competencia generadas previamente)
5. RESULTADOS DE EVALUACIONES COMPLEMENTARIAS (p.ej. Big Five, Razonamiento cognitivo, Resiliencia, Valores Profesionales, Encaje Cultural, Estilos de Pensamiento, Orientación al Desarrollo), cada una con puntuaciones estructuradas

Tu trabajo: sintetizar TODAS las señales en una decisión coherente. Sé específica, basada en evidencia, justa. Cita con moderación de la transcripción cuando añada claridad. NO inventes hechos. Cuando las señales diverjan entre fuentes (p.ej. la entrevista sugiere confianza pero la personalidad reporta baja extraversión), señálalo en cross_signal_observations.

Devuelve JSON ESTRICTO con esta estructura (los nombres de los campos en INGLÉS):

{
  "executive_summary": string,
  "recommendation": "strong_hire" | "hire" | "maybe" | "no_hire",
  "recommendation_rationale": string,
  "top_strengths": [string],
  "top_concerns": [string],
  "risk_flags": [string],
  "competencies": [
    { "name": string, "rating": "strong" | "adequate" | "gap" | "unclear", "interview_evidence": [string], "interview_gaps": [string], "assessment_signals": [string] }
  ],
  "cross_signal_observations": [string],
  "next_steps": [string]
}

Reglas:
- El contenido de los textos debe estar en ESPAÑOL con tildes y signos de apertura ¿ ¡.
- Lenguaje natural; nunca uses la raya ni el guion largo ("—" / "–"); usa comas, paréntesis, dos puntos o frases separadas.
- Si una sección no tiene nada que reportar, devuelve un array vacío en lugar de rellenar.
- Sé honesta con la incertidumbre (usa rating "unclear", saca a flote las banderas de riesgo).
- Devuelve solo el JSON, sin texto adicional.`

export async function synthesizeCandidate(args: {
  applicationId: string
  jobTitle: string
  jobDescription: string
  jobCompetencies: Array<{ name: string; weight?: number }>
  candidateName: string
  cvText: string | null
  transcript: Array<{ role: 'assistant' | 'user'; content: string }>
  fitResult: FitResult | null
  assessments: AssessmentSnapshot[]
  language: 'en' | 'es'
}): Promise<ComprehensiveResult> {
  const { applicationId, jobTitle, jobDescription, jobCompetencies, candidateName, cvText, transcript, fitResult, assessments, language } = args

  const transcriptText = transcript
    .map((m) => `${m.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE'}: ${m.content}`)
    .join('\n\n')

  const compsBlock = jobCompetencies.length > 0
    ? jobCompetencies.map((c) => {
        const w = c.weight === 3 ? 'critical' : c.weight === 1 ? 'relevant' : 'important'
        return `  - ${c.name} (${w})`
      }).join('\n')
    : '  (no pre-defined competencies; extract them from the JD)'

  const assessmentsBlock = assessments.length > 0
    ? assessments.map((a) => `### ${a.name} (${a.code})\n${JSON.stringify(a.scores, null, 2)}`).join('\n\n')
    : '(none completed)'

  const fitBlock = fitResult
    ? JSON.stringify(fitResult, null, 2)
    : '(not yet generated)'

  const userContent = `JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
"""
${jobDescription}
"""

TARGET COMPETENCIES:
${compsBlock}

CANDIDATE: ${candidateName}

${cvText ? `CV:\n"""\n${cvText.slice(0, 8000)}\n"""\n` : '(No CV text available.)\n'}

INTERVIEW TRANSCRIPT:
"""
${transcriptText}
"""

EXISTING FIT-SCORING RESULT:
${fitBlock}

COMPLEMENTARY ASSESSMENTS:
${assessmentsBlock}`

  const systemPrompt = language === 'es' ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const started = Date.now()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const block = response.content[0]
  const raw = block.type === 'text' ? block.text : ''

  logAI({
    applicationId,
    actionType: 'ai.comprehensive_report',
    model: 'claude-sonnet-4-6',
    promptLength: systemPrompt.length + userContent.length,
    responseLength: raw.length,
    tokensUsed: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
    durationMs: Date.now() - started,
  })

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Comprehensive response did not contain JSON')
  const parsed = JSON.parse(match[0])
  return normalize(parsed)
}

function normalize(parsed: any): ComprehensiveResult {
  const rec = parsed?.recommendation
  const allowedRec = ['strong_hire', 'hire', 'maybe', 'no_hire']
  return {
    executive_summary: String(parsed?.executive_summary ?? '').trim(),
    recommendation: allowedRec.includes(rec) ? rec : 'maybe',
    recommendation_rationale: String(parsed?.recommendation_rationale ?? '').trim(),
    top_strengths: Array.isArray(parsed?.top_strengths) ? parsed.top_strengths.map(String) : [],
    top_concerns: Array.isArray(parsed?.top_concerns) ? parsed.top_concerns.map(String) : [],
    risk_flags: Array.isArray(parsed?.risk_flags) ? parsed.risk_flags.map(String) : [],
    competencies: Array.isArray(parsed?.competencies) ? parsed.competencies.map((c: any) => ({
      name: String(c?.name ?? ''),
      rating: ['strong', 'adequate', 'gap', 'unclear'].includes(c?.rating) ? c.rating : 'unclear',
      interview_evidence: Array.isArray(c?.interview_evidence) ? c.interview_evidence.map(String) : [],
      interview_gaps: Array.isArray(c?.interview_gaps) ? c.interview_gaps.map(String) : [],
      assessment_signals: Array.isArray(c?.assessment_signals) ? c.assessment_signals.map(String) : [],
    })) : [],
    cross_signal_observations: Array.isArray(parsed?.cross_signal_observations) ? parsed.cross_signal_observations.map(String) : [],
    next_steps: Array.isArray(parsed?.next_steps) ? parsed.next_steps.map(String) : [],
  }
}

// ────────── HTML RENDER ──────────

const REC_LABELS = {
  en: { strong_hire: 'Strong hire', hire: 'Hire', maybe: 'Maybe', no_hire: 'Do not hire' },
  es: { strong_hire: 'Contratación firme', hire: 'Contratar', maybe: 'Tal vez', no_hire: 'No contratar' },
}
const REC_COLORS: Record<ComprehensiveResult['recommendation'], { bg: string; color: string }> = {
  strong_hire: { bg: '#E2E0DA', color: '#0A0A0A' },
  hire:        { bg: '#EAEAEA', color: '#3F3F3F' },
  maybe:       { bg: '#F0EEE8', color: '#6B6B6B' },
  no_hire:     { bg: '#F5F4F0', color: '#AEABA3' },
}
const RATING_LABELS = {
  en: { strong: 'Strong', adequate: 'Adequate', gap: 'Gap', unclear: 'Unclear' },
  es: { strong: 'Fuerte', adequate: 'Adecuado', gap: 'Brecha', unclear: 'No claro' },
}
const RATING_COLORS: Record<CompetencyCoded['rating'], string> = {
  strong: '#0A0A0A', adequate: '#3F3F3F', gap: '#9B2335', unclear: '#AEABA3',
}

export function generateComprehensiveHTML(args: {
  candidateName: string
  jobTitle: string
  orgLevel: string | null
  completedAt: string | null
  result: ComprehensiveResult
  transcript: Array<{ role: 'assistant' | 'user'; content: string }>
  assessments: AssessmentSnapshot[]
  language: 'en' | 'es'
}): string {
  const { candidateName, jobTitle, orgLevel, completedAt, result, transcript, assessments, language } = args
  const recLabel = REC_LABELS[language][result.recommendation]
  const recColor = REC_COLORS[result.recommendation]
  const t = language === 'es'
    ? { title: 'Informe Integral de Candidatura', subtitle: 'Síntesis de encaje, entrevista y evaluaciones complementarias', candidate: 'Candidato/a', role: 'Puesto', date: 'Fecha', execSummary: 'Resumen ejecutivo', recommendation: 'Recomendación', rationale: 'Justificación', strengths: 'Fortalezas principales', concerns: 'Preocupaciones principales', risks: 'Banderas de riesgo', competencies: 'Competencias (codificadas)', evidence: 'Evidencia en la entrevista', gaps: 'Vacíos', signals: 'Señales de evaluaciones', crossSignal: 'Observaciones entre fuentes', nextSteps: 'Próximos pasos', assessmentsSection: 'Resumen de evaluaciones complementarias', transcript: 'Apéndice: Transcripción de la entrevista', interviewer: 'Entrevistadora', candidateLabel: 'Candidato/a' }
    : { title: 'Comprehensive Candidate Report', subtitle: 'Synthesis of fit, interview, and complementary assessments', candidate: 'Candidate', role: 'Role', date: 'Date', execSummary: 'Executive summary', recommendation: 'Recommendation', rationale: 'Rationale', strengths: 'Top strengths', concerns: 'Top concerns', risks: 'Risk flags', competencies: 'Competencies (coded)', evidence: 'Interview evidence', gaps: 'Gaps', signals: 'Assessment signals', crossSignal: 'Cross-signal observations', nextSteps: 'Suggested next steps', assessmentsSection: 'Complementary assessments at a glance', transcript: 'Appendix: Interview transcript', interviewer: 'Interviewer', candidateLabel: 'Candidate' }

  const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'

  const compsHtml = result.competencies.length === 0 ? '' : result.competencies.map((c) => `
    <div style="border:1px solid #E2E0DA; border-radius:14px; padding:18px 22px; margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="font-size:14px; font-weight:700; color:#0A0A0A;">${escape(c.name)}</span>
        <span style="font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; padding:3px 10px; border-radius:20px; background:${c.rating === 'strong' ? '#E2E0DA' : c.rating === 'adequate' ? '#EAEAEA' : c.rating === 'gap' ? '#FBEAEC' : '#F5F4F0'}; color:${RATING_COLORS[c.rating]};">${escape(RATING_LABELS[language][c.rating])}</span>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
        <div>
          <div style="font-size:11px; font-weight:700; letter-spacing:0.05em; color:#6B6B6B; text-transform:uppercase; margin-bottom:4px;">${escape(t.evidence)}</div>
          <ul style="padding-left:18px; margin:0;">${(c.interview_evidence.length ? c.interview_evidence : ['-']).map((e) => `<li style="font-size:12.5px; color:#0A0A0A; line-height:1.55; margin-bottom:4px;">${escape(e)}</li>`).join('')}</ul>
        </div>
        <div>
          <div style="font-size:11px; font-weight:700; letter-spacing:0.05em; color:#6B6B6B; text-transform:uppercase; margin-bottom:4px;">${escape(t.gaps)}</div>
          <ul style="padding-left:18px; margin:0;">${(c.interview_gaps.length ? c.interview_gaps : ['-']).map((g) => `<li style="font-size:12.5px; color:#0A0A0A; line-height:1.55; margin-bottom:4px;">${escape(g)}</li>`).join('')}</ul>
        </div>
      </div>
      ${c.assessment_signals.length ? `<div style="margin-top:10px; padding-top:10px; border-top:1px solid #F0EEE8;">
        <div style="font-size:11px; font-weight:700; letter-spacing:0.05em; color:#6B6B6B; text-transform:uppercase; margin-bottom:4px;">${escape(t.signals)}</div>
        <ul style="padding-left:18px; margin:0;">${c.assessment_signals.map((s) => `<li style="font-size:12.5px; color:#0A0A0A; line-height:1.55; margin-bottom:4px;">${escape(s)}</li>`).join('')}</ul>
      </div>` : ''}
    </div>`).join('')

  const assessSummary = assessments.length === 0 ? '' : assessments.map((a) => {
    const summary = summarizeAssessment(a, language)
    return `<div style="display:grid; grid-template-columns:160px 1fr; gap:14px; padding:10px 0; border-bottom:1px solid #F0EEE8;">
      <span style="font-size:13px; font-weight:700; color:#0A0A0A;">${escape(a.name)}</span>
      <span style="font-size:13px; color:#3F3F3F; line-height:1.5;">${escape(summary)}</span>
    </div>`
  }).join('')

  const transcriptHtml = transcript.length === 0 ? '' : transcript.map((m) => `
    <div style="margin-bottom:12px; padding:10px 14px; border-radius:10px; background:${m.role === 'assistant' ? '#F5F4F0' : '#EAEAEA'}; border-left:3px solid ${m.role === 'assistant' ? '#0A0A0A' : '#6B6B6B'};">
      <p style="font-size:10px; font-weight:800; color:${m.role === 'assistant' ? '#0A0A0A' : '#6B6B6B'}; letter-spacing:0.08em; text-transform:uppercase; margin:0 0 4px;">${m.role === 'assistant' ? escape(t.interviewer) : escape(t.candidateLabel)}</p>
      <p style="font-size:13px; color:#0A0A0A; line-height:1.55; white-space:pre-wrap; margin:0;">${escape(m.content)}</p>
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<title>${escape(t.title)} - ${escape(candidateName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F5F4F0; color: #0A0A0A; margin: 0; padding: 32px 16px; }
  .page { max-width: 840px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E0DA; border-radius: 18px; overflow: hidden; }
  header { background: #0F3D3E; color: #FFFFFF; padding: 32px 40px; }
  header .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  header .badge { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.16); display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 9px; }
  header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
  header p { font-size: 13px; color: rgba(255,255,255,0.78); margin: 6px 0 0; }
  main { padding: 32px 40px; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 26px; padding-bottom: 22px; border-bottom: 1px solid #F0EEE8; }
  .meta .label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #AEABA3; text-transform: uppercase; margin-bottom: 4px; }
  .meta .value { font-size: 13px; font-weight: 600; color: #0A0A0A; }
  section { margin-bottom: 30px; }
  section h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: #AEABA3; text-transform: uppercase; margin: 0 0 12px; }
  .verdict-card { background: #F5F4F0; border: 1px solid #E2E0DA; border-radius: 14px; padding: 20px 24px; margin-bottom: 22px; }
  .exec { font-size: 14.5px; line-height: 1.65; color: #0A0A0A; }
  .rec-pill { display: inline-block; padding: 6px 16px; border-radius: 99px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: ${recColor.bg}; color: ${recColor.color}; margin-top: 12px; }
  .rationale { font-size: 13px; line-height: 1.6; color: #3F3F3F; margin-top: 12px; }
  ul.plain { padding-left: 18px; margin: 0; }
  ul.plain li { font-size: 13px; color: #0A0A0A; line-height: 1.6; margin-bottom: 6px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  footer { padding: 18px 40px 28px; color: #AEABA3; font-size: 10px; text-align: center; border-top: 1px solid #F0EEE8; }
  @media print { body { background: #FFFFFF; padding: 0; } .page { border: none; border-radius: 0; } header { padding: 24px 32px; } main { padding: 24px 32px; } }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="logo"><span class="badge">360</span><span style="font-size:15px; font-weight:700;">360 Hire</span></div>
    <h1>${escape(t.title)}</h1>
    <p>${escape(t.subtitle)}</p>
  </header>
  <main>
    <div class="meta">
      <div><div class="label">${escape(t.candidate)}</div><div class="value">${escape(candidateName)}</div></div>
      <div><div class="label">${escape(t.role)}</div><div class="value">${escape(jobTitle)}${orgLevel ? ` · ${escape(orgLevel)}` : ''}</div></div>
      <div><div class="label">${escape(t.date)}</div><div class="value">${date(completedAt)}</div></div>
    </div>

    <div class="verdict-card">
      <div style="font-size:10px; font-weight:700; letter-spacing:0.15em; color:#AEABA3; text-transform:uppercase; margin-bottom:8px;">${escape(t.execSummary)}</div>
      <p class="exec">${escape(result.executive_summary)}</p>
      <span class="rec-pill">${escape(t.recommendation)}: ${escape(recLabel)}</span>
      <p class="rationale">${escape(result.recommendation_rationale)}</p>
    </div>

    <section>
      <div class="two-col">
        <div>
          <h2>${escape(t.strengths)}</h2>
          <ul class="plain">${(result.top_strengths.length ? result.top_strengths : ['-']).map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
        </div>
        <div>
          <h2>${escape(t.concerns)}</h2>
          <ul class="plain">${(result.top_concerns.length ? result.top_concerns : ['-']).map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
        </div>
      </div>
    </section>

    ${result.risk_flags.length ? `
    <section>
      <h2>${escape(t.risks)}</h2>
      <ul class="plain">${result.risk_flags.map((r) => `<li>${escape(r)}</li>`).join('')}</ul>
    </section>` : ''}

    ${compsHtml ? `
    <section>
      <h2>${escape(t.competencies)}</h2>
      ${compsHtml}
    </section>` : ''}

    ${result.cross_signal_observations.length ? `
    <section>
      <h2>${escape(t.crossSignal)}</h2>
      <ul class="plain">${result.cross_signal_observations.map((o) => `<li>${escape(o)}</li>`).join('')}</ul>
    </section>` : ''}

    ${assessSummary ? `
    <section>
      <h2>${escape(t.assessmentsSection)}</h2>
      ${assessSummary}
    </section>` : ''}

    <section>
      <h2>${escape(t.nextSteps)}</h2>
      <ul class="plain">${(result.next_steps.length ? result.next_steps : ['-']).map((n) => `<li>${escape(n)}</li>`).join('')}</ul>
    </section>

    ${transcriptHtml ? `
    <section style="page-break-before:always;">
      <h2>${escape(t.transcript)}</h2>
      ${transcriptHtml}
    </section>` : ''}
  </main>
  <footer>360 Hire</footer>
</div>
</body>
</html>`
}

function summarizeAssessment(a: AssessmentSnapshot, language: 'en' | 'es'): string {
  const s: any = a.scores ?? {}
  if (a.code === 'thinking_style') {
    const dom = s.dominant ?? '-'
    const pct = s.percentages?.[dom] ?? 0
    return language === 'es' ? `Cuadrante dominante: ${dom} (${pct}%)` : `Dominant quadrant: ${dom} (${pct}%)`
  }
  if (a.code === 'growth_orientation') {
    const overall = Number(s.overall ?? 0).toFixed(2)
    return language === 'es' ? `Puntuación general ${overall} / 5 (${labelLevel(s.level, language)})` : `Overall ${overall} / 5 (${labelLevel(s.level, language)})`
  }
  if (a.code === 'career_values') {
    const top: string[] = Array.isArray(s.top) ? s.top : []
    return language === 'es' ? `Anclas principales: ${top.join(', ') || '-'}` : `Top anchors: ${top.join(', ') || '-'}`
  }
  if (a.code === 'culture_fit') {
    return language === 'es' ? `Cuadrante cultural dominante: ${s.dominant ?? '-'}` : `Dominant culture quadrant: ${s.dominant ?? '-'}`
  }
  if (a.code === 'big_five') {
    const traits = s.traits ?? {}
    const lev = s.level ?? {}
    return `E ${Number(traits.E ?? 0).toFixed(1)} (${labelLevel(lev.E, language)}), A ${Number(traits.A ?? 0).toFixed(1)} (${labelLevel(lev.A, language)}), C ${Number(traits.C ?? 0).toFixed(1)} (${labelLevel(lev.C, language)}), N ${Number(traits.N ?? 0).toFixed(1)} (${labelLevel(lev.N, language)}), O ${Number(traits.O ?? 0).toFixed(1)} (${labelLevel(lev.O, language)})`
  }
  if (a.code === 'icar_reasoning') {
    const correct = s.correct ?? 0
    const total = s.total ?? 0
    const pct = Math.round((s.ratio ?? 0) * 100)
    return language === 'es' ? `${correct} de ${total} (${pct}%) - banda ${labelBand(s.band, language)}` : `${correct} of ${total} (${pct}%) - ${labelBand(s.band, language)} band`
  }
  if (a.code === 'resilience') {
    const mean = Number(s.mean ?? 0).toFixed(2)
    return language === 'es' ? `Resiliencia ${mean} / 5 (${labelBand(s.band, language)})` : `Resilience ${mean} / 5 (${labelBand(s.band, language)})`
  }
  return JSON.stringify(s)
}

function labelLevel(level: string | undefined, lang: 'en' | 'es'): string {
  if (lang === 'es') return level === 'high' ? 'alto' : level === 'moderate' ? 'medio' : level === 'low' ? 'bajo' : (level ?? '-')
  return level === 'high' ? 'higher' : level === 'moderate' ? 'average' : level === 'low' ? 'lower' : (level ?? '-')
}
function labelBand(band: string | undefined, lang: 'en' | 'es'): string {
  if (lang === 'es') return band === 'high' ? 'alta' : band === 'normal' || band === 'average' ? 'media' : band === 'low' ? 'baja' : (band ?? '-')
  return band === 'high' ? 'higher' : band === 'normal' || band === 'average' ? 'average' : band === 'low' ? 'lower' : (band ?? '-')
}

function escape(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

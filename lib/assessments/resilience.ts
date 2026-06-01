/**
 * Resilience assessment, inspired by the Brief Resilience Scale framework
 * (Smith, Dalen, Wiggins, Tooley, Christopher & Bernard, 2008). The items
 * here are freshly composed to capture the same conceptual construct
 * (recovery from setbacks, bouncing back from stress, regaining perspective),
 * not reproductions of the BRS items themselves.
 *
 * 6 Likert-5 items, items 2, 4, 6 reverse-scored.
 * Score: mean of 6 items after reverse-coding (range 1..5).
 * Bands: low (< 3), normal (3 - 4.3), high (> 4.3).
 */

import type { AssessmentDefinition, LikertQuestion, RawAnswers } from './types'

const Q = (id: string, reverse: boolean, en: string, es: string): LikertQuestion => ({
  id, type: 'likert5', text: { en, es }, meta: { subscale: reverse ? 'BRS_R' : 'BRS' },
})

const QUESTIONS: LikertQuestion[] = [
  Q('q1', false, 'After a difficult event, I find a way to move forward without dwelling on it.',         'Tras un evento difícil, encuentro la forma de seguir adelante sin quedarme atascado/a en él.'),
  Q('q2', true,  'When something stressful happens, my emotions take a long time to settle.',            'Cuando ocurre algo estresante, mis emociones tardan mucho en calmarse.'),
  Q('q3', false, 'I have learned to adapt my approach when plans fall apart.',                            'He aprendido a adaptar mi enfoque cuando los planes se vienen abajo.'),
  Q('q4', true,  'Setbacks at work or in life tend to weigh on me for weeks.',                            'Los reveses en el trabajo o en la vida me pesan durante semanas.'),
  Q('q5', false, 'Even after a hard period, I can usually return to my normal way of functioning.',      'Incluso tras un periodo duro, suelo poder volver a mi forma normal de funcionar.'),
  Q('q6', true,  'I find it difficult to regain perspective once I am upset about something.',           'Me cuesta recuperar la perspectiva una vez que algo me ha afectado.'),
]

export type ResilienceScores = {
  mean: number
  band: 'low' | 'normal' | 'high'
}

function score(raw: RawAnswers): ResilienceScores {
  const values: number[] = []
  for (const q of QUESTIONS) {
    const v = Number(raw[q.id])
    if (!Number.isFinite(v) || v < 1 || v > 5) continue
    values.push(q.meta.subscale === 'BRS_R' ? 6 - v : v)
  }
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const band: 'low' | 'normal' | 'high' = mean > 4.3 ? 'high' : mean >= 3.0 ? 'normal' : 'low'
  return { mean, band }
}

const BAND_INTERP = {
  en: {
    high:   { headline: 'Higher resilience', body: 'Consistent pattern of bouncing back from stress and setbacks. Likely to remain effective under pressure and recover quickly after difficult events. Watch out for: under-acknowledging the impact of hard moments on the team.' },
    normal: { headline: 'Average resilience',  body: 'Resilience in the normative range. Likely to handle typical workplace pressure, with recovery time after harder events. Combine with the interview to read this in context.' },
    low:    { headline: 'Lower resilience',  body: 'Currently reports needing longer to bounce back from stress and setbacks. May be situational (recent difficult period) or dispositional. Consider how stress-heavy the role is and what support structure exists.' },
  },
  es: {
    high:   { headline: 'Resiliencia alta',   body: 'Patrón consistente de recuperación frente al estrés y los reveses. Probablemente mantenga eficacia bajo presión y se recupere rápido tras eventos difíciles. Punto de atención: subestimar el impacto de los momentos duros sobre el equipo.' },
    normal: { headline: 'Resiliencia media',  body: 'Resiliencia en el rango normativo. Probablemente maneje la presión laboral típica, con un tiempo de recuperación tras eventos más duros. Combínalo con la entrevista para leerlo en contexto.' },
    low:    { headline: 'Resiliencia baja',   body: 'Reporta necesitar más tiempo para recuperarse del estrés y los reveses. Puede ser situacional (un periodo difícil reciente) o disposicional. Considera cuán estresante es el puesto y qué soporte existe.' },
  },
}

function generateHtml(args: {
  scores: ResilienceScores
  candidateName: string
  jobTitle: string
  completedAt: string | null
  language: 'en' | 'es'
}): string {
  const { scores, candidateName, jobTitle, completedAt, language } = args
  const interp = (language === 'es' ? BAND_INTERP.es : BAND_INTERP.en)[scores.band]
  const t = language === 'es'
    ? { title: 'Resiliencia', subtitle: 'Capacidad de recuperación frente al estrés y los reveses', candidate: 'Candidato/a', role: 'Puesto', completed: 'Completado', overall: 'Puntuación general', methodNote: 'Nota metodológica: instrumento inspirado en el marco de la Brief Resilience Scale (Smith et al., 2008). 6 ítems Likert 1-5 redactados de forma original para capturar el mismo constructo (recuperación frente al estrés y los reveses); los ítems 2, 4 y 6 se invierten antes de calcular la media. Bandas: Alta > 4,3, Media 3,0-4,3, Baja < 3,0.' }
    : { title: 'Resilience', subtitle: 'Ability to bounce back from stress and setbacks', candidate: 'Candidate', role: 'Role', completed: 'Completed', overall: 'Overall score', methodNote: 'Methods note: instrument inspired by the Brief Resilience Scale framework (Smith et al., 2008). 6 Likert 1-5 items, freshly composed to capture the same construct (recovery from stress and setbacks); items 2, 4 and 6 are reverse-scored before averaging. Bands: High > 4.3, Normal 3.0-4.3, Low < 3.0.' }

  const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
  const pct = Math.round((scores.mean / 5) * 100)
  const color = scores.band === 'high' ? '#0A0A0A' : scores.band === 'normal' ? '#6B6B6B' : '#AEABA3'

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<title>${escape(t.title)} - ${escape(candidateName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F5F4F0; color: #0A0A0A; margin: 0; padding: 32px 16px; }
  .page { max-width: 820px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E0DA; border-radius: 18px; overflow: hidden; }
  header { background: #0A0A0A; color: #FFFFFF; padding: 28px 36px; }
  header .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  header .badge { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.16); display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 9px; }
  header h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.4px; margin: 0; }
  header p { font-size: 12px; color: rgba(255,255,255,0.78); margin: 6px 0 0; }
  main { padding: 28px 36px; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 26px; padding-bottom: 22px; border-bottom: 1px solid #F0EEE8; }
  .meta .label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #AEABA3; text-transform: uppercase; margin-bottom: 4px; }
  .meta .value { font-size: 13px; font-weight: 600; color: #0A0A0A; }
  section h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: #AEABA3; text-transform: uppercase; margin: 0 0 12px; }
  .verdict { background: #F5F4F0; border: 1px solid #E2E0DA; border-radius: 14px; padding: 20px 22px; }
  .verdict .num { font-size: 42px; font-weight: 800; color: ${color}; letter-spacing: -0.8px; }
  .verdict .num-of { font-size: 18px; color: #AEABA3; font-weight: 600; }
  .verdict .headline { font-size: 16px; font-weight: 700; color: #0A0A0A; margin-top: 8px; }
  .verdict .body { font-size: 13px; color: #0A0A0A; line-height: 1.6; margin-top: 8px; }
  .bar { height: 8px; background: #F0EEE8; border-radius: 99px; overflow: hidden; margin-top: 12px; }
  .bar > div { height: 100%; background: ${color}; border-radius: 99px; }
  .methods { font-size: 11px; color: #AEABA3; line-height: 1.5; margin-top: 18px; padding-top: 14px; border-top: 1px solid #F0EEE8; }
  footer { padding: 18px 36px 26px; color: #AEABA3; font-size: 10px; text-align: center; border-top: 1px solid #F0EEE8; }
  @media print { body { background: #FFFFFF; padding: 0; } .page { border: none; border-radius: 0; } }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="logo"><svg viewBox="0 0 200 50" height="24" style="display:block;height:24px;width:auto"><text x="0" y="34" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="26" letter-spacing="-0.6" fill="#FFFFFF">Zephyron</text><line x1="124" y1="11" x2="124" y2="39" stroke="#6B6B6B" stroke-width="1" /><text x="132" y="34" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-weight="400" font-size="26" letter-spacing="-0.2" fill="#AEABA3">Hire</text></svg></div>
    <h1>${escape(t.title)}</h1>
    <p>${escape(t.subtitle)}</p>
  </header>
  <main>
    <div class="meta">
      <div><div class="label">${escape(t.candidate)}</div><div class="value">${escape(candidateName)}</div></div>
      <div><div class="label">${escape(t.role)}</div><div class="value">${escape(jobTitle)}</div></div>
      <div><div class="label">${escape(t.completed)}</div><div class="value">${date(completedAt)}</div></div>
    </div>

    <section>
      <h2>${escape(t.overall)}</h2>
      <div class="verdict">
        <span class="num">${scores.mean.toFixed(2)}</span><span class="num-of"> / 5</span>
        <div class="headline">${escape(interp.headline)}</div>
        <div class="bar"><div style="width: ${pct}%"></div></div>
        <p class="body">${escape(interp.body)}</p>
      </div>
    </section>

    <div class="methods">${escape(t.methodNote)}</div>
  </main>
  <footer>Zephyron Hire</footer>
</div>
</body>
</html>`
}

function escape(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export const resilience: AssessmentDefinition = {
  code: 'resilience',
  name: { en: 'Resilience', es: 'Resiliencia' },
  description: {
    en: '6-statement self-report on the ability to bounce back from stress and setbacks. Based on the Brief Resilience Scale (Smith et al., 2008).',
    es: 'Autoinforme de 6 frases sobre la capacidad de recuperación frente al estrés y los reveses. Basado en la Brief Resilience Scale (Smith et al., 2008).',
  },
  estimatedMinutes: 2,
  intro: {
    en: 'Rate how much each statement describes you in general, from 1 (strongly disagree) to 5 (strongly agree). Answer based on what is actually true for you.',
    es: 'Valora cuánto te describe cada frase en general, de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). Responde según lo que realmente sea cierto para ti.',
  },
  questions: QUESTIONS,
  score: (raw) => score(raw),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateHtml: (args) => generateHtml(args as any),
}

/**
 * Growth Orientation assessment.
 *
 * Based on the Leadership Learning Agility Scale (LLAS) by Bouland-van Dam,
 * Oostrom & Jansen (2022, Frontiers in Psychology), reproduced under
 * Creative Commons Attribution License (CC BY).
 *
 * 18 Likert-5 items across three subscales:
 *   - Developing Leadership (DL)
 *   - Seeking Feedback     (SF)
 *   - Developing Systematically (DS)
 *
 * Higher = more agile / more growth-oriented.
 */

import type { AssessmentDefinition, LikertQuestion, RawAnswers } from './types'

type Subscale = 'DL' | 'SF' | 'DS'

const Q = (id: string, subscale: Subscale, en: string, es: string): LikertQuestion => ({
  id, type: 'likert5', text: { en, es }, meta: { subscale },
})

const QUESTIONS: LikertQuestion[] = [
  // Developing Leadership
  Q('q1',  'DL', 'At work, I put effort in trying to develop contrasting influential styles.', 'En el trabajo, me esfuerzo en desarrollar estilos de influencia diversos.'),
  Q('q2',  'DL', 'I put effort in getting better at influencing others to reach our project goals.', 'Me esfuerzo en mejorar mi capacidad de influir en otros para alcanzar los objetivos del proyecto.'),
  Q('q3',  'DL', 'I reflect on how to effectively influence my colleagues in our social interactions.', 'Reflexiono sobre cómo influir eficazmente en mis colegas en nuestras interacciones.'),
  Q('q4',  'DL', 'I try to influence the development of my co-workers to attain our project goals.', 'Intento influir en el desarrollo de mis compañeros/as para alcanzar los objetivos del proyecto.'),
  Q('q5',  'DL', 'I focus on how to effectively lead my peers toward our team goals at work.', 'Me centro en cómo liderar eficazmente a mis pares hacia los objetivos del equipo.'),
  Q('q6',  'DL', 'I focus on how to become an influencer in my organization to reach our targets.', 'Me centro en cómo convertirme en una persona influyente en mi organización para alcanzar las metas.'),

  // Seeking Feedback
  Q('q7',  'SF', 'At work, I carefully evaluate the feedback I receive from others to learn from it.', 'En el trabajo, evalúo cuidadosamente el feedback que recibo para aprender de él.'),
  Q('q8',  'SF', 'At work, I conceive feedback as a fundamental tool to my performance improvement.', 'Concibo el feedback como una herramienta fundamental para mejorar mi desempeño.'),
  Q('q9',  'SF', 'I act upon the feedback I receive from peers to improve my job performance.', 'Actúo en función del feedback de mis pares para mejorar mi desempeño laboral.'),
  Q('q10', 'SF', 'I examine patterns in my own behavior based on the feedback I receive from co-workers.', 'Examino patrones en mi propio comportamiento a partir del feedback que recibo.'),
  Q('q11', 'SF', 'I take action when a colleague gives feedback to improve my performance.', 'Tomo medidas cuando un/a colega me da feedback para mejorar mi desempeño.'),
  Q('q12', 'SF', 'I adjust my behavior based on the feedback I receive from colleagues.', 'Ajusto mi comportamiento en función del feedback que recibo de mis colegas.'),

  // Developing Systematically
  Q('q13', 'DS', 'At work, I participate in learning activities (e.g., trainings and workshops) to personally develop.', 'En el trabajo, participo en actividades de aprendizaje (formaciones, talleres) para desarrollarme personalmente.'),
  Q('q14', 'DS', 'I take part in developmental activities to improve my task- and relational skills at work.', 'Participo en actividades de desarrollo para mejorar mis habilidades técnicas y relacionales en el trabajo.'),
  Q('q15', 'DS', 'I self-initiate learning activities to improve my job performance.', 'Inicio por mí mismo/a actividades de aprendizaje para mejorar mi desempeño laboral.'),
  Q('q16', 'DS', 'I participate in trainings because I want to continue developing at work.', 'Participo en formaciones porque quiero seguir desarrollándome en el trabajo.'),
  Q('q17', 'DS', 'I take part in educational programs besides my working activities.', 'Participo en programas educativos además de mi actividad laboral.'),
  Q('q18', 'DS', 'At work, I participate in educational opportunities to further develop.', 'En el trabajo, aprovecho oportunidades educativas para seguir desarrollándome.'),
]

export type GrowthOrientationScores = {
  subscales: { DL: number; SF: number; DS: number }   // 1..5 means
  overall: number                                      // 1..5 mean of all 18
  level: 'high' | 'moderate' | 'low'
  topSubscale: Subscale
  bottomSubscale: Subscale
}

function score(raw: RawAnswers): GrowthOrientationScores {
  const buckets: Record<Subscale, number[]> = { DL: [], SF: [], DS: [] }
  for (const q of QUESTIONS) {
    const v = Number(raw[q.id])
    if (Number.isFinite(v) && v >= 1 && v <= 5) {
      buckets[q.meta.subscale as Subscale].push(v)
    }
  }
  const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const subscales = { DL: mean(buckets.DL), SF: mean(buckets.SF), DS: mean(buckets.DS) }
  const allValues = [...buckets.DL, ...buckets.SF, ...buckets.DS]
  const overall = mean(allValues)
  const level: 'high' | 'moderate' | 'low' = overall >= 4 ? 'high' : overall >= 3 ? 'moderate' : 'low'
  const sortedKeys = (['DL', 'SF', 'DS'] as Subscale[]).slice().sort((a, b) => subscales[b] - subscales[a])
  return { subscales, overall, level, topSubscale: sortedKeys[0], bottomSubscale: sortedKeys[2] }
}

const SUBSCALE_META: Record<Subscale, { nameEn: string; nameEs: string; descEn: string; descEs: string }> = {
  DL: {
    nameEn: 'Developing Leadership', nameEs: 'Desarrollo del Liderazgo',
    descEn: 'Effort to develop influence, motivate peers, and become an influencer in the organization.',
    descEs: 'Esfuerzo por desarrollar la influencia, motivar a pares y convertirse en una persona influyente en la organización.',
  },
  SF: {
    nameEn: 'Seeking Feedback', nameEs: 'Búsqueda de Feedback',
    descEn: 'Active solicitation, evaluation and use of feedback from peers to improve performance.',
    descEs: 'Solicitar activamente feedback de los pares, evaluarlo y usarlo para mejorar el desempeño.',
  },
  DS: {
    nameEn: 'Developing Systematically', nameEs: 'Desarrollo Sistemático',
    descEn: 'Self-initiated participation in trainings, workshops and educational programs to grow at work.',
    descEs: 'Participación por iniciativa propia en formaciones, talleres y programas educativos para crecer profesionalmente.',
  },
}

const INTERPRETATION_EN: Record<'high' | 'moderate' | 'low', { headline: string; body: string }> = {
  high: {
    headline: 'High growth orientation',
    body: 'Demonstrates a consistent pattern of seeking growth, treating feedback as a tool, and actively investing in their own development. Likely thrives in environments that stretch them and rotate experiences.',
  },
  moderate: {
    headline: 'Moderate growth orientation',
    body: 'Engages with development when it is offered or required, but may not actively seek it out. Likely to grow well with explicit feedback loops and structured development conversations.',
  },
  low: {
    headline: 'Low growth orientation',
    body: 'Currently shows limited active investment in development, feedback-seeking, or influence-building. May still grow if put in the right context, but expect the manager to lead more of the development planning.',
  },
}

const INTERPRETATION_ES: Record<'high' | 'moderate' | 'low', { headline: string; body: string }> = {
  high: {
    headline: 'Orientación al desarrollo alta',
    body: 'Muestra un patrón consistente de búsqueda de crecimiento, tratamiento del feedback como herramienta de mejora e inversión activa en su propio desarrollo. Probablemente prospera en entornos que la/lo estiran y le rotan experiencias.',
  },
  moderate: {
    headline: 'Orientación al desarrollo moderada',
    body: 'Se compromete con el desarrollo cuando se le ofrece o se le exige, pero puede no buscarlo activamente. Es probable que crezca bien con ciclos de feedback explícitos y conversaciones de desarrollo estructuradas.',
  },
  low: {
    headline: 'Orientación al desarrollo baja',
    body: 'Actualmente muestra una inversión limitada en su desarrollo, en la búsqueda de feedback o en construir influencia. Aún puede crecer en el contexto adecuado, pero el/la manager tendrá que liderar más activamente la planificación del desarrollo.',
  },
}

function generateHtml(args: {
  scores: GrowthOrientationScores
  candidateName: string
  jobTitle: string
  completedAt: string | null
  language: 'en' | 'es'
}): string {
  const { scores, candidateName, jobTitle, completedAt, language } = args
  const interp = (language === 'es' ? INTERPRETATION_ES : INTERPRETATION_EN)[scores.level]
  const t = language === 'es'
    ? { title: 'Orientación al Desarrollo', subtitle: 'Patrón de aprendizaje y agilidad para crecer en el rol', candidate: 'Candidato/a', role: 'Puesto', completed: 'Completado', overall: 'Puntuación general', breakdown: 'Detalle por subescala', methodNote: 'Nota metodológica: este test se basa en la Leadership Learning Agility Scale (Bouland-van Dam, Oostrom & Jansen, 2022, Frontiers in Psychology), reproducida bajo Creative Commons Attribution. 18 ítems de Likert 1-5; se calcula la media por subescala y la media global.' }
    : { title: 'Growth Orientation', subtitle: 'Learning pattern and agility to grow in the role', candidate: 'Candidate', role: 'Role', completed: 'Completed', overall: 'Overall score', breakdown: 'Subscale breakdown', methodNote: 'Methods note: based on the Leadership Learning Agility Scale (Bouland-van Dam, Oostrom & Jansen, 2022, Frontiers in Psychology), reproduced under Creative Commons Attribution. 18 Likert 1-5 items; subscale means and an overall mean are computed.' }

  const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
  const pct = (x: number) => Math.round((x / 5) * 100)
  const subColor = (v: number) => v >= 4 ? '#2D6A4F' : v >= 3 ? '#B7791F' : '#9B2335'

  const bar = (key: Subscale) => {
    const v = scores.subscales[key]
    const m = SUBSCALE_META[key]
    const color = subColor(v)
    return `<div style="margin-bottom: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
        <span style="font-size:13px; font-weight:700; color:#0A0A0A;">${escape(language === 'es' ? m.nameEs : m.nameEn)}</span>
        <span style="font-size:13px; font-weight:700; color:${color};">${v.toFixed(2)} / 5</span>
      </div>
      <div style="font-size:11px; color:#6B6B6B; margin-bottom:6px;">${escape(language === 'es' ? m.descEs : m.descEn)}</div>
      <div style="height:8px; background:#F0EEE8; border-radius:99px; overflow:hidden;">
        <div style="height:100%; width:${pct(v)}%; background:${color}; border-radius:99px;"></div>
      </div>
    </div>`
  }

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
  section { margin-bottom: 28px; }
  section h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: #AEABA3; text-transform: uppercase; margin: 0 0 12px; }
  .verdict { background: #F5F4F0; border: 1px solid #E2E0DA; border-radius: 14px; padding: 20px 22px; }
  .verdict .num { font-size: 42px; font-weight: 800; color: #0A0A0A; letter-spacing: -0.8px; }
  .verdict .num-of { font-size: 18px; color: #AEABA3; font-weight: 600; }
  .verdict .headline { font-size: 16px; font-weight: 700; color: #0A0A0A; margin-top: 8px; }
  .verdict .body { font-size: 13px; color: #0A0A0A; line-height: 1.6; margin-top: 8px; }
  .ring { display: inline-block; vertical-align: middle; margin-right: 14px; }
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
        <div style="display:flex; align-items:center; gap:18px; flex-wrap:wrap;">
          ${ringSvg(scores.overall, scores.level === 'high' ? '#2D6A4F' : scores.level === 'moderate' ? '#B7791F' : '#9B2335')}
          <div>
            <span class="num">${scores.overall.toFixed(2)}</span><span class="num-of"> / 5</span>
            <div class="headline">${escape(interp.headline)}</div>
          </div>
        </div>
        <p class="body">${escape(interp.body)}</p>
      </div>
    </section>

    <section>
      <h2>${escape(t.breakdown)}</h2>
      ${bar('DL')}
      ${bar('SF')}
      ${bar('DS')}
    </section>

    <div class="methods">${escape(t.methodNote)}</div>
  </main>
  <footer>Zephyron Hire</footer>
</div>
</body>
</html>`
}

function ringSvg(value: number, color: string): string {
  const pct = Math.max(0, Math.min(1, value / 5))
  const r = 36, c = 2 * Math.PI * r
  const offset = c - pct * c
  return `<svg width="92" height="92" viewBox="0 0 92 92">
    <circle cx="46" cy="46" r="${r}" fill="none" stroke="#E2E0DA" stroke-width="8" />
    <circle cx="46" cy="46" r="${r}" fill="none" stroke="${color}" stroke-width="8"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
      stroke-linecap="round" transform="rotate(-90 46 46)" />
    <text x="46" y="52" text-anchor="middle" font-size="20" font-weight="800" fill="${color}" font-family="-apple-system, sans-serif">${value.toFixed(1)}</text>
  </svg>`
}

function escape(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export const growthOrientation: AssessmentDefinition = {
  code: 'growth_orientation',
  name: { en: 'Growth Orientation', es: 'Orientación al Desarrollo' },
  description: {
    en: 'An 18-statement self-report on how actively you seek feedback, develop yourself, and build leadership influence.',
    es: 'Un autoinforme de 18 frases sobre cuán activamente buscas feedback, te desarrollas y construyes influencia.',
  },
  estimatedMinutes: 5,
  intro: {
    en: 'Rate how much each statement describes you at work, from 1 (strongly disagree) to 5 (strongly agree). Answer based on what you actually do, not what sounds best.',
    es: 'Valora cuánto te describe cada frase en el trabajo, de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). Responde según lo que realmente haces, no lo que suena mejor.',
  },
  questions: QUESTIONS,
  score: (raw) => score(raw),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateHtml: (args) => generateHtml(args as any),
}

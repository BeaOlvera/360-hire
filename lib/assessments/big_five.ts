/**
 * Big Five Personality assessment.
 *
 * 30 items, 6 per factor, 5-point Likert. Items are drawn from the
 * International Personality Item Pool (Goldberg, public domain).
 *
 *   E = Extraversion
 *   A = Agreeableness
 *   C = Conscientiousness
 *   N = Negative Emotionality / Emotional Stability (reverse to get stability)
 *   O = Open-Mindedness
 *
 * Items marked reverse=true are flipped before being averaged.
 */

import type { AssessmentDefinition, LikertQuestion, RawAnswers } from './types'

type Trait = 'E' | 'A' | 'C' | 'N' | 'O'

const Q = (id: string, trait: Trait, reverse: boolean, en: string, es: string): LikertQuestion => ({
  id, type: 'likert5', text: { en, es }, meta: { subscale: trait + (reverse ? '_R' : '') },
})

const QUESTIONS: LikertQuestion[] = [
  // EXTRAVERSION (6)
  Q('q1',  'E', false, 'I am the life of the party.',                         'Soy el alma de la fiesta.'),
  Q('q2',  'E', true,  'I don\'t talk a lot.',                                 'No hablo mucho.'),
  Q('q3',  'E', false, 'I feel comfortable around people.',                   'Me siento cómodo/a con la gente.'),
  Q('q4',  'E', true,  'I keep in the background.',                            'Prefiero quedarme en segundo plano.'),
  Q('q5',  'E', false, 'I start conversations.',                               'Inicio conversaciones.'),
  Q('q6',  'E', true,  'I have little to say.',                                'Tengo poco que decir.'),

  // AGREEABLENESS (6)
  Q('q7',  'A', true,  'I am not really interested in others.',                'En realidad no me interesan los demás.'),
  Q('q8',  'A', false, 'I sympathize with others\' feelings.',                 'Empatizo con los sentimientos de los demás.'),
  Q('q9',  'A', true,  'I insult people.',                                     'Insulto a la gente.'),
  Q('q10', 'A', false, 'I take time out for others.',                          'Saco tiempo por los demás.'),
  Q('q11', 'A', true,  'I am not interested in other people\'s problems.',     'No me interesan los problemas de los demás.'),
  Q('q12', 'A', false, 'I make people feel at ease.',                          'Hago que la gente se sienta cómoda.'),

  // CONSCIENTIOUSNESS (6)
  Q('q13', 'C', false, 'I am always prepared.',                                'Siempre estoy preparado/a.'),
  Q('q14', 'C', true,  'I leave my belongings around.',                        'Dejo mis cosas tiradas por ahí.'),
  Q('q15', 'C', false, 'I pay attention to details.',                          'Presto atención a los detalles.'),
  Q('q16', 'C', true,  'I make a mess of things.',                             'Hago un lío con las cosas.'),
  Q('q17', 'C', false, 'I get chores done right away.',                        'Hago las tareas pendientes enseguida.'),
  Q('q18', 'C', true,  'I often forget to put things back in their proper place.', 'A menudo me olvido de devolver las cosas a su sitio.'),

  // NEGATIVE EMOTIONALITY (6) — high score = high negative emotionality (less stable)
  Q('q19', 'N', false, 'I get stressed out easily.',                           'Me estreso fácilmente.'),
  Q('q20', 'N', true,  'I am relaxed most of the time.',                       'Estoy relajado/a la mayor parte del tiempo.'),
  Q('q21', 'N', false, 'I worry about things.',                                'Me preocupo por las cosas.'),
  Q('q22', 'N', true,  'I seldom feel blue.',                                  'Rara vez me siento bajo/a de ánimo.'),
  Q('q23', 'N', false, 'I am easily disturbed.',                               'Me altero con facilidad.'),
  Q('q24', 'N', false, 'I get upset easily.',                                  'Me molesto con facilidad.'),

  // OPEN-MINDEDNESS (6)
  Q('q25', 'O', false, 'I have a rich vocabulary.',                            'Tengo un vocabulario amplio.'),
  Q('q26', 'O', true,  'I have difficulty understanding abstract ideas.',      'Me cuesta entender ideas abstractas.'),
  Q('q27', 'O', false, 'I have a vivid imagination.',                          'Tengo una imaginación vívida.'),
  Q('q28', 'O', true,  'I am not interested in abstract ideas.',               'No me interesan las ideas abstractas.'),
  Q('q29', 'O', false, 'I have excellent ideas.',                              'Tengo muy buenas ideas.'),
  Q('q30', 'O', true,  'I do not have a good imagination.',                    'No tengo buena imaginación.'),
]

export type BigFiveScores = {
  traits: Record<Trait, number>   // 1..5 means
  level: Record<Trait, 'low' | 'moderate' | 'high'>
  top: Trait
  bottom: Trait
}

function score(raw: RawAnswers): BigFiveScores {
  const buckets: Record<Trait, number[]> = { E: [], A: [], C: [], N: [], O: [] }
  for (const q of QUESTIONS) {
    const subscale = q.meta.subscale
    const trait = subscale[0] as Trait
    const reverse = subscale.endsWith('_R')
    const v = Number(raw[q.id])
    if (!Number.isFinite(v) || v < 1 || v > 5) continue
    buckets[trait].push(reverse ? 6 - v : v)
  }
  const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const traits: Record<Trait, number> = {
    E: mean(buckets.E), A: mean(buckets.A), C: mean(buckets.C), N: mean(buckets.N), O: mean(buckets.O),
  }
  const level = (v: number): 'low' | 'moderate' | 'high' => v >= 3.67 ? 'high' : v >= 2.5 ? 'moderate' : 'low'
  const levels: Record<Trait, 'low' | 'moderate' | 'high'> = {
    E: level(traits.E), A: level(traits.A), C: level(traits.C), N: level(traits.N), O: level(traits.O),
  }
  const sorted = (Object.keys(traits) as Trait[]).slice().sort((a, b) => traits[b] - traits[a])
  return { traits, level: levels, top: sorted[0], bottom: sorted[sorted.length - 1] }
}

const TRAIT_META: Record<Trait, { nameEn: string; nameEs: string; descEn: string; descEs: string; highEn: string; highEs: string; lowEn: string; lowEs: string }> = {
  E: {
    nameEn: 'Extraversion', nameEs: 'Extraversión',
    descEn: 'Sociability, assertiveness, energy in social contexts.',
    descEs: 'Sociabilidad, asertividad, energía en contextos sociales.',
    highEn: 'Outgoing, energised by people, comfortable taking the floor; may dominate quieter peers.',
    highEs: 'Extrovertido/a, se energiza con la gente, cómodo/a tomando la palabra; puede dominar a personas más calladas.',
    lowEn: 'Reserved, draws energy from solitude, careful with words; may be missed in group settings.',
    lowEs: 'Reservado/a, se recarga en soledad, mide las palabras; puede pasar desapercibido/a en grupos.',
  },
  A: {
    nameEn: 'Agreeableness', nameEs: 'Amabilidad',
    descEn: 'Warmth, cooperation, trust in others.',
    descEs: 'Calidez, cooperación, confianza en los demás.',
    highEn: 'Cooperative, empathic, prioritises harmony; may struggle to push back or deliver hard feedback.',
    highEs: 'Cooperativo/a, empático/a, prioriza la armonía; puede costarle confrontar o dar feedback duro.',
    lowEn: 'Direct, competitive, willing to challenge; can come across as cold or transactional.',
    lowEs: 'Directo/a, competitivo/a, dispuesto/a a desafiar; puede percibirse como frío/a o transaccional.',
  },
  C: {
    nameEn: 'Conscientiousness', nameEs: 'Responsabilidad',
    descEn: 'Organisation, follow-through, attention to detail. Strongest single Big Five predictor of job performance.',
    descEs: 'Organización, cumplimiento, atención al detalle. El mejor predictor de desempeño laboral entre los cinco grandes.',
    highEn: 'Reliable, organised, finishes what they start; can be inflexible or perfectionist.',
    highEs: 'Fiable, organizado/a, termina lo que empieza; puede ser inflexible o perfeccionista.',
    lowEn: 'Flexible, comfortable with loose structures; may miss deadlines or details.',
    lowEs: 'Flexible, cómodo/a con estructuras laxas; puede saltarse plazos o detalles.',
  },
  N: {
    nameEn: 'Negative Emotionality', nameEs: 'Emocionalidad Negativa',
    descEn: 'Frequency of negative emotions (worry, stress, mood swings). Inverse of emotional stability.',
    descEs: 'Frecuencia de emociones negativas (preocupación, estrés, cambios de ánimo). Inverso de la estabilidad emocional.',
    highEn: 'More reactive to stress, may experience anxiety or low mood; often paired with high empathy.',
    highEs: 'Más reactivo/a al estrés, puede experimentar ansiedad o ánimo bajo; suele ir con alta empatía.',
    lowEn: 'Even-keeled, recovers quickly from setbacks; may underestimate risk or others\' distress.',
    lowEs: 'Estable, se recupera rápido de los reveses; puede subestimar el riesgo o el malestar de los demás.',
  },
  O: {
    nameEn: 'Open-Mindedness', nameEs: 'Apertura',
    descEn: 'Intellectual curiosity, openness to new ideas and aesthetic experiences.',
    descEs: 'Curiosidad intelectual, apertura a ideas nuevas y experiencias estéticas.',
    highEn: 'Curious, imaginative, comfortable with ambiguity; may chase novelty over execution.',
    highEs: 'Curioso/a, imaginativo/a, cómodo/a con la ambigüedad; puede priorizar la novedad sobre la ejecución.',
    lowEn: 'Practical, prefers proven methods; may resist change or unconventional ideas.',
    lowEs: 'Práctico/a, prefiere métodos probados; puede resistirse al cambio o a ideas no convencionales.',
  },
}

const LEVEL_LABEL = {
  en: { low: 'Lower', moderate: 'Average', high: 'Higher' },
  es: { low: 'Bajo', moderate: 'Medio', high: 'Alto' },
}

function generateHtml(args: {
  scores: BigFiveScores
  candidateName: string
  jobTitle: string
  completedAt: string | null
  language: 'en' | 'es'
}): string {
  const { scores, candidateName, jobTitle, completedAt, language } = args
  const t = language === 'es'
    ? { title: 'Personalidad Big Five', subtitle: 'Perfil basado en el modelo de cinco grandes (Goldberg, IPIP)', candidate: 'Candidato/a', role: 'Puesto', completed: 'Completado', breakdown: 'Perfil por rasgo', methodNote: 'Nota metodológica: 30 ítems del International Personality Item Pool (Goldberg, dominio público), 6 por rasgo, escala Likert 1-5. Los ítems inversos se voltean antes de promediar. Los niveles son: Alto ≥ 3,67, Medio 2,5-3,66, Bajo < 2,5.' }
    : { title: 'Big Five Personality', subtitle: 'Profile based on the five-factor model (Goldberg, IPIP)', candidate: 'Candidate', role: 'Role', completed: 'Completed', breakdown: 'Trait breakdown', methodNote: 'Methods note: 30 items from the International Personality Item Pool (Goldberg, public domain), 6 per trait, Likert 1-5. Reverse items are flipped before averaging. Levels: Higher >= 3.67, Average 2.5-3.66, Lower < 2.5.' }

  const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
  const pct = (x: number) => Math.round((x / 5) * 100)
  const traitOrder: Trait[] = ['E', 'A', 'C', 'N', 'O']
  const levelLabel = LEVEL_LABEL[language]

  const bars = traitOrder.map((tr) => {
    const m = TRAIT_META[tr]
    const v = scores.traits[tr]
    const lvl = scores.level[tr]
    const colour = lvl === 'high' ? '#0A0A0A' : lvl === 'moderate' ? '#6B6B6B' : '#AEABA3'
    const high = (language === 'es' ? m.highEs : m.highEn)
    const low  = (language === 'es' ? m.lowEs  : m.lowEn)
    const desc = (language === 'es' ? m.descEs : m.descEn)
    const interp = lvl === 'high' ? high : lvl === 'low' ? low : `${desc}`
    return `<div style="margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #F0EEE8;">
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
        <span style="font-size:14px; font-weight:700; color:#0A0A0A;">${escape(language === 'es' ? m.nameEs : m.nameEn)}</span>
        <span style="font-size:13px; font-weight:700; color:${colour};">${v.toFixed(2)} / 5 · ${escape(levelLabel[lvl])}</span>
      </div>
      <div style="font-size:11px; color:#6B6B6B; margin-bottom:8px;">${escape(desc)}</div>
      <div style="height:8px; background:#F0EEE8; border-radius:99px; overflow:hidden; margin-bottom:8px;">
        <div style="height:100%; width:${pct(v)}%; background:${colour}; border-radius:99px;"></div>
      </div>
      <p style="font-size:12.5px; color:#0A0A0A; line-height:1.55; margin:0;">${escape(interp)}</p>
    </div>`
  }).join('')

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
  section h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: #AEABA3; text-transform: uppercase; margin: 0 0 14px; }
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
      <h2>${escape(t.breakdown)}</h2>
      ${bars}
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

export const bigFive: AssessmentDefinition = {
  code: 'big_five',
  name: { en: 'Big Five Personality', es: 'Personalidad Big Five' },
  description: {
    en: '30-statement self-report on five personality dimensions: Extraversion, Agreeableness, Conscientiousness, Negative Emotionality, Open-Mindedness.',
    es: 'Autoinforme de 30 frases sobre cinco dimensiones de personalidad: Extraversión, Amabilidad, Responsabilidad, Emocionalidad Negativa y Apertura.',
  },
  estimatedMinutes: 6,
  intro: {
    en: 'Rate how much each statement describes you in general, from 1 (strongly disagree) to 5 (strongly agree). Answer honestly; there are no right or wrong answers.',
    es: 'Valora cuánto te describe cada frase en general, de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). Responde con honestidad; no hay respuestas correctas o incorrectas.',
  },
  questions: QUESTIONS,
  score: (raw) => score(raw),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateHtml: (args) => generateHtml(args as any),
}

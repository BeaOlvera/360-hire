/**
 * ICAR-style cognitive reasoning assessment.
 *
 * 12 items, multiple-choice, one correct answer per item. Modelled on the
 * International Cognitive Ability Resource (Condon & Revelle, 2014). Items
 * here are freshly composed in the same style and cover 4 reasoning
 * sub-domains:
 *   - Verbal reasoning (analogies, antonyms)
 *   - Number series
 *   - Letter series
 *   - Logical reasoning (syllogisms)
 *
 * Scoring: number correct / 12, rendered as a percentile-like band.
 */

import type { AssessmentDefinition, ChoiceQuestion, RawAnswers } from './types'

type SubDomain = 'verbal' | 'number' | 'letter' | 'logic'

type Item = ChoiceQuestion & { meta: { correct: 'a' | 'b' | 'c' | 'd'; subscale: SubDomain } }

function Q(id: string, sub: SubDomain, correct: 'a' | 'b' | 'c' | 'd', en: string, es: string, options: Array<{ value: 'a' | 'b' | 'c' | 'd'; en: string; es: string }>): Item {
  return {
    id, type: 'choice',
    text: { en, es },
    options: options.map((o) => ({ value: o.value, label: { en: o.en, es: o.es } })),
    meta: { correct, subscale: sub },
  } as Item
}

const QUESTIONS: Item[] = [
  // VERBAL REASONING (3)
  Q('q1', 'verbal', 'b',
    'Knife is to fork as pen is to:',
    'Cuchillo es a tenedor lo que bolígrafo es a:',
    [
      { value: 'a', en: 'book', es: 'libro' },
      { value: 'b', en: 'pencil', es: 'lápiz' },
      { value: 'c', en: 'paper', es: 'papel' },
      { value: 'd', en: 'desk', es: 'escritorio' },
    ]),
  Q('q2', 'verbal', 'c',
    'Which word means the OPPOSITE of "scarce"?',
    '¿Qué palabra significa lo CONTRARIO de "escaso"?',
    [
      { value: 'a', en: 'rare',     es: 'raro' },
      { value: 'b', en: 'limited',  es: 'limitado' },
      { value: 'c', en: 'abundant', es: 'abundante' },
      { value: 'd', en: 'small',    es: 'pequeño' },
    ]),
  Q('q3', 'verbal', 'b',
    'Library is to books as orchard is to:',
    'Biblioteca es a libros lo que huerto es a:',
    [
      { value: 'a', en: 'soil',  es: 'tierra' },
      { value: 'b', en: 'trees', es: 'árboles' },
      { value: 'c', en: 'water', es: 'agua' },
      { value: 'd', en: 'fence', es: 'valla' },
    ]),

  // NUMBER SERIES (3)
  Q('q4', 'number', 'c',
    'What number comes next?  2, 4, 8, 16, ?',
    '¿Qué número sigue?  2, 4, 8, 16, ?',
    [
      { value: 'a', en: '24', es: '24' },
      { value: 'b', en: '28', es: '28' },
      { value: 'c', en: '32', es: '32' },
      { value: 'd', en: '20', es: '20' },
    ]),
  Q('q5', 'number', 'd',
    'What number comes next?  1, 4, 9, 16, 25, ?',
    '¿Qué número sigue?  1, 4, 9, 16, 25, ?',
    [
      { value: 'a', en: '30', es: '30' },
      { value: 'b', en: '32', es: '32' },
      { value: 'c', en: '34', es: '34' },
      { value: 'd', en: '36', es: '36' },
    ]),
  Q('q6', 'number', 'b',
    'What number comes next?  81, 27, 9, 3, ?',
    '¿Qué número sigue?  81, 27, 9, 3, ?',
    [
      { value: 'a', en: '0', es: '0' },
      { value: 'b', en: '1', es: '1' },
      { value: 'c', en: '2', es: '2' },
      { value: 'd', en: '1/3', es: '1/3' },
    ]),

  // LETTER SERIES (3)
  Q('q7', 'letter', 'a',
    'What letter comes next?  A, C, E, G, ?',
    '¿Qué letra sigue?  A, C, E, G, ?',
    [
      { value: 'a', en: 'I', es: 'I' },
      { value: 'b', en: 'H', es: 'H' },
      { value: 'c', en: 'J', es: 'J' },
      { value: 'd', en: 'K', es: 'K' },
    ]),
  Q('q8', 'letter', 'c',
    'What letter comes next?  Z, X, V, T, ?',
    '¿Qué letra sigue?  Z, X, V, T, ?',
    [
      { value: 'a', en: 'S', es: 'S' },
      { value: 'b', en: 'P', es: 'P' },
      { value: 'c', en: 'R', es: 'R' },
      { value: 'd', en: 'Q', es: 'Q' },
    ]),
  Q('q9', 'letter', 'b',
    'Which letter fits the pattern?  A, B, D, G, K, ?',
    '¿Qué letra encaja en el patrón?  A, B, D, G, K, ?',
    [
      { value: 'a', en: 'O', es: 'O' },
      { value: 'b', en: 'P', es: 'P' },
      { value: 'c', en: 'L', es: 'L' },
      { value: 'd', en: 'N', es: 'N' },
    ]),

  // LOGICAL REASONING (3)
  Q('q10', 'logic', 'c',
    'All cats are mammals. Some mammals are dogs. Which conclusion necessarily follows?',
    'Todos los gatos son mamíferos. Algunos mamíferos son perros. ¿Qué conclusión se sigue necesariamente?',
    [
      { value: 'a', en: 'All cats are dogs.',           es: 'Todos los gatos son perros.' },
      { value: 'b', en: 'Some dogs are cats.',          es: 'Algunos perros son gatos.' },
      { value: 'c', en: 'No necessary conclusion follows about cats and dogs.', es: 'No se sigue necesariamente ninguna conclusión sobre gatos y perros.' },
      { value: 'd', en: 'No mammal is a cat.',          es: 'Ningún mamífero es un gato.' },
    ]),
  Q('q11', 'logic', 'b',
    'If it rains, the streets get wet. The streets are wet. Which conclusion necessarily follows?',
    'Si llueve, las calles se mojan. Las calles están mojadas. ¿Qué conclusión se sigue necesariamente?',
    [
      { value: 'a', en: 'It rained.',                                   es: 'Llovió.' },
      { value: 'b', en: 'We cannot conclude whether it rained.',        es: 'No se puede concluir si llovió.' },
      { value: 'c', en: 'It did not rain.',                              es: 'No llovió.' },
      { value: 'd', en: 'It will rain soon.',                            es: 'Lloverá pronto.' },
    ]),
  Q('q12', 'logic', 'a',
    'All accountants are good with numbers. Maria is good with numbers. Which conclusion necessarily follows?',
    'Todos los contables son buenos con los números. María es buena con los números. ¿Qué conclusión se sigue necesariamente?',
    [
      { value: 'a', en: 'Maria might or might not be an accountant.',   es: 'María puede o no ser contable.' },
      { value: 'b', en: 'Maria is an accountant.',                       es: 'María es contable.' },
      { value: 'c', en: 'Maria is not an accountant.',                   es: 'María no es contable.' },
      { value: 'd', en: 'No accountant is bad with numbers, so Maria is good.', es: 'Ningún contable es malo con los números, así que María es buena.' },
    ]),
]

const TOTAL = QUESTIONS.length

export type IcarScores = {
  correct: number
  total: number
  ratio: number            // 0..1
  bySubscale: Record<SubDomain, { correct: number; total: number; ratio: number }>
  band: 'low' | 'average' | 'high'
}

function score(raw: RawAnswers): IcarScores {
  const sub: Record<SubDomain, { correct: number; total: number }> = {
    verbal: { correct: 0, total: 0 }, number: { correct: 0, total: 0 },
    letter: { correct: 0, total: 0 }, logic: { correct: 0, total: 0 },
  }
  let correct = 0
  for (const q of QUESTIONS) {
    sub[q.meta.subscale].total += 1
    if (raw[q.id] === q.meta.correct) {
      correct += 1
      sub[q.meta.subscale].correct += 1
    }
  }
  const ratio = correct / TOTAL
  const band: 'low' | 'average' | 'high' = ratio >= 0.75 ? 'high' : ratio >= 0.4 ? 'average' : 'low'
  const bySubscale: Record<SubDomain, { correct: number; total: number; ratio: number }> = {
    verbal: { ...sub.verbal, ratio: sub.verbal.total ? sub.verbal.correct / sub.verbal.total : 0 },
    number: { ...sub.number, ratio: sub.number.total ? sub.number.correct / sub.number.total : 0 },
    letter: { ...sub.letter, ratio: sub.letter.total ? sub.letter.correct / sub.letter.total : 0 },
    logic:  { ...sub.logic,  ratio: sub.logic.total  ? sub.logic.correct  / sub.logic.total  : 0 },
  }
  return { correct, total: TOTAL, ratio, bySubscale, band }
}

const SUB_META: Record<SubDomain, { nameEn: string; nameEs: string }> = {
  verbal: { nameEn: 'Verbal reasoning',  nameEs: 'Razonamiento verbal' },
  number: { nameEn: 'Number reasoning',  nameEs: 'Razonamiento numérico' },
  letter: { nameEn: 'Letter series',     nameEs: 'Series de letras' },
  logic:  { nameEn: 'Logical reasoning', nameEs: 'Razonamiento lógico' },
}

const BAND_INTERP = {
  en: {
    low: { headline: 'Lower reasoning band', body: 'On this short reasoning battery the candidate answered fewer than 40% of items correctly. Reasoning batteries this short are noisy; treat as one of several signals.' },
    average: { headline: 'Average reasoning band', body: 'The candidate answered around half to three-quarters of the items correctly. Reasoning ability appears adequate for most analytical work; combine with other signals.' },
    high: { headline: 'Higher reasoning band', body: 'The candidate answered most items correctly. Reasoning ability appears strong on this short battery.' },
  },
  es: {
    low: { headline: 'Banda baja de razonamiento', body: 'En esta batería breve, el/la candidato/a respondió correctamente menos del 40% de los ítems. Una batería tan corta es ruidosa; trátalo como una señal más entre varias.' },
    average: { headline: 'Banda media de razonamiento', body: 'El/la candidato/a respondió correctamente entre la mitad y tres cuartos de los ítems. La capacidad de razonamiento parece adecuada para la mayoría de trabajos analíticos; combínalo con otras señales.' },
    high: { headline: 'Banda alta de razonamiento', body: 'El/la candidato/a respondió correctamente la mayoría de los ítems. La capacidad de razonamiento parece sólida en esta batería breve.' },
  },
}

function generateHtml(args: {
  scores: IcarScores
  candidateName: string
  jobTitle: string
  completedAt: string | null
  language: 'en' | 'es'
}): string {
  const { scores, candidateName, jobTitle, completedAt, language } = args
  const interp = (language === 'es' ? BAND_INTERP.es : BAND_INTERP.en)[scores.band]
  const t = language === 'es'
    ? { title: 'Razonamiento (ICAR-style)', subtitle: 'Batería breve de razonamiento general', candidate: 'Candidato/a', role: 'Puesto', completed: 'Completado', overall: 'Resultado general', subscales: 'Desglose por subdominio', correct: 'correctas', methodNote: 'Nota metodológica: 12 ítems de elección múltiple modelados sobre el International Cognitive Ability Resource (Condon y Revelle, 2014, ICAR es gratuito y de uso abierto). Subdominios: razonamiento verbal, numérico, series de letras y razonamiento lógico. Bandas: Alta ≥ 75% correctas, Media 40-74%, Baja < 40%. Es una batería corta, no un test cognitivo completo; trátalo como una señal entre varias.' }
    : { title: 'Reasoning (ICAR-style)', subtitle: 'Brief general-reasoning battery', candidate: 'Candidate', role: 'Role', completed: 'Completed', overall: 'Overall result', subscales: 'Subdomain breakdown', correct: 'correct', methodNote: 'Methods note: 12 multiple-choice items modelled on the International Cognitive Ability Resource (Condon & Revelle, 2014, ICAR is open and free). Subdomains: verbal, number, letter series, logical reasoning. Bands: Higher >= 75% correct, Average 40-74%, Lower < 40%. This is a short battery, not a full cognitive test; treat as one signal among several.' }

  const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
  const ratioPct = Math.round(scores.ratio * 100)
  const bandColor = scores.band === 'high' ? '#0A0A0A' : scores.band === 'average' ? '#6B6B6B' : '#AEABA3'

  const subOrder: SubDomain[] = ['verbal', 'number', 'letter', 'logic']
  const subBars = subOrder.map((s) => {
    const m = SUB_META[s]
    const v = scores.bySubscale[s]
    const pct = Math.round(v.ratio * 100)
    const color = v.ratio >= 0.75 ? '#0A0A0A' : v.ratio >= 0.4 ? '#6B6B6B' : '#AEABA3'
    return `<div style="margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
        <span style="font-size:12.5px; font-weight:700; color:#0A0A0A;">${escape(language === 'es' ? m.nameEs : m.nameEn)}</span>
        <span style="font-size:12px; font-weight:700; color:${color};">${v.correct} / ${v.total} ${escape(t.correct)}</span>
      </div>
      <div style="height:6px; background:#F0EEE8; border-radius:99px; overflow:hidden;">
        <div style="height:100%; width:${pct}%; background:${color}; border-radius:99px;"></div>
      </div>
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
  section { margin-bottom: 28px; }
  section h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: #AEABA3; text-transform: uppercase; margin: 0 0 12px; }
  .verdict { background: #F5F4F0; border: 1px solid #E2E0DA; border-radius: 14px; padding: 20px 22px; }
  .verdict .num { font-size: 42px; font-weight: 800; color: ${bandColor}; letter-spacing: -0.8px; }
  .verdict .num-of { font-size: 18px; color: #AEABA3; font-weight: 600; }
  .verdict .headline { font-size: 16px; font-weight: 700; color: #0A0A0A; margin-top: 8px; }
  .verdict .body { font-size: 13px; color: #0A0A0A; line-height: 1.6; margin-top: 8px; }
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
        <span class="num">${scores.correct}</span><span class="num-of"> / ${scores.total} (${ratioPct}%)</span>
        <div class="headline">${escape(interp.headline)}</div>
        <p class="body">${escape(interp.body)}</p>
      </div>
    </section>

    <section>
      <h2>${escape(t.subscales)}</h2>
      ${subBars}
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

export const icarReasoning: AssessmentDefinition = {
  code: 'icar_reasoning',
  name: { en: 'Reasoning (ICAR-style)', es: 'Razonamiento (ICAR-style)' },
  description: {
    en: '12 multiple-choice reasoning items across verbal, numerical, letter-series and logical sub-domains. Has right and wrong answers.',
    es: '12 ítems de razonamiento de elección múltiple en subdominios verbal, numérico, series de letras y lógico. Tiene respuestas correctas e incorrectas.',
  },
  estimatedMinutes: 8,
  intro: {
    en: 'For each question, pick the single best answer. You have unlimited time but try to answer in 30 to 60 seconds per item. No external help is expected (no calculators, no search). Answer honestly even if unsure.',
    es: 'Para cada pregunta, elige la mejor respuesta. No hay límite de tiempo pero intenta responder en 30 a 60 segundos por ítem. No se espera ayuda externa (sin calculadora, sin búsqueda). Responde con honestidad aunque no estés seguro/a.',
  },
  questions: QUESTIONS,
  score: (raw) => score(raw),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateHtml: (args) => generateHtml(args as any),
}

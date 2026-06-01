/**
 * Career Values assessment.
 *
 * 24 Likert-5 items mapped to 8 career anchors (Schein's framework, original
 * wording so we do not infringe COI copyright). 3 items per anchor.
 *
 * Anchors:
 *   TF - Technical / Functional Competence
 *   GM - General Managerial Competence
 *   AU - Autonomy / Independence
 *   SE - Security / Stability
 *   EC - Entrepreneurial Creativity
 *   SV - Service / Dedication to a Cause
 *   CH - Pure Challenge
 *   LS - Lifestyle
 *
 * The top 1-3 anchors (by mean) are the dominant career drivers.
 */

import type { AssessmentDefinition, LikertQuestion, RawAnswers } from './types'

export type Anchor = 'TF' | 'GM' | 'AU' | 'SE' | 'EC' | 'SV' | 'CH' | 'LS'

const Q = (id: string, anchor: Anchor, en: string, es: string): LikertQuestion => ({
  id, type: 'likert5', text: { en, es }, meta: { subscale: anchor },
})

const QUESTIONS: LikertQuestion[] = [
  // Technical / Functional Competence
  Q('q1',  'TF', 'I would rather become an acknowledged expert in my field than rise to a senior management role outside it.', 'Preferiría llegar a ser un/a referente experto/a en mi campo antes que ascender a un rol directivo fuera de él.'),
  Q('q2',  'TF', 'I want my career to deepen my expertise in a specific area I find intrinsically interesting.', 'Quiero que mi carrera profundice mi experiencia en un área específica que me resulta intrínsecamente interesante.'),
  Q('q3',  'TF', 'Being recognized as highly skilled in my specialty matters more to me than holding a senior title.', 'Que me reconozcan como altamente competente en mi especialidad me importa más que tener un título senior.'),

  // General Managerial Competence
  Q('q4',  'GM', 'I want to be responsible for the overall results of a business unit, not just a technical area.', 'Quiero ser responsable de los resultados globales de una unidad de negocio, no solo de un área técnica.'),
  Q('q5',  'GM', 'I would feel most successful leading a team that integrates many different functions.', 'Me sentiría más exitoso/a liderando un equipo que integra muchas funciones distintas.'),
  Q('q6',  'GM', 'I am drawn to roles where my impact comes from coordinating people rather than doing the technical work myself.', 'Me atraen los roles donde mi impacto viene de coordinar a las personas más que de hacer el trabajo técnico yo mismo/a.'),

  // Autonomy / Independence
  Q('q7',  'AU', 'I value being able to decide for myself how, when, and where I do my work.', 'Valoro poder decidir por mí mismo/a cómo, cuándo y dónde hago mi trabajo.'),
  Q('q8',  'AU', 'I would turn down an attractive role if it required me to follow rigid procedures set by others.', 'Rechazaría un rol atractivo si requiriera seguir procedimientos rígidos impuestos por otros.'),
  Q('q9',  'AU', 'Freedom from close supervision matters more to me than a higher salary.', 'La libertad respecto a una supervisión cercana me importa más que un salario más alto.'),

  // Security / Stability
  Q('q10', 'SE', 'A predictable, stable job matters more to me than one with high upside but uncertainty.', 'Un trabajo predecible y estable me importa más que uno con mucho potencial pero incierto.'),
  Q('q11', 'SE', 'I would prefer to stay with one employer long term if they offer security and a fair deal.', 'Preferiría quedarme con un mismo empleador a largo plazo si me ofrece seguridad y un trato justo.'),
  Q('q12', 'SE', 'I would not take a more exciting role if it meant putting my income or job security at risk.', 'No aceptaría un rol más emocionante si pusiera en riesgo mis ingresos o mi seguridad laboral.'),

  // Entrepreneurial Creativity
  Q('q13', 'EC', 'I dream of building something, a product, service, or organization, that is recognizably mine.', 'Sueño con construir algo, un producto, un servicio o una organización, que sea reconociblemente mío/a.'),
  Q('q14', 'EC', 'I would take significant financial risk to launch a venture I believed in.', 'Asumiría un riesgo financiero significativo para lanzar un proyecto en el que creyera.'),
  Q('q15', 'EC', 'I feel most alive when I am creating something new rather than improving what already exists.', 'Me siento más vivo/a creando algo nuevo que mejorando lo que ya existe.'),

  // Service / Dedication to a Cause
  Q('q16', 'SV', 'I want my work to contribute to something I consider socially worthwhile.', 'Quiero que mi trabajo contribuya a algo que considero socialmente valioso.'),
  Q('q17', 'SV', 'I would not be satisfied in a role, however prestigious, that did not align with my values.', 'No me sentiría satisfecho/a en un rol, por prestigioso que fuera, que no se alineara con mis valores.'),
  Q('q18', 'SV', 'Making a positive difference matters more to me than career advancement.', 'Marcar una diferencia positiva me importa más que el avance en la carrera.'),

  // Pure Challenge
  Q('q19', 'CH', 'I am drawn to problems other people consider too difficult to solve.', 'Me atraen los problemas que otras personas consideran demasiado difíciles de resolver.'),
  Q('q20', 'CH', 'I lose interest in a job once the hardest parts have been figured out.', 'Pierdo el interés en un trabajo una vez resueltas las partes más difíciles.'),
  Q('q21', 'CH', 'I define career success in terms of overcoming obstacles, not titles or compensation.', 'Defino el éxito profesional en términos de superar obstáculos, no de títulos ni compensación.'),

  // Lifestyle
  Q('q22', 'LS', 'I would turn down a promotion if it disrupted the balance between my work and personal life.', 'Rechazaría una promoción si alterara el equilibrio entre mi vida laboral y personal.'),
  Q('q23', 'LS', 'Flexibility to integrate my career with my family and personal interests is a deal-breaker for me.', 'La flexibilidad para integrar mi carrera con mi familia e intereses personales es innegociable para mí.'),
  Q('q24', 'LS', 'I evaluate job offers as much on lifestyle fit as on the work itself.', 'Evalúo las ofertas de trabajo tanto por el encaje con mi estilo de vida como por el trabajo en sí.'),
]

export type CareerValuesScores = {
  anchors: Record<Anchor, number>     // 1..5 means
  top: Anchor[]                       // top 3
  dominant: Anchor                    // top 1
  spread: number                      // top mean minus bottom mean (clarity indicator)
}

function score(raw: RawAnswers): CareerValuesScores {
  const buckets: Record<Anchor, number[]> = { TF: [], GM: [], AU: [], SE: [], EC: [], SV: [], CH: [], LS: [] }
  for (const q of QUESTIONS) {
    const v = Number(raw[q.id])
    if (Number.isFinite(v) && v >= 1 && v <= 5) {
      buckets[q.meta.subscale as Anchor].push(v)
    }
  }
  const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const anchors: Record<Anchor, number> = {
    TF: mean(buckets.TF), GM: mean(buckets.GM), AU: mean(buckets.AU), SE: mean(buckets.SE),
    EC: mean(buckets.EC), SV: mean(buckets.SV), CH: mean(buckets.CH), LS: mean(buckets.LS),
  }
  const sorted = (Object.keys(anchors) as Anchor[]).slice().sort((a, b) => anchors[b] - anchors[a])
  const top = sorted.slice(0, 3)
  const spread = anchors[sorted[0]] - anchors[sorted[sorted.length - 1]]
  return { anchors, top, dominant: sorted[0], spread }
}

const ANCHOR_META: Record<Anchor, { nameEn: string; nameEs: string; descEn: string; descEs: string; colorBg: string; color: string }> = {
  TF: { nameEn: 'Technical / Functional', nameEs: 'Técnico / Funcional',
        descEn: 'Driven by deep expertise in a specific field, not by general management.',
        descEs: 'Movido/a por la experiencia profunda en un campo específico, no por la gestión general.',
        colorBg: '#E2E0DA', color: '#0A0A0A' },
  GM: { nameEn: 'General Managerial', nameEs: 'Dirección General',
        descEn: 'Driven by responsibility for overall results, integrating many functions.',
        descEs: 'Movido/a por la responsabilidad sobre resultados globales, integrando múltiples funciones.',
        colorBg: '#E2E0DA', color: '#0A0A0A' },
  AU: { nameEn: 'Autonomy', nameEs: 'Autonomía',
        descEn: 'Driven by freedom to choose how, when, and where to work.',
        descEs: 'Movido/a por la libertad de elegir cómo, cuándo y dónde trabajar.',
        colorBg: '#EAEAEA', color: '#3F3F3F' },
  SE: { nameEn: 'Security / Stability', nameEs: 'Seguridad / Estabilidad',
        descEn: 'Driven by predictability, long-term tenure, and risk avoidance.',
        descEs: 'Movido/a por la predictibilidad, la continuidad a largo plazo y evitar riesgos.',
        colorBg: '#EAEAEA', color: '#3F3F3F' },
  EC: { nameEn: 'Entrepreneurial Creativity', nameEs: 'Creatividad Emprendedora',
        descEn: 'Driven by building something recognizably your own; willing to take risk.',
        descEs: 'Movido/a por construir algo reconociblemente propio; dispuesto/a a asumir riesgos.',
        colorBg: '#F0EEE8', color: '#6B6B6B' },
  SV: { nameEn: 'Service / Cause', nameEs: 'Servicio / Causa',
        descEn: 'Driven by making a difference aligned with your values, not by advancement alone.',
        descEs: 'Movido/a por aportar una diferencia alineada con tus valores, no solo por avanzar.',
        colorBg: '#F0EEE8', color: '#6B6B6B' },
  CH: { nameEn: 'Pure Challenge', nameEs: 'Reto Puro',
        descEn: 'Driven by hard problems; success is overcoming obstacles, not titles.',
        descEs: 'Movido/a por los problemas difíciles; el éxito es superar obstáculos, no los títulos.',
        colorBg: '#F5F4F0', color: '#AEABA3' },
  LS: { nameEn: 'Lifestyle', nameEs: 'Estilo de Vida',
        descEn: 'Driven by integration between work and personal life; flexibility is non-negotiable.',
        descEs: 'Movido/a por la integración entre trabajo y vida personal; la flexibilidad es innegociable.',
        colorBg: '#F5F4F0', color: '#AEABA3' },
}

function generateHtml(args: {
  scores: CareerValuesScores
  candidateName: string
  jobTitle: string
  completedAt: string | null
  language: 'en' | 'es'
}): string {
  const { scores, candidateName, jobTitle, completedAt, language } = args
  const t = language === 'es'
    ? { title: 'Valores Profesionales', subtitle: 'Lo que realmente motiva tu carrera', candidate: 'Candidato/a', role: 'Puesto', completed: 'Completado', topAnchors: 'Anclas principales', allAnchors: 'Todas las anclas', methodNote: 'Nota metodológica: 24 ítems Likert 1-5 mapeados a las ocho anclas de carrera de Schein (Schein 1996; Schein y Van Maanen 2016). Redacción original mapeada al marco publicado, sin usar el Career Orientations Inventory (COI). Se promedian 3 ítems por ancla; las 1-3 anclas más altas son las dominantes.' }
    : { title: 'Career Values', subtitle: 'What actually drives your career', candidate: 'Candidate', role: 'Role', completed: 'Completed', topAnchors: 'Top anchors', allAnchors: 'All anchors', methodNote: 'Methods note: 24 Likert 1-5 items mapped to Schein\'s eight career anchors (Schein 1996; Schein & Van Maanen 2016). Original wording mapped to the published framework; the Career Orientations Inventory (COI) itself is not used. Three items per anchor are averaged; the top 1-3 anchors are the dominant career drivers.' }

  const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
  const pct = (x: number) => Math.round((x / 5) * 100)

  // Vertical bar chart of all 8 anchors, sorted descending
  const allSorted = (Object.keys(scores.anchors) as Anchor[]).slice().sort((a, b) => scores.anchors[b] - scores.anchors[a])
  const barW = 80
  const barGap = 12
  const chartW = allSorted.length * (barW + barGap)
  const chartH = 220
  const maxH = chartH - 50

  const chart = `<svg width="${chartW}" height="${chartH}" viewBox="0 0 ${chartW} ${chartH}" style="display:block; margin:0 auto;">
    ${allSorted.map((a, i) => {
      const m = ANCHOR_META[a]
      const v = scores.anchors[a]
      const h = (v / 5) * maxH
      const x = i * (barW + barGap)
      const y = chartH - 40 - h
      const isTop = scores.top.includes(a)
      return `
        <rect x="${x + 6}" y="${y}" width="${barW - 12}" height="${h}" rx="6" fill="${m.color}" opacity="${isTop ? 1 : 0.45}" />
        <text x="${x + barW/2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="${m.color}" font-family="-apple-system, sans-serif">${v.toFixed(1)}</text>
        <text x="${x + barW/2}" y="${chartH - 22}" text-anchor="middle" font-size="10" font-weight="700" fill="#0A0A0A" font-family="-apple-system, sans-serif">${a}</text>
        <text x="${x + barW/2}" y="${chartH - 8}" text-anchor="middle" font-size="8" fill="#6B6B6B" font-family="-apple-system, sans-serif">${escape((language === 'es' ? m.nameEs : m.nameEn).split(' ')[0])}</text>
      `
    }).join('')}
  </svg>`

  const topCard = (a: Anchor, rank: number) => {
    const m = ANCHOR_META[a]
    return `<div style="background:${m.colorBg}; border:1px solid ${m.color}55; border-radius:14px; padding:18px 20px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
        <span style="font-size:10px; font-weight:800; letter-spacing:0.12em; color:${m.color}; text-transform:uppercase;">#${rank} · ${escape(language === 'es' ? m.nameEs : m.nameEn)}</span>
        <span style="font-size:13px; font-weight:800; color:${m.color};">${scores.anchors[a].toFixed(2)} / 5</span>
      </div>
      <p style="font-size:12.5px; color:#0A0A0A; line-height:1.55; margin:0;">${escape(language === 'es' ? m.descEs : m.descEn)}</p>
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
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .chart-wrap { background: #F5F4F0; border-radius: 14px; padding: 16px 12px; overflow-x: auto; }
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
      <h2>${escape(t.topAnchors)}</h2>
      <div class="grid3">
        ${scores.top.map((a, i) => topCard(a, i + 1)).join('')}
      </div>
    </section>

    <section>
      <h2>${escape(t.allAnchors)}</h2>
      <div class="chart-wrap">${chart}</div>
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

export const careerValues: AssessmentDefinition = {
  code: 'career_values',
  name: { en: 'Career Values', es: 'Valores Profesionales' },
  description: {
    en: 'A 24-statement self-report on what truly drives your career: expertise, leadership, autonomy, stability, creating, service, challenge, or lifestyle.',
    es: 'Un autoinforme de 24 frases sobre lo que realmente motiva tu carrera: experiencia, liderazgo, autonomía, estabilidad, crear, servicio, reto o estilo de vida.',
  },
  estimatedMinutes: 6,
  intro: {
    en: 'Rate how much each statement describes you, from 1 (strongly disagree) to 5 (strongly agree). Answer based on what you actually value, not what sounds best.',
    es: 'Valora cuánto te describe cada frase, de 1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo). Responde según lo que realmente valoras, no lo que suena mejor.',
  },
  questions: QUESTIONS,
  score: (raw) => score(raw),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateHtml: (args) => generateHtml(args as any),
}

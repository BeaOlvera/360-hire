/**
 * Culture Fit assessment (OCAI, Cameron & Quinn).
 *
 * 6 dimensions (Dominant Characteristics, Organizational Leadership, Management of
 * Employees, Organization Glue, Strategic Emphases, Criteria of Success). For each
 * dimension, the respondent allocates 100 points across 4 statements that map to
 * the four Competing-Values quadrants: Clan / Adhocracy / Market / Hierarchy.
 *
 * Result: a 4-dim profile of the candidate's PREFERRED culture.
 *
 * Company culture: stored separately on jobs.culture_profile (admin-entered, same
 * 4 dimensions). Fit score is computed at the admin layer (lib/culture_fit_score.ts)
 * via Euclidean distance normalized to 0..1.
 *
 * v1 implementation note: the standard OCAI uses a "Now" + "Preferred" double-rating.
 * For hiring we only ask the candidate about PREFERRED (what kind of organization
 * they want to work in). The company's "Now" is the admin's input.
 */

import type { AssessmentDefinition, RawAnswers, Question } from './types'

export type CultureType = 'CLAN' | 'ADHOCRACY' | 'MARKET' | 'HIERARCHY'
const TYPES: CultureType[] = ['CLAN', 'ADHOCRACY', 'MARKET', 'HIERARCHY']

/**
 * For OCAI we use a custom answer shape: each question has 4 numeric inputs (a/b/c/d)
 * summing to 100. We encode that as 4 sub-keys per question: q1_a, q1_b, q1_c, q1_d.
 * To keep the existing Likert/forced-choice UI pipeline simple, we DON'T use the
 * standard Question type for OCAI rendering; instead, we expose a custom
 * `dimensions` field, and the candidate UI special-cases this assessment.
 */

export type OcaiDimension = {
  id: string
  title: { en: string; es: string }
  statements: Record<CultureType, { en: string; es: string }>
}

const DIMENSIONS: OcaiDimension[] = [
  {
    id: 'd1',
    title: { en: '1. Dominant characteristics', es: '1. Características dominantes' },
    statements: {
      CLAN:      { en: 'The organization is a very personal place. It is like an extended family. People seem to share a lot of themselves.', es: 'La organización es un lugar muy personal. Es como una familia extendida. Las personas comparten mucho de sí mismas.' },
      ADHOCRACY: { en: 'The organization is a very dynamic and entrepreneurial place. People are willing to stick their necks out and take risks.', es: 'La organización es un lugar muy dinámico y emprendedor. Las personas están dispuestas a apostar y asumir riesgos.' },
      MARKET:    { en: 'The organization is very results-oriented. A major concern is with getting the job done. People are competitive and achievement-oriented.', es: 'La organización está muy orientada a resultados. La preocupación principal es entregar. Las personas son competitivas y orientadas al logro.' },
      HIERARCHY: { en: 'The organization is a very controlled and structured place. Formal procedures generally govern what people do.', es: 'La organización es un lugar muy controlado y estructurado. Los procedimientos formales gobiernan lo que las personas hacen.' },
    },
  },
  {
    id: 'd2',
    title: { en: '2. Organizational leadership', es: '2. Liderazgo organizacional' },
    statements: {
      CLAN:      { en: 'Leadership in the organization is generally considered to exemplify mentoring, facilitating, or nurturing.', es: 'El liderazgo de la organización se considera generalmente como mentor, facilitador o cuidador.' },
      ADHOCRACY: { en: 'Leadership in the organization is generally considered to exemplify entrepreneurship, innovating, or risk-taking.', es: 'El liderazgo se considera generalmente como emprendedor, innovador o tomador de riesgos.' },
      MARKET:    { en: 'Leadership in the organization is generally considered to exemplify a no-nonsense, aggressive, results-oriented focus.', es: 'El liderazgo se considera generalmente directo, agresivo y orientado a resultados.' },
      HIERARCHY: { en: 'Leadership in the organization is generally considered to exemplify coordinating, organizing, or smooth-running efficiency.', es: 'El liderazgo se considera generalmente como coordinador, organizador o eficiente.' },
    },
  },
  {
    id: 'd3',
    title: { en: '3. Management of employees', es: '3. Gestión de personas' },
    statements: {
      CLAN:      { en: 'The management style is characterized by teamwork, consensus, and participation.', es: 'El estilo de gestión se caracteriza por el trabajo en equipo, el consenso y la participación.' },
      ADHOCRACY: { en: 'The management style is characterized by individual risk-taking, innovation, freedom, and uniqueness.', es: 'El estilo de gestión se caracteriza por la asunción individual de riesgos, la innovación, la libertad y la singularidad.' },
      MARKET:    { en: 'The management style is characterized by hard-driving competitiveness, high demands, and achievement.', es: 'El estilo de gestión se caracteriza por una competitividad exigente, altas exigencias y logro.' },
      HIERARCHY: { en: 'The management style is characterized by security of employment, conformity, predictability, and stability.', es: 'El estilo de gestión se caracteriza por la seguridad en el empleo, la conformidad, la predictibilidad y la estabilidad.' },
    },
  },
  {
    id: 'd4',
    title: { en: '4. Organization glue', es: '4. El "pegamento" de la organización' },
    statements: {
      CLAN:      { en: 'The glue that holds the organization together is loyalty and mutual trust. Commitment to this organization runs high.', es: 'Lo que mantiene a la organización unida es la lealtad y la confianza mutua. El compromiso es alto.' },
      ADHOCRACY: { en: 'The glue that holds the organization together is commitment to innovation and development. There is an emphasis on being on the cutting edge.', es: 'Lo que mantiene unida a la organización es el compromiso con la innovación y el desarrollo. Se enfatiza estar en la vanguardia.' },
      MARKET:    { en: 'The glue that holds the organization together is the emphasis on achievement and goal accomplishment.', es: 'Lo que mantiene unida a la organización es el énfasis en el logro y el cumplimiento de objetivos.' },
      HIERARCHY: { en: 'The glue that holds the organization together is formal rules and policies. Maintaining a smoothly running organization is important.', es: 'Lo que mantiene unida a la organización son las reglas y políticas formales. Que todo funcione con fluidez es importante.' },
    },
  },
  {
    id: 'd5',
    title: { en: '5. Strategic emphases', es: '5. Énfasis estratégicos' },
    statements: {
      CLAN:      { en: 'The organization emphasizes human development. High trust, openness, and participation persist.', es: 'La organización enfatiza el desarrollo humano. Persiste alta confianza, apertura y participación.' },
      ADHOCRACY: { en: 'The organization emphasizes acquiring new resources and creating new challenges. Trying new things and prospecting for opportunities are valued.', es: 'La organización enfatiza adquirir nuevos recursos y crear nuevos retos. Se valora probar cosas nuevas y explorar oportunidades.' },
      MARKET:    { en: 'The organization emphasizes competitive actions and achievement. Hitting stretch targets and winning in the marketplace are dominant.', es: 'La organización enfatiza las acciones competitivas y el logro. Alcanzar objetivos exigentes y ganar en el mercado son dominantes.' },
      HIERARCHY: { en: 'The organization emphasizes permanence and stability. Efficiency, control, and smooth operations are important.', es: 'La organización enfatiza la permanencia y la estabilidad. La eficiencia, el control y las operaciones fluidas son importantes.' },
    },
  },
  {
    id: 'd6',
    title: { en: '6. Criteria of success', es: '6. Criterios de éxito' },
    statements: {
      CLAN:      { en: 'The organization defines success on the basis of the development of human resources, teamwork, employee commitment, and concern for people.', es: 'El éxito se define por el desarrollo de las personas, el trabajo en equipo, el compromiso y la preocupación por las personas.' },
      ADHOCRACY: { en: 'The organization defines success on the basis of having the most unique or newest products. It is a product leader and innovator.', es: 'El éxito se define por tener los productos más únicos o nuevos. Es un líder en producto e innovación.' },
      MARKET:    { en: 'The organization defines success on the basis of winning in the marketplace and outpacing the competition.', es: 'El éxito se define por ganar en el mercado y superar a la competencia.' },
      HIERARCHY: { en: 'The organization defines success on the basis of efficiency. Dependable delivery, smooth scheduling, and low-cost production are critical.', es: 'El éxito se define por la eficiencia. La entrega fiable, la planificación ordenada y la producción de bajo coste son críticas.' },
    },
  },
]

// Each "question id" -> 4 sub-keys per culture type, ergo we expose synthetic
// Likert-like questions only as a fallback; the real candidate UI uses a custom widget.
const QUESTIONS_SYNTHETIC: Question[] = []

export type CultureFitScores = {
  // Candidate's preferred profile: percentages across the 4 types (sum to 100).
  profile: Record<CultureType, number>
  dominant: CultureType
}

export function scoreCultureFit(raw: RawAnswers): CultureFitScores {
  // Expect keys: q{N}_{TYPE} -> number 0..100, with q1..q6 each summing to 100.
  const totals: Record<CultureType, number> = { CLAN: 0, ADHOCRACY: 0, MARKET: 0, HIERARCHY: 0 }
  let dims = 0
  for (const d of DIMENSIONS) {
    let dimSum = 0
    for (const t of TYPES) {
      const v = Number(raw[`${d.id}_${t}`])
      if (Number.isFinite(v) && v >= 0) {
        totals[t] += v
        dimSum += v
      }
    }
    if (dimSum > 0) dims += 1
  }
  // Average across dimensions; if dims == 0 fall back to equal weights
  if (dims === 0) {
    return { profile: { CLAN: 25, ADHOCRACY: 25, MARKET: 25, HIERARCHY: 25 }, dominant: 'CLAN' }
  }
  const profile: Record<CultureType, number> = {
    CLAN: totals.CLAN / dims,
    ADHOCRACY: totals.ADHOCRACY / dims,
    MARKET: totals.MARKET / dims,
    HIERARCHY: totals.HIERARCHY / dims,
  }
  const sortedKeys = TYPES.slice().sort((a, b) => profile[b] - profile[a])
  return { profile, dominant: sortedKeys[0] }
}

/**
 * Compute Euclidean distance between two profiles (4 dims, percentages summing to ~100),
 * normalized to a 0..1 fit score where 1 == identical, 0 == maximally different.
 * Max possible Euclidean distance for two profiles of percentages is sqrt(100^2 + 100^2) = ~141.4.
 */
export function cultureFitDistance(
  candidate: Record<CultureType, number>,
  company: Record<CultureType, number>,
): { distance: number; fit: number } {
  let sumSq = 0
  for (const t of TYPES) {
    const d = (candidate[t] ?? 0) - (company[t] ?? 0)
    sumSq += d * d
  }
  const distance = Math.sqrt(sumSq)
  const fit = Math.max(0, Math.min(1, 1 - distance / 141.42))
  return { distance, fit }
}

const TYPE_META: Record<CultureType, { nameEn: string; nameEs: string; color: string; bg: string; labelEn: string; labelEs: string }> = {
  CLAN:      { nameEn: 'Clan',      nameEs: 'Clan',       color: '#15803D', bg: '#DCFCE7', labelEn: 'Collaborate (family-like)', labelEs: 'Colaborar (familiar)' },
  ADHOCRACY: { nameEn: 'Adhocracy', nameEs: 'Adhocracia', color: '#A16207', bg: '#FEF3C7', labelEn: 'Create (innovative)',       labelEs: 'Crear (innovar)' },
  MARKET:    { nameEn: 'Market',    nameEs: 'Mercado',    color: '#991B1B', bg: '#FEE2E2', labelEn: 'Compete (results)',         labelEs: 'Competir (resultados)' },
  HIERARCHY: { nameEn: 'Hierarchy', nameEs: 'Jerarquía',  color: '#1E40AF', bg: '#DBEAFE', labelEn: 'Control (structured)',      labelEs: 'Controlar (estructurado)' },
}

function radarSVG(candidate: Record<CultureType, number>, company: Record<CultureType, number> | null, size = 280): string {
  const cx = size / 2, cy = size / 2
  const maxR = (size / 2) - 38
  // Order: TOP=Clan, RIGHT=Adhocracy, BOTTOM=Market, LEFT=Hierarchy (matching OCAI map: collab/create on the flexible side, control/compete on stable; but we use a 4-axis radar)
  const axes: Array<{ type: CultureType; angle: number; x: number; y: number; labelOffset: { dx: number; dy: number } }> = [
    { type: 'CLAN',      angle: -Math.PI / 2, x: cx,          y: cy - maxR, labelOffset: { dx: 0,  dy: -22 } },
    { type: 'ADHOCRACY', angle: 0,            x: cx + maxR,   y: cy,        labelOffset: { dx: 28, dy: 4 } },
    { type: 'MARKET',    angle: Math.PI / 2,  x: cx,          y: cy + maxR, labelOffset: { dx: 0,  dy: 22 } },
    { type: 'HIERARCHY', angle: Math.PI,      x: cx - maxR,   y: cy,        labelOffset: { dx: -28, dy: 4 } },
  ]
  function point(value: number, axis: typeof axes[number]) {
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxR
    return { x: cx + Math.cos(axis.angle) * r, y: cy + Math.sin(axis.angle) * r }
  }
  function polygon(values: Record<CultureType, number>): string {
    return axes.map((a) => { const p = point(values[a.type], a); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
  }

  const rings = [25, 50, 75, 100].map((v) => {
    const pts = axes.map((a) => { const p = point(v, a); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
    return `<polygon points="${pts}" fill="none" stroke="#E2E0DA" stroke-width="1" />`
  }).join('')

  const axisLines = axes.map((a) => `<line x1="${cx}" y1="${cy}" x2="${a.x}" y2="${a.y}" stroke="#E2E0DA" stroke-width="1" />`).join('')

  const labels = axes.map((a) => {
    const m = TYPE_META[a.type]
    return `<text x="${a.x + a.labelOffset.dx}" y="${a.y + a.labelOffset.dy}" text-anchor="middle" font-size="11" font-weight="700" fill="${m.color}" font-family="-apple-system, sans-serif">${m.nameEn}</text>`
  }).join('')

  const candPoly = `<polygon points="${polygon(candidate)}" fill="#0A0A0A" fill-opacity="0.25" stroke="#0A0A0A" stroke-width="2" />`
  const compPoly = company
    ? `<polygon points="${polygon(company)}" fill="#9B2335" fill-opacity="0.18" stroke="#9B2335" stroke-width="2" stroke-dasharray="6,4" />`
    : ''

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block; margin:0 auto;">
    ${rings}
    ${axisLines}
    ${candPoly}
    ${compPoly}
    ${labels}
  </svg>`
}

export function generateCultureFitHTML(args: {
  scores: CultureFitScores
  companyProfile: Record<CultureType, number> | null
  candidateName: string
  jobTitle: string
  completedAt: string | null
  language: 'en' | 'es'
}): string {
  const { scores, companyProfile, candidateName, jobTitle, completedAt, language } = args
  const t = language === 'es'
    ? { title: 'Encaje Cultural', subtitle: 'Modelo OCAI de valores competitivos (Cameron y Quinn)', candidate: 'Candidato/a', role: 'Puesto', completed: 'Completado', preferred: 'Cultura preferida por la persona candidata', company: 'Cultura de la organización', fit: 'Encaje cultural', breakdown: 'Desglose por cuadrante', dominantLabel: 'Cuadrante dominante', noCompany: 'La organización aún no ha definido su perfil cultural para este puesto, por lo que solo se muestra la preferencia de la persona candidata.', methodNote: 'Nota metodológica: OCAI (Organizational Culture Assessment Instrument) de Cameron y Quinn (1999). 6 dimensiones × 4 cuadrantes (Clan, Adhocracia, Mercado, Jerarquía); asignación de 100 puntos por dimensión. El encaje cultural es 1 menos la distancia euclidiana normalizada entre los perfiles.' }
    : { title: 'Culture Fit', subtitle: 'Competing Values Framework, OCAI (Cameron & Quinn)', candidate: 'Candidate', role: 'Role', completed: 'Completed', preferred: 'Candidate\'s preferred culture', company: 'Organization\'s culture', fit: 'Culture fit', breakdown: 'Quadrant breakdown', dominantLabel: 'Dominant quadrant', noCompany: 'The organization has not yet defined its culture profile for this role, so only the candidate\'s preference is shown.', methodNote: 'Methods note: OCAI (Organizational Culture Assessment Instrument), Cameron & Quinn (1999). 6 dimensions × 4 quadrants (Clan, Adhocracy, Market, Hierarchy); 100-point allocation per dimension. Culture fit is 1 minus the normalized Euclidean distance between the two profiles.' }

  const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'

  const fit = companyProfile ? cultureFitDistance(scores.profile, companyProfile) : null
  const fitPct = fit ? Math.round(fit.fit * 100) : null
  const dom = scores.dominant
  const domMeta = TYPE_META[dom]

  function quadrantBlock(t: CultureType): string {
    const m = TYPE_META[t]
    const v = scores.profile[t] ?? 0
    const c = companyProfile?.[t] ?? null
    return `<div style="background:${m.bg}; border:1px solid ${m.color}40; border-radius:14px; padding:14px 16px;">
      <div style="font-size:10px; font-weight:800; letter-spacing:0.12em; color:${m.color}; text-transform:uppercase; margin-bottom:4px;">${language === 'es' ? m.nameEs : m.nameEn}</div>
      <div style="font-size:10px; color:${m.color}aa; margin-bottom:10px;">${language === 'es' ? m.labelEs : m.labelEn}</div>
      <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:6px;">
        <span style="font-size:22px; font-weight:800; color:${m.color}; letter-spacing:-0.4px;">${v.toFixed(0)}</span>
        <span style="font-size:11px; color:${m.color}cc;">${language === 'es' ? 'preferencia' : 'preference'}</span>
      </div>
      ${c != null ? `<div style="display:flex; align-items:baseline; gap:8px;">
        <span style="font-size:16px; font-weight:700; color:#9B2335;">${c.toFixed(0)}</span>
        <span style="font-size:10px; color:#9B2335cc;">${language === 'es' ? 'organización' : 'organization'}</span>
      </div>` : ''}
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
  .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
  .legend { display: flex; gap: 16px; justify-content: center; font-size: 11px; color: #6B6B6B; margin-top: 6px; }
  .legend-dot { display: inline-block; width: 14px; height: 6px; vertical-align: middle; margin-right: 6px; border-radius: 2px; }
  .verdict { background: ${domMeta.bg}; border: 1px solid ${domMeta.color}55; border-radius: 14px; padding: 18px 22px; margin-bottom: 18px; }
  .verdict .small { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: ${domMeta.color}; text-transform: uppercase; margin-bottom: 6px; }
  .verdict .big { font-size: 22px; font-weight: 800; color: ${domMeta.color}; letter-spacing: -0.3px; }
  .fitcard { background: #F5F4F0; border: 1px solid #E2E0DA; border-radius: 14px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .fitcard .num { font-size: 36px; font-weight: 800; color: #0A0A0A; letter-spacing: -0.6px; }
  .fitcard .num-of { font-size: 16px; color: #AEABA3; font-weight: 600; }
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

    <div class="verdict">
      <div class="small">${escape(t.dominantLabel)}</div>
      <div class="big">${escape(language === 'es' ? domMeta.nameEs : domMeta.nameEn)} · ${escape(language === 'es' ? domMeta.labelEs : domMeta.labelEn)}</div>
    </div>

    ${fitPct != null ? `
    <div class="fitcard">
      <div>
        <div style="font-size:10px; font-weight:700; letter-spacing:0.15em; color:#AEABA3; text-transform:uppercase; margin-bottom:6px;">${escape(t.fit)}</div>
        <span class="num">${fitPct}%</span><span class="num-of"> / 100</span>
      </div>
      <div style="font-size:11px; color:#6B6B6B; line-height:1.5; max-width:340px;">
        ${language === 'es'
          ? 'Cuanto más cercanos los perfiles del/de la candidato/a y de la organización, mayor el encaje cultural.'
          : 'The closer the candidate and organization profiles, the higher the culture fit.'}
      </div>
    </div>` : `
    <div style="background:#FEF3E2; border:1px solid #F7D9A1; border-radius:14px; padding:14px 18px; margin-bottom:18px;">
      <p style="font-size:12px; color:#B7791F; margin:0;">${escape(t.noCompany)}</p>
    </div>`}

    <section>
      <h2>${escape(language === 'es' ? 'Perfiles superpuestos' : 'Profiles overlay')}</h2>
      <div style="background:#FAF9F5; border:1px solid #E2E0DA; border-radius:14px; padding:16px;">
        ${radarSVG(scores.profile, companyProfile)}
        <div class="legend">
          <span><span class="legend-dot" style="background:#0A0A0A;"></span>${escape(t.preferred)}</span>
          ${companyProfile ? `<span><span class="legend-dot" style="background:#9B2335;"></span>${escape(t.company)}</span>` : ''}
        </div>
      </div>
    </section>

    <section>
      <h2>${escape(t.breakdown)}</h2>
      <div class="grid4">
        ${quadrantBlock('CLAN')}
        ${quadrantBlock('ADHOCRACY')}
        ${quadrantBlock('MARKET')}
        ${quadrantBlock('HIERARCHY')}
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

export const cultureFit: AssessmentDefinition = {
  code: 'culture_fit',
  name: { en: 'Culture Fit', es: 'Encaje Cultural' },
  description: {
    en: 'A 6-dimension instrument mapping the kind of organizational culture you thrive in. Compared to the company\'s culture for the role.',
    es: 'Un instrumento de 6 dimensiones que mapea el tipo de cultura organizacional en la que prosperas. Se compara con la cultura de la organización para el puesto.',
  },
  estimatedMinutes: 7,
  intro: {
    en: 'For each of the six dimensions below, distribute 100 points across the four statements based on how much each describes the kind of organization you most want to work in. Higher = more preferred.',
    es: 'Para cada una de las seis dimensiones, reparte 100 puntos entre las cuatro afirmaciones según cuánto describe cada una el tipo de organización en la que más quieres trabajar. Más puntos = mayor preferencia.',
  },
  questions: QUESTIONS_SYNTHETIC,
  score: (raw) => scoreCultureFit(raw),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateHtml: (args: any) => generateCultureFitHTML({
    scores: args.scores,
    companyProfile: args.companyProfile ?? null,
    candidateName: args.candidateName,
    jobTitle: args.jobTitle,
    completedAt: args.completedAt,
    language: args.language,
  }),
}

export { DIMENSIONS as CULTURE_FIT_DIMENSIONS, TYPE_META as CULTURE_FIT_TYPE_META }

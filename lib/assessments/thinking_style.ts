/**
 * Thinking Style assessment.
 *
 * 12 forced-choice items, each option maps to one of four quadrants:
 *   AZUL    (Blue, cortical left)  - results / analytical
 *   VERDE   (Green, limbic left)   - process / organized
 *   AMARILLO(Yellow, cortical right)- innovation / intuitive
 *   ROJO    (Red, limbic right)    - people / relational
 *
 * Source content (rebranded, simplified Herrmann four-quadrant model) is
 * preserved at notes/2026-05-23-herrmann-quadrants-source.md.
 *
 * Scoring is a fixed lookup per question: each item's options a/b/c/d each
 * map to one quadrant. The dominant quadrant is the one with the most tallies.
 */

import type { AssessmentDefinition, ChoiceQuestion, RawAnswers } from './types'

export type Quadrant = 'AZUL' | 'VERDE' | 'AMARILLO' | 'ROJO'

const QUADRANT_BY_OPTION: Record<string, Record<'a' | 'b' | 'c' | 'd', Quadrant>> = {
  q1:  { a: 'AZUL',     b: 'AMARILLO', c: 'VERDE',    d: 'ROJO' },
  q2:  { a: 'VERDE',    b: 'AMARILLO', c: 'AZUL',     d: 'ROJO' },
  q3:  { a: 'ROJO',     b: 'AZUL',     c: 'VERDE',    d: 'AMARILLO' },
  q4:  { a: 'AMARILLO', b: 'ROJO',     c: 'AZUL',     d: 'VERDE' },
  q5:  { a: 'AMARILLO', b: 'VERDE',    c: 'ROJO',     d: 'AZUL' },
  q6:  { a: 'AZUL',     b: 'AMARILLO', c: 'VERDE',    d: 'ROJO' },
  q7:  { a: 'VERDE',    b: 'AZUL',     c: 'ROJO',     d: 'AMARILLO' },
  q8:  { a: 'ROJO',     b: 'AMARILLO', c: 'AZUL',     d: 'VERDE' },
  q9:  { a: 'AZUL',     b: 'VERDE',    c: 'AMARILLO', d: 'ROJO' },
  q10: { a: 'AMARILLO', b: 'ROJO',     c: 'VERDE',    d: 'AZUL' },
  q11: { a: 'ROJO',     b: 'AZUL',     c: 'AMARILLO', d: 'VERDE' },
  q12: { a: 'VERDE',    b: 'AMARILLO', c: 'AZUL',     d: 'ROJO' },
}

const QUESTIONS: ChoiceQuestion[] = [
  {
    id: 'q1', type: 'choice',
    text: {
      en: 'In your work or interactions with others, you mainly need to know:',
      es: 'En el desarrollo de tu trabajo o cuando interaccionas con otras personas, necesitas saber prioritariamente:',
    },
    options: [
      { value: 'a', label: { en: 'What the team\'s objectives are, or to set them', es: 'Cuáles son los objetivos del equipo y/o proporcionarlos' } },
      { value: 'b', label: { en: 'The "big picture" and the "why"', es: 'La visión global y el porqué' } },
      { value: 'c', label: { en: 'What the team expects from you', es: 'Lo que el equipo espera de ti' } },
      { value: 'd', label: { en: 'The people you will be working with', es: 'A la gente con la que vas a trabajar' } },
    ],
  },
  {
    id: 'q2', type: 'choice',
    text: {
      en: 'In a meeting or interview, your clarifying questions tend to be about:',
      es: 'Cuando estás en una reunión o entrevista y haces preguntas aclaratorias, suelen referirse a:',
    },
    options: [
      { value: 'a', label: { en: 'The method and the "how"', es: 'El método y los "cómos"' } },
      { value: 'b', label: { en: 'The broad vision and where things are heading; connecting current ideas with new ones', es: 'La visión amplia y el "¿adónde vamos?", conectar las ideas actuales con las nuevas' } },
      { value: 'c', label: { en: 'Objectives and results', es: 'Los objetivos y resultados' } },
      { value: 'd', label: { en: 'Checking understanding and ensuring people are engaged and feel good', es: 'El control de la comprensión y asegurarte que haya participación y que la gente se sienta bien' } },
    ],
  },
  {
    id: 'q3', type: 'choice',
    text: {
      en: 'You get anxious if:',
      es: 'Te pones nervioso/a si:',
    },
    options: [
      { value: 'a', label: { en: 'People are not cooperating, or you have to sacrifice consensus to reach a decision', es: 'Sientes que las personas no están cooperando o si tienes que sacrificar el consenso para llegar a una decisión' } },
      { value: 'b', label: { en: 'The team is drifting off track or going too slowly', es: 'Sientes que el equipo se está desviando del camino o va despacio' } },
      { value: 'c', label: { en: 'The team decides too quickly without a proper process', es: 'Piensas que el equipo está decidiendo demasiado rápido sin un proceso adecuado' } },
      { value: 'd', label: { en: 'The team is getting lost in details', es: 'Sientes que el equipo se está perdiendo en detalles' } },
    ],
  },
  {
    id: 'q4', type: 'choice',
    text: {
      en: 'If you had to describe yourself, you would say you are usually:',
      es: 'Si tuvieras que definirte, dirías que normalmente eres:',
    },
    options: [
      { value: 'a', label: { en: 'Innovative and persuasive', es: 'Innovador/a y persuasivo/a' } },
      { value: 'b', label: { en: 'Patient, a good listener, and a mediator', es: 'Paciente, buen/a escuchador/a y mediador/a' } },
      { value: 'c', label: { en: 'Assertive and decisive; always taking the lead', es: 'Afirmativo/a y resolutivo/a, siempre tomas el mando' } },
      { value: 'd', label: { en: 'Reliable and precise', es: 'Fiable y preciso/a' } },
    ],
  },
  {
    id: 'q5', type: 'choice',
    text: {
      en: 'At times you can be:',
      es: 'En algunas ocasiones puedes llegar a ser:',
    },
    options: [
      { value: 'a', label: { en: 'Inconsistent; you get bored easily and lose focus', es: 'Inconstante, te aburres fácilmente, pierdes el foco' } },
      { value: 'b', label: { en: 'Very demanding, scrupulous, or pedantic', es: 'Muy exigente, escrupuloso/a o pedante' } },
      { value: 'c', label: { en: 'Indecisive, since you always see both sides of a problem', es: 'Indeciso/a, ya que siempre ves los dos lados de un problema' } },
      { value: 'd', label: { en: 'Impatient and dominating', es: 'Impaciente y dominante' } },
    ],
  },
  {
    id: 'q6', type: 'choice',
    text: {
      en: 'You like a team that:',
      es: 'Te gusta que el equipo con el que trabajas:',
    },
    options: [
      { value: 'a', label: { en: 'Stays focused on results', es: 'Esté concentrado en los resultados' } },
      { value: 'b', label: { en: 'Brainstorms and thinks "outside the box"', es: 'Haga brainstorming y piense "fuera de la caja"' } },
      { value: 'c', label: { en: 'Has data and information; you tend to supply it', es: 'Disponga de datos e información y por eso se los suministras' } },
      { value: 'd', label: { en: 'Works in an atmosphere where people feel comfortable', es: 'Trabaje en una atmósfera en la que la gente se sienta a gusto' } },
    ],
  },
  {
    id: 'q7', type: 'choice',
    text: {
      en: 'You feel more comfortable:',
      es: 'Te sientes más cómodo/a:',
    },
    options: [
      { value: 'a', label: { en: 'With clear rules and processes', es: 'Con reglas y procesos claros' } },
      { value: 'b', label: { en: 'In control: planning and deciding how to work', es: 'Teniendo el control, planificando y decidiendo cómo trabajar' } },
      { value: 'c', label: { en: 'Offering help and support and generating participation', es: 'Ofreciendo ayuda y soporte y generando participación' } },
      { value: 'd', label: { en: 'Thinking beyond, about future possibilities', es: 'Pensando más allá, en las posibilidades futuras' } },
    ],
  },
  {
    id: 'q8', type: 'choice',
    text: {
      en: 'In meetings:',
      es: 'En las reuniones:',
    },
    options: [
      { value: 'a', label: { en: 'You like to be diplomatic and careful not to offend; you do not need to speak if you disagree', es: 'Te gusta ser diplomático/a y cuidas no ofender a nadie; no es necesario que hables si no estás de acuerdo' } },
      { value: 'b', label: { en: 'You like to communicate: take the stage, present and sell ideas', es: 'Te gusta comunicar; "subir al escenario" y presentar y vender ideas' } },
      { value: 'c', label: { en: 'You ask tough questions, use logic, are very direct and say what you think', es: 'No temes hacer preguntas difíciles; usas razonamientos lógicos; eres muy directo/a y dices lo que piensas' } },
      { value: 'd', label: { en: 'You analyze and describe how things work, contributing relevant information', es: 'Analizas y describes cómo funcionan las cosas aportando información relevante' } },
    ],
  },
  {
    id: 'q9', type: 'choice',
    text: {
      en: 'When you take a non-participative stance in meetings, it is because:',
      es: 'Cuando en las reuniones adoptas una posición no participativa se debe a que:',
    },
    options: [
      { value: 'a', label: { en: 'You respect the logical reasoning being presented', es: 'Respetas los razonamientos lógicos que se están exponiendo' } },
      { value: 'b', label: { en: 'You like how the information is structured', es: 'Te gusta la forma en que la información está estructurada' } },
      { value: 'c', label: { en: 'You like the pace of idea exploration', es: 'Te gusta el ritmo de exploración de ideas que está habiendo' } },
      { value: 'd', label: { en: 'You like to listen and make sure you are understanding what is being said', es: 'Te gusta escuchar y asegurarte que estás comprendiendo lo argumentado' } },
    ],
  },
  {
    id: 'q10', type: 'choice',
    text: {
      en: 'For you, challenges mean:',
      es: 'Para ti, los desafíos significan:',
    },
    options: [
      { value: 'a', label: { en: 'You like creating new ideas / possibilities and going "beyond" the rules', es: 'Te gusta crear nuevas ideas/posibilidades e ir "más allá" de las reglas' } },
      { value: 'b', label: { en: 'You like encouraging others, observing them, attentive to what they think/feel', es: 'Te gusta animar a los demás, observarlos y estar atento/a a lo que piensan/sienten' } },
      { value: 'c', label: { en: 'You believe it is best to have all necessary, valid information before deciding', es: 'Consideras que es mejor tener toda la información necesaria y válida antes de decidir' } },
      { value: 'd', label: { en: 'Challenges energize you; they have high standards', es: 'Te estimulan los retos; tienen estándares altos' } },
    ],
  },
  {
    id: 'q11', type: 'choice',
    text: {
      en: 'You think the role you are most effective in is:',
      es: 'Piensas que el rol en el que eres más efectivo/a es:',
    },
    options: [
      { value: 'a', label: { en: 'Mediator who reconciles different points of view', es: 'Mediador/a de conflictos; que hace que se concilien diferentes puntos de vista' } },
      { value: 'b', label: { en: 'Decision-maker who directs others toward the result', es: 'Decisor/a, el/la que dirige a los demás hacia el resultado' } },
      { value: 'c', label: { en: 'Motivator who excites others with their ideas or the team\'s', es: 'Motivador/a, que entusiasma a los demás con sus ideas o las del equipo' } },
      { value: 'd', label: { en: 'Organizer who ensures things get done carefully, taking the time needed', es: 'Organizador/a, que asegura que las cosas se hacen atentamente tomándose el tiempo necesario' } },
    ],
  },
  {
    id: 'q12', type: 'choice',
    text: {
      en: 'You especially enjoy when:',
      es: 'Disfrutas especialmente cuando:',
    },
    options: [
      { value: 'a', label: { en: 'Things are well finished', es: 'Las cosas están bien acabadas' } },
      { value: 'b', label: { en: 'You see and use intuition', es: 'Ves y utilizas la intuición' } },
      { value: 'c', label: { en: 'The objective is reached', es: 'Se alcanza el objetivo' } },
      { value: 'd', label: { en: 'The team is cohesive and there is consensus', es: 'El equipo está cohesionado y hay consenso' } },
    ],
  },
]

export type ThinkingStyleScores = {
  counts: Record<Quadrant, number>
  percentages: Record<Quadrant, number>
  dominant: Quadrant
  secondary: Quadrant | null
}

function score(raw: RawAnswers): ThinkingStyleScores {
  const counts: Record<Quadrant, number> = { AZUL: 0, VERDE: 0, AMARILLO: 0, ROJO: 0 }
  let total = 0
  for (const q of QUESTIONS) {
    const ans = raw[q.id]
    if (typeof ans !== 'string') continue
    const mapping = QUADRANT_BY_OPTION[q.id]
    if (!mapping) continue
    const quadrant = mapping[ans as 'a' | 'b' | 'c' | 'd']
    if (quadrant) {
      counts[quadrant] += 1
      total += 1
    }
  }
  const percentages: Record<Quadrant, number> = { AZUL: 0, VERDE: 0, AMARILLO: 0, ROJO: 0 }
  if (total > 0) {
    for (const q of ['AZUL', 'VERDE', 'AMARILLO', 'ROJO'] as Quadrant[]) {
      percentages[q] = Math.round((counts[q] / total) * 100)
    }
  }
  const sorted = (['AZUL', 'VERDE', 'AMARILLO', 'ROJO'] as Quadrant[]).slice().sort((a, b) => counts[b] - counts[a])
  return {
    counts,
    percentages,
    dominant: sorted[0],
    secondary: counts[sorted[1]] > 0 && counts[sorted[1]] >= counts[sorted[0]] - 2 ? sorted[1] : null,
  }
}

const QUADRANT_META: Record<Quadrant, { color: string; bg: string; nameEn: string; nameEs: string; tagEn: string; tagEs: string }> = {
  AZUL:     { color: '#0A0A0A', bg: '#E2E0DA', nameEn: 'Cortical Left',     nameEs: 'Cortical Izquierdo',     tagEn: 'Results / Analytical', tagEs: 'Resultados / Analítico' },
  VERDE:    { color: '#3F3F3F', bg: '#EAEAEA', nameEn: 'Limbic Left',       nameEs: 'Límbico Izquierdo',      tagEn: 'Process / Organized',  tagEs: 'Procesos / Organizado' },
  AMARILLO: { color: '#6B6B6B', bg: '#F0EEE8', nameEn: 'Cortical Right',    nameEs: 'Cortical Derecho',       tagEn: 'Innovation / Intuitive', tagEs: 'Innovación / Intuitivo' },
  ROJO:     { color: '#AEABA3', bg: '#F5F4F0', nameEn: 'Limbic Right',      nameEs: 'Límbico Derecho',        tagEn: 'People / Relational',  tagEs: 'Personas / Relacional' },
}

const LONG_EN: Record<Quadrant, { intro: string; strengths: string[]; watchOuts: string[] }> = {
  AZUL: {
    intro: 'A predominantly cortical-left thinker is analytical, cool-headed, and low on emotional expression. Often called an "expert", excels at logic and quantitative reasoning. Decisions are evidence-driven, not consensus-driven.',
    strengths: ['Critical analysis and diagnosis', 'Strong results orientation', 'Ability to evaluate options and decide', 'Comfortable with quantitative data and structured reasoning'],
    watchOuts: ['Can come across as dominant or cold', 'May struggle to actively support others', 'Can be overly challenging in disagreement', 'Risks discounting "soft" information'],
  },
  VERDE: {
    intro: 'A predominantly limbic-left thinker is controlled, detailed, and well-organized. Carefully analyzes the environment before acting; values method and reliability above novelty.',
    strengths: ['Reliability and discipline', 'Methodical execution; follow-through', 'Strong organization and planning', 'Attention to detail'],
    watchOuts: ['Rigidity / inflexibility under change', 'Perfectionism that slows delivery', 'Discomfort with ambiguity', 'May resist creative or unproven approaches'],
  },
  AMARILLO: {
    intro: 'A predominantly cortical-right thinker is intuitive, integrative, and imaginative. Creative, innovative, with a rich inner world. Connects ideas others see as unrelated.',
    strengths: ['Expressiveness and concept building', 'Orientation to change and novelty', 'Motivation to innovate', 'Strong "big picture" thinking'],
    watchOuts: ['Bores easily; can lose focus', 'Can be impetuous or unstructured', 'Occasionally out of touch with operational reality', 'May underweight detail and process'],
  },
  ROJO: {
    intro: 'A predominantly limbic-right thinker is emotional, expressive, and sensitive. Highly attuned to other people; values building and maintaining interpersonal bonds.',
    strengths: ['Sensitivity and strong listening', 'Orientation to people and teamwork', 'Ability to build trust and rapport', 'Reads emotional currents in a group'],
    watchOuts: ['Hypersensitivity to criticism', 'Difficulty saying no; can be over-accommodating', 'Avoidance of necessary conflict', 'May postpone hard decisions to preserve harmony'],
  },
}

const LONG_ES: Record<Quadrant, { intro: string; strengths: string[]; watchOuts: string[] }> = {
  AZUL: {
    intro: 'Una persona con dominancia cortical izquierda es analítica, racional y poco emocional. Suele ser una "experta" que destaca en lógica y razonamiento cuantitativo. Decide por evidencia, no por consenso.',
    strengths: ['Análisis crítico y diagnóstico', 'Fuerte orientación a resultados', 'Capacidad de evaluar opciones y decidir', 'Cómoda con datos cuantitativos y razonamiento estructurado'],
    watchOuts: ['Puede transmitir dominancia o frialdad', 'Puede costarle apoyar activamente a las demás personas', 'Puede resultar demasiado desafiante en el desacuerdo', 'Riesgo de minusvalorar la información "blanda"'],
  },
  VERDE: {
    intro: 'Una persona con dominancia límbica izquierda es controlada, detallista y bien organizada. Analiza el entorno con cautela antes de actuar; valora el método y la fiabilidad por encima de la novedad.',
    strengths: ['Fiabilidad y disciplina', 'Ejecución metódica; seguimiento de tareas', 'Capacidad de organización y planificación', 'Atención al detalle'],
    watchOuts: ['Rigidez o inflexibilidad ante cambios', 'Perfeccionismo que ralentiza la entrega', 'Incomodidad con la ambigüedad', 'Puede resistirse a enfoques creativos o no probados'],
  },
  AMARILLO: {
    intro: 'Una persona con dominancia cortical derecha es intuitiva, integradora e imaginativa. Creativa, innovadora, con un mundo interior rico. Conecta ideas que otras personas ven como inconexas.',
    strengths: ['Expresividad y construcción de conceptos', 'Orientación al cambio y a la novedad', 'Motivación por innovar', 'Pensamiento de "gran cuadro"'],
    watchOuts: ['Se aburre fácilmente; puede perder el foco', 'Puede ser impetuosa o poco estructurada', 'Ocasionalmente desconectada de la realidad operativa', 'Puede subestimar el detalle y el proceso'],
  },
  ROJO: {
    intro: 'Una persona con dominancia límbica derecha es emocional, expresiva y sensible. Altamente sintonizada con las personas; valora construir y mantener vínculos interpersonales.',
    strengths: ['Sensibilidad y capacidad de escucha', 'Orientación a las personas y al trabajo en equipo', 'Capacidad de generar confianza y rapport', 'Lee las corrientes emocionales del grupo'],
    watchOuts: ['Hipersensibilidad a la crítica', 'Dificultad para decir "no"; puede acomodarse en exceso', 'Evitación de conflictos necesarios', 'Puede posponer decisiones difíciles para preservar la armonía'],
  },
}

function generateHtml(args: {
  scores: ThinkingStyleScores
  candidateName: string
  jobTitle: string
  completedAt: string | null
  language: 'en' | 'es'
}): string {
  const { scores, candidateName, jobTitle, completedAt, language } = args
  const long = language === 'es' ? LONG_ES : LONG_EN
  const t = language === 'es'
    ? { title: 'Estilos de Pensamiento', subtitle: 'Perfil de dominancia cerebral, modelo simplificado de cuatro cuadrantes', candidate: 'Candidato/a', role: 'Puesto', completed: 'Completado', dominant: 'Cuadrante dominante', breakdown: 'Distribución por cuadrante', strengths: 'Fortalezas', watchOuts: 'Puntos de atención', methodNote: 'Nota metodológica: este test es una simplificación de cuatro cuadrantes inspirada en el modelo de Ned Herrmann (HBDI), basada a su vez en Sperry (hemisferios izquierdo y derecho) y MacLean (cerebro cortical y límbico). Doce ítems de elección forzada; se tabula la opción por cuadrante.' }
    : { title: 'Thinking Style', subtitle: 'Brain-dominance profile, simplified four-quadrant model', candidate: 'Candidate', role: 'Role', completed: 'Completed', dominant: 'Dominant quadrant', breakdown: 'Distribution across quadrants', strengths: 'Strengths', watchOuts: 'Watch-outs', methodNote: 'Methods note: this test is a simplified four-quadrant rendering inspired by Ned Herrmann\'s HBDI model, which in turn draws on Sperry (left / right hemispheres) and MacLean (cortical / limbic). Twelve forced-choice items; option per quadrant is tallied.' }

  const dom = scores.dominant
  const sec = scores.secondary
  const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
  const meta = QUADRANT_META[dom]
  const secMeta = sec ? QUADRANT_META[sec] : null
  const nameFor = (q: import('./thinking_style').Quadrant, lang: 'en' | 'es') => lang === 'es' ? QUADRANT_META[q].nameEs : QUADRANT_META[q].nameEn
  const tagFor  = (q: import('./thinking_style').Quadrant, lang: 'en' | 'es') => lang === 'es' ? QUADRANT_META[q].tagEs  : QUADRANT_META[q].tagEn

  // Visualization: 2x2 grid where each cell is sized by its percentage
  const cellHtml = (q: Quadrant) => {
    const m = QUADRANT_META[q]
    const pct = scores.percentages[q]
    return `<div style="position:relative; background:${m.bg}; border:1px solid ${m.color}33; border-radius:14px; padding:18px 18px; min-height:120px;">
      <div style="font-size:10px; font-weight:800; letter-spacing:0.12em; color:${m.color}; text-transform:uppercase;">${language === 'es' ? m.nameEs : m.nameEn}</div>
      <div style="font-size:10px; color:${m.color}aa; margin-top:2px;">${language === 'es' ? m.tagEs : m.tagEn}</div>
      <div style="font-size:34px; font-weight:800; color:${m.color}; letter-spacing:-0.5px; margin-top:10px;">${scores.counts[q]}</div>
      <div style="font-size:11px; color:${m.color}cc; margin-top:2px;">${pct}%</div>
      <div style="position:absolute; top:14px; right:14px; width:30px; height:30px; border-radius:50%; background:${m.color}; opacity:${0.25 + (pct/100)*0.75};"></div>
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
  .verdict { background: ${meta.bg}; border: 1px solid ${meta.color}55; border-radius: 14px; padding: 20px 22px; margin-bottom: 22px; }
  .verdict .small { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: ${meta.color}; text-transform: uppercase; margin-bottom: 6px; }
  .verdict .big { font-size: 24px; font-weight: 800; color: ${meta.color}; letter-spacing: -0.4px; }
  .verdict .sub { font-size: 13px; color: ${meta.color}cc; margin-top: 4px; }
  .verdict .intro { font-size: 14px; line-height: 1.6; color: #0A0A0A; margin-top: 14px; }
  .grid2x2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .lbl { font-size: 11px; font-weight: 700; color: #6B6B6B; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; }
  ul.plain { padding-left: 18px; margin: 0; }
  ul.plain li { font-size: 13px; color: #0A0A0A; line-height: 1.6; margin-bottom: 6px; }
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
      <div class="small">${escape(t.dominant)}</div>
      <div class="big">${escape(nameFor(dom, language))}</div>
      <div class="sub">${escape(tagFor(dom, language))} · ${scores.counts[dom]} / 12 · ${scores.percentages[dom]}%${sec && secMeta ? ` · ${language === 'es' ? 'también significativo' : 'also strong'}: ${escape(nameFor(sec, language))} (${scores.counts[sec]})` : ''}</div>
      <div class="intro">${escape(long[dom].intro)}</div>
    </div>

    <section>
      <h2>${escape(t.breakdown)}</h2>
      <div class="grid2x2">
        ${cellHtml('AZUL')}
        ${cellHtml('AMARILLO')}
        ${cellHtml('VERDE')}
        ${cellHtml('ROJO')}
      </div>
    </section>

    <section>
      <div class="two-col">
        <div>
          <div class="lbl">${escape(t.strengths)}</div>
          <ul class="plain">${long[dom].strengths.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
        </div>
        <div>
          <div class="lbl">${escape(t.watchOuts)}</div>
          <ul class="plain">${long[dom].watchOuts.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
        </div>
      </div>
    </section>

    ${sec && secMeta ? `
    <section>
      <h2>${language === 'es' ? 'Cuadrante secundario' : 'Secondary quadrant'}: ${escape(nameFor(sec, language))}</h2>
      <p style="font-size:13px; line-height:1.6; color:#0A0A0A;">${escape(long[sec].intro)}</p>
    </section>` : ''}

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

export const thinkingStyle: AssessmentDefinition = {
  code: 'thinking_style',
  name: { en: 'Thinking Style', es: 'Estilos de Pensamiento' },
  description: {
    en: 'A 12-question forced-choice profile mapping you to one of four thinking-style quadrants.',
    es: 'Un perfil de 12 preguntas de elección forzada que te ubica en uno de cuatro cuadrantes de estilo de pensamiento.',
  },
  estimatedMinutes: 5,
  intro: {
    en: 'For each question, pick the option that fits you best at work. There are no right or wrong answers.',
    es: 'Para cada pregunta, elige la opción que mejor te describa en el trabajo. No hay respuestas correctas o incorrectas.',
  },
  questions: QUESTIONS,
  score: (raw) => score(raw),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateHtml: (args) => generateHtml(args as any),
}

export { QUADRANT_META, LONG_EN as THINKING_STYLE_LONG_EN, LONG_ES as THINKING_STYLE_LONG_ES }

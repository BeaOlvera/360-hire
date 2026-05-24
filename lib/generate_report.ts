import type { FitResult } from './score_fit'

const REC_LABELS = {
  en: { strong_hire: 'Strong hire', hire: 'Hire', maybe: 'Maybe', no_hire: 'Do not hire' },
  es: { strong_hire: 'Contratacion firme', hire: 'Contratar', maybe: 'Tal vez', no_hire: 'No contratar' },
}
const REC_COLORS = {
  strong_hire: { bg: '#DCEEEA', color: '#0F3D3E' },
  hire:        { bg: '#EAF4EF', color: '#2D6A4F' },
  maybe:       { bg: '#FEF3E2', color: '#B7791F' },
  no_hire:     { bg: '#FBEAEC', color: '#9B2335' },
}

const TEXTS = {
  en: {
    title: 'Job-fit assessment',
    overall: 'Overall fit',
    recommendation: 'Recommendation',
    summary: 'Summary',
    competencies: 'Competency assessment',
    score: 'Score',
    weight: 'Weight',
    evidence: 'Evidence',
    gaps: 'Gaps',
    strengths: 'Strengths',
    concerns: 'Concerns',
    risk_flags: 'Risk flags',
    next_steps: 'Suggested next steps',
    candidate: 'Candidate',
    role: 'Role',
    interviewed: 'Interviewed',
    generated: 'Report generated',
  },
  es: {
    title: 'Evaluación de encaje con el puesto',
    overall: 'Encaje general',
    recommendation: 'Recomendación',
    summary: 'Resumen',
    competencies: 'Evaluación por competencias',
    score: 'Puntuación',
    weight: 'Peso',
    evidence: 'Evidencia',
    gaps: 'Brechas',
    strengths: 'Fortalezas',
    concerns: 'Preocupaciones',
    risk_flags: 'Banderas de riesgo',
    next_steps: 'Próximos pasos sugeridos',
    candidate: 'Candidato/a',
    role: 'Puesto',
    interviewed: 'Entrevista',
    generated: 'Informe generado',
  },
}

export function generateReportHTML(args: {
  candidateName: string
  jobTitle: string
  orgLevel: string | null
  interviewedAt: string | null
  result: FitResult
  language: 'en' | 'es'
}): string {
  const { candidateName, jobTitle, orgLevel, interviewedAt, result, language } = args
  const t = TEXTS[language]
  const recLabel = REC_LABELS[language][result.recommendation]
  const recColor = REC_COLORS[result.recommendation]
  const fitPct = Math.round(result.overall_fit * 100)
  const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<title>${escape(jobTitle)} - ${escape(candidateName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F5F4F0; color: #0A0A0A; margin: 0; padding: 32px 16px; }
  .page { max-width: 820px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E0DA; border-radius: 18px; overflow: hidden; }
  header { background: #0F3D3E; color: #FFFFFF; padding: 28px 36px; }
  header .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  header .logo .badge { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.16); display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 9px; }
  header h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.4px; margin: 0; }
  header p { font-size: 12px; color: rgba(255,255,255,0.78); margin: 6px 0 0; }
  main { padding: 28px 36px; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 24px; padding-bottom: 22px; border-bottom: 1px solid #F0EEE8; }
  .meta .label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #AEABA3; text-transform: uppercase; margin-bottom: 4px; }
  .meta .value { font-size: 13px; font-weight: 600; color: #0A0A0A; }
  .verdict { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 26px; }
  .card { background: #F5F4F0; border: 1px solid #E2E0DA; border-radius: 14px; padding: 20px 22px; }
  .card .small { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #AEABA3; text-transform: uppercase; margin-bottom: 8px; }
  .fit-num { font-size: 40px; font-weight: 800; color: #0A0A0A; letter-spacing: -1px; }
  .fit-bar { height: 6px; background: #E2E0DA; border-radius: 99px; overflow: hidden; margin-top: 10px; }
  .fit-bar > div { height: 100%; background: #0F3D3E; border-radius: 99px; }
  .rec-pill { display: inline-block; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; background: ${recColor.bg}; color: ${recColor.color}; text-transform: uppercase; }
  section { margin-bottom: 28px; }
  section h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: #AEABA3; text-transform: uppercase; margin: 0 0 12px; }
  .summary { font-size: 15px; line-height: 1.6; color: #0A0A0A; }
  .comp { border: 1px solid #E2E0DA; border-radius: 14px; padding: 18px 22px; margin-bottom: 14px; }
  .comp-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .comp-head .name { font-size: 14px; font-weight: 700; color: #0A0A0A; }
  .comp-head .meta-row { font-size: 11px; color: #6B6B6B; }
  .comp-score-bar { height: 6px; background: #F0EEE8; border-radius: 99px; overflow: hidden; margin-top: 6px; margin-bottom: 12px; }
  .comp-score-bar > div { height: 100%; background: #0F3D3E; border-radius: 99px; }
  .comp ul { margin: 6px 0 0; padding-left: 18px; }
  .comp ul li { font-size: 12.5px; color: #0A0A0A; line-height: 1.55; margin-bottom: 4px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 8px; }
  .lbl { font-size: 11px; font-weight: 700; color: #6B6B6B; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 4px; }
  ul.plain { padding-left: 18px; margin: 0; }
  ul.plain li { font-size: 13px; color: #0A0A0A; line-height: 1.6; margin-bottom: 6px; }
  footer { padding: 18px 36px 26px; color: #AEABA3; font-size: 10px; text-align: center; border-top: 1px solid #F0EEE8; }
  @media print { body { background: #FFFFFF; padding: 0; } .page { border: none; border-radius: 0; } }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="logo"><span class="badge">360</span><span style="font-size: 14px; font-weight: 700;">360 Hire</span></div>
    <h1>${escape(t.title)}</h1>
    <p>${escape(jobTitle)}</p>
  </header>
  <main>
    <div class="meta">
      <div><div class="label">${escape(t.candidate)}</div><div class="value">${escape(candidateName)}</div></div>
      <div><div class="label">${escape(t.role)}</div><div class="value">${escape(jobTitle)}</div></div>
      <div><div class="label">${escape(t.interviewed)}</div><div class="value">${date(interviewedAt)}</div></div>
      <div><div class="label">${escape(t.generated)}</div><div class="value">${date(new Date().toISOString())}</div></div>
    </div>

    <div class="verdict">
      <div class="card">
        <div class="small">${escape(t.overall)}</div>
        <div class="fit-num">${fitPct}%</div>
        <div class="fit-bar"><div style="width: ${fitPct}%;"></div></div>
      </div>
      <div class="card">
        <div class="small">${escape(t.recommendation)}</div>
        <div style="margin-top: 6px;"><span class="rec-pill">${escape(recLabel)}</span></div>
        <p style="font-size: 13px; color: #0A0A0A; line-height: 1.5; margin-top: 12px;">${escape(result.one_line_summary)}</p>
      </div>
    </div>

    <section>
      <h2>${escape(t.competencies)}</h2>
      ${result.competencies.map((c) => `
        <div class="comp">
          <div class="comp-head">
            <div class="name">${escape(c.name)}</div>
            <div class="meta-row">${escape(t.score)}: <strong style="color:#0A0A0A">${c.score.toFixed(1)}</strong> / 5 · ${escape(t.weight)}: ${Math.round(c.weight * 100)}%</div>
          </div>
          <div class="comp-score-bar"><div style="width: ${(c.score / 5) * 100}%;"></div></div>
          <div class="two-col">
            <div>
              <div class="lbl">${escape(t.evidence)}</div>
              <ul>${(c.evidence.length ? c.evidence : ['-']).map((e) => `<li>${escape(e)}</li>`).join('')}</ul>
            </div>
            <div>
              <div class="lbl">${escape(t.gaps)}</div>
              <ul>${(c.gaps.length ? c.gaps : ['-']).map((g) => `<li>${escape(g)}</li>`).join('')}</ul>
            </div>
          </div>
        </div>`).join('')}
    </section>

    <section>
      <h2>${escape(t.strengths)}</h2>
      <ul class="plain">${(result.strengths.length ? result.strengths : ['-']).map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
    </section>

    <section>
      <h2>${escape(t.concerns)}</h2>
      <ul class="plain">${(result.concerns.length ? result.concerns : ['-']).map((c) => `<li>${escape(c)}</li>`).join('')}</ul>
    </section>

    ${result.risk_flags.length ? `
    <section>
      <h2>${escape(t.risk_flags)}</h2>
      <ul class="plain">${result.risk_flags.map((r) => `<li>${escape(r)}</li>`).join('')}</ul>
    </section>` : ''}

    <section>
      <h2>${escape(t.next_steps)}</h2>
      <ul class="plain">${(result.next_steps.length ? result.next_steps : ['-']).map((n) => `<li>${escape(n)}</li>`).join('')}</ul>
    </section>
  </main>
  <footer>360 Hire</footer>
</div>
</body>
</html>`
}

function escape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

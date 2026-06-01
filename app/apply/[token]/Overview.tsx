'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = { code: string; name: string; minutes: number }

type Props = {
  token: string
  candidateFirstName: string
  jobTitle: string
  isGeneric: boolean
  language: 'en' | 'es'
  steps: Step[]              // ordered assessments enabled for this evaluation
  hasCvStep: boolean         // true if CV upload hasn't been done yet (informational, the page actually shows after CV)
}

const I18N = {
  en: {
    title: (firstName: string) => `Welcome, ${firstName}`,
    headline: (jobTitle: string, isGeneric: boolean) =>
      isGeneric
        ? `Before we start, here is what to expect in this evaluation.`
        : `Before we start your evaluation for the ${jobTitle} role, here is what to expect.`,
    flowIntro: 'This evaluation has a few short steps. You can take your time and the system saves your progress as you go.',
    assessmentsLabel: 'Complementary assessments',
    assessmentsHint: 'Short self-reports about how you think, learn, and what drives you. Honest answers are more useful than perfect ones.',
    interviewLabel: 'In-depth interview',
    interviewMinutes: '30 to 45 minutes',
    interviewHint: (jobTitle: string, isGeneric: boolean) =>
      isGeneric
        ? 'A conversational interview about your career, strengths and motivations. Conducted by an AI interviewer. You can answer by voice or by typing.'
        : `A conversational interview about your experience and fit for the ${jobTitle} role. Conducted by an AI interviewer. You can answer by voice or by typing.`,
    button: 'Start the first step',
    minute: 'min',
    totalLabel: 'Total estimated time',
    totalRange: (lo: number, hi: number) => `${lo} to ${hi} minutes`,
  },
  es: {
    title: (firstName: string) => `Bienvenido/a, ${firstName}`,
    headline: (jobTitle: string, isGeneric: boolean) =>
      isGeneric
        ? `Antes de empezar, esto es lo que vas a encontrar en la evaluación.`
        : `Antes de empezar tu evaluación para el puesto de ${jobTitle}, esto es lo que vas a encontrar.`,
    flowIntro: 'La evaluación tiene varios pasos breves. Puedes tomarte tu tiempo, el sistema guarda tu progreso a medida que avanzas.',
    assessmentsLabel: 'Cuestionarios complementarios',
    assessmentsHint: 'Autoinformes breves sobre cómo piensas, cómo aprendes y qué te motiva. Las respuestas honestas son más útiles que las "perfectas".',
    interviewLabel: 'Entrevista en profundidad',
    interviewMinutes: '30 a 45 minutos',
    interviewHint: (jobTitle: string, isGeneric: boolean) =>
      isGeneric
        ? 'Una entrevista conversacional sobre tu trayectoria, fortalezas y motivaciones. Conducida por una IA. Puedes responder por voz o escribiendo.'
        : `Una entrevista conversacional sobre tu experiencia y encaje con el puesto de ${jobTitle}. Conducida por una IA. Puedes responder por voz o escribiendo.`,
    button: 'Empezar el primer paso',
    minute: 'min',
    totalLabel: 'Tiempo total estimado',
    totalRange: (lo: number, hi: number) => `${lo} a ${hi} minutos`,
  },
} as const

const ASSESSMENT_NAMES_EN: Record<string, string> = {
  thinking_style: 'Thinking Style',
  growth_orientation: 'Growth Orientation',
  career_values: 'Career Values',
  culture_fit: 'Culture Fit',
  big_five: 'Big Five Personality',
  icar_reasoning: 'Reasoning',
  resilience: 'Resilience',
}
const ASSESSMENT_NAMES_ES: Record<string, string> = {
  thinking_style: 'Estilos de Pensamiento',
  growth_orientation: 'Orientación al Desarrollo',
  career_values: 'Valores Profesionales',
  culture_fit: 'Encaje Cultural',
  big_five: 'Personalidad Big Five',
  icar_reasoning: 'Razonamiento',
  resilience: 'Resiliencia',
}

export default function Overview({ token, candidateFirstName, jobTitle, isGeneric, language, steps }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const t = I18N[language]
  const nameMap = language === 'es' ? ASSESSMENT_NAMES_ES : ASSESSMENT_NAMES_EN
  const totalMinutes = steps.reduce((s, st) => s + st.minutes, 0)

  async function handleStart() {
    setLoading(true)
    try {
      await fetch(`/api/apply/${token}/overview-seen`, { method: 'POST' })
      window.location.reload()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 680, width: '100%', background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 18, overflow: 'hidden' }}>

        <div style={{ background: '#0A0A0A', color: '#FFFFFF', padding: '24px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 9 }}>360</div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>360 Hire</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', margin: 0 }}>{t.title(candidateFirstName)}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: '6px 0 0', lineHeight: 1.5 }}>{t.headline(jobTitle, isGeneric)}</p>
        </div>

        <div style={{ padding: '24px 30px' }}>
          <p style={{ fontSize: 13, color: '#0A0A0A', lineHeight: 1.6, marginBottom: 22 }}>{t.flowIntro}</p>

          {steps.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 12 }}>{t.assessmentsLabel}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {steps.map((s, i) => (
                  <div key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: '#F5F4F0', border: '1px solid #E2E0DA', borderRadius: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 14, background: '#0A0A0A', color: '#FFFFFF', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{nameMap[s.code] ?? s.code}</p>
                    </div>
                    <span style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 600 }}>~{s.minutes} {t.minute}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#6B6B6B', marginTop: 10, lineHeight: 1.5 }}>{t.assessmentsHint}</p>
            </div>
          )}

          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 12 }}>{t.interviewLabel}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: '#0A0A0A', color: '#FFFFFF', borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: '#FFFFFF', color: '#0A0A0A', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{steps.length + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{t.interviewLabel}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{t.interviewMinutes}</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#6B6B6B', marginTop: 10, lineHeight: 1.5 }}>{t.interviewHint(jobTitle, isGeneric)}</p>
          </div>

          <div style={{ background: '#F5F4F0', border: '1px solid #E2E0DA', borderRadius: 10, padding: '12px 16px', marginBottom: 18, textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 4 }}>{t.totalLabel}</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A' }}>{t.totalRange(totalMinutes + 30, totalMinutes + 45)}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleStart} disabled={loading}
              style={{ background: loading ? '#AEABA3' : '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? '...' : t.button}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

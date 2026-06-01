'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TEXTS = {
  en: {
    title: 'Before we begin',
    intro: (jobTitle: string) =>
      `You've been invited to complete an AI-led interview for the ${jobTitle} role. Before we start, please read how your data will be handled.`,
    points: [
      '<strong>Purpose:</strong> This interview is part of a hiring assessment. Your responses are used solely to evaluate your fit for this role.',
      '<strong>AI processing:</strong> The interview is conducted by an AI interviewer (Anthropic\'s Claude). Live speech is transcribed by OpenAI Whisper. Your responses and the recorded session are reviewed by the hiring team.',
      '<strong>Recording:</strong> The session may be video and audio recorded so the hiring team can review it. Only the hiring team for this role can see it.',
      '<strong>Data retention:</strong> Your interview data is retained for a maximum of 12 months after the hiring decision, then permanently deleted.',
      '<strong>Your rights:</strong> Under GDPR (where applicable), you have the right to access, rectify, or request deletion of your data. Contact <a href="mailto:bolvera.arias8@gmail.com" style="color:#0A0A0A">bolvera.arias8@gmail.com</a>.',
      '<strong>Authenticity:</strong> Your answers must be genuine and your own. Do NOT use ChatGPT or any external assistant to write your responses, and do not consult notes or other people during the interview. The interviewer detects patterns of fabricated or copy-pasted content, and the use of external help may invalidate your candidacy. We want to know who YOU are, not who an AI can pretend you are.',
    ],
    accept: 'I have read and understood the above. I confirm my answers will be my own and I consent to participate.',
    button: 'Continue',
  },
  es: {
    title: 'Antes de empezar',
    intro: (jobTitle: string) =>
      `Has sido invitado/a a realizar una entrevista conducida por IA para el puesto de ${jobTitle}. Antes de comenzar, por favor revisa cómo se tratarán tus datos.`,
    points: [
      '<strong>Finalidad:</strong> Esta entrevista forma parte de una evaluación de selección. Tus respuestas se usarán únicamente para evaluar tu encaje en este puesto.',
      '<strong>Procesamiento con IA:</strong> La entrevista la realiza una IA (Claude de Anthropic). La voz se transcribe con OpenAI Whisper. El equipo de selección revisará tus respuestas y la sesión grabada.',
      '<strong>Grabación:</strong> La sesión puede grabarse en vídeo y audio para que el equipo pueda revisarla. Solo el equipo de selección de este puesto tendrá acceso.',
      '<strong>Conservación:</strong> Tus datos se conservan un máximo de 12 meses tras la decisión de contratación, y luego se eliminan permanentemente.',
      '<strong>Tus derechos:</strong> Bajo el RGPD (donde aplique), tienes derecho a acceder, rectificar o eliminar tus datos. Contacto: <a href="mailto:bolvera.arias8@gmail.com" style="color:#0A0A0A">bolvera.arias8@gmail.com</a>.',
      '<strong>Autenticidad:</strong> Tus respuestas deben ser genuinas y tuyas. NO uses ChatGPT ni ningún asistente externo para redactar tus respuestas, y no consultes notas ni a otras personas durante la entrevista. La entrevistadora detecta patrones de respuestas fabricadas o copiadas, y el uso de ayuda externa puede invalidar tu candidatura. Queremos saber quién eres TÚ, no quién puede fingir ser una IA.',
    ],
    accept: 'He leído y comprendido lo anterior. Confirmo que mis respuestas serán mías y acepto participar.',
    button: 'Continuar',
  },
} as const

export default function PrivacyGate({
  token, candidateFirstName, jobTitle, language,
}: { token: string; candidateFirstName: string; jobTitle: string; language: 'en' | 'es' }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const t = TEXTS[language]

  async function handleAccept() {
    if (!checked) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/apply/${token}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? (language === 'es' ? 'Hubo un problema, inténtalo de nuevo.' : 'Something went wrong, please try again.'))
        return
      }
      // Full reload to ensure the server component re-fetches consent state.
      window.location.reload()
    } catch {
      setError(language === 'es' ? 'Error de conexión. Inténtalo de nuevo.' : 'Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 640, width: '100%', background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E0DA', overflow: 'hidden' }}>
        <div style={{ background: '#0F3D3E', padding: '22px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 9 }}>360</span>
            </div>
            <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 15 }}>{t.title}</span>
          </div>
        </div>
        <div style={{ padding: '24px 28px' }}>
          <p style={{ fontSize: 13, color: '#0A0A0A', lineHeight: 1.6, marginBottom: 18 }}>{t.intro(jobTitle)}</p>
          <ul style={{ paddingLeft: 18, margin: 0, marginBottom: 22 }}>
            {t.points.map((p, i) => (
              <li key={i} style={{ fontSize: 12, color: '#6B6B6B', lineHeight: 1.65, marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </ul>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18, cursor: 'pointer' }}>
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: 3 }} />
            <span style={{ fontSize: 12, color: '#0A0A0A' }}>{t.accept}</span>
          </label>
          {error && (
            <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleAccept} disabled={!checked || loading}
              style={{
                background: !checked || loading ? '#AEABA3' : '#0F3D3E', color: '#FFFFFF', border: 'none',
                borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600,
                cursor: !checked || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
              {loading ? '...' : t.button}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

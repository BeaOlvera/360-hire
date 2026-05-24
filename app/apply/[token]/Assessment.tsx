'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Question, RawAnswers } from '@/lib/assessments'

const I18N = {
  en: {
    of: 'of',
    answered: 'answered',
    submit: 'Save and continue',
    submitting: 'Saving...',
    incomplete: 'Please answer all questions before continuing.',
    failed: 'Could not save your answers. Please try again.',
    likert: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
    estimate: (m: number) => `About ${m} minutes`,
  },
  es: {
    of: 'de',
    answered: 'respondidas',
    submit: 'Guardar y continuar',
    submitting: 'Guardando…',
    incomplete: 'Por favor, responde a todas las preguntas antes de continuar.',
    failed: 'No se pudieron guardar tus respuestas. Inténtalo de nuevo.',
    likert: ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'],
    estimate: (m: number) => `Aproximadamente ${m} minutos`,
  },
} as const

type Props = {
  token: string
  code: string
  name: string
  description: string
  intro: string
  estimatedMinutes: number
  questions: Question[]
  language: 'en' | 'es'
}

export default function Assessment({ token, code, name, description, intro, estimatedMinutes, questions, language }: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState<RawAnswers>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const t = I18N[language]

  // Restore in-progress answers if the candidate closed the tab
  const storageKey = `assess-${token}-${code}`
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setAnswers(JSON.parse(raw))
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(answers)) } catch { /* ignore */ }
  }, [answers, storageKey])

  const answeredCount = useMemo(() => Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== '').length, [answers])
  const total = questions.length
  const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0

  function setAnswer(qid: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [qid]: value }))
  }

  async function handleSubmit() {
    setError('')
    if (answeredCount < total) {
      setError(t.incomplete)
      // scroll to the first unanswered
      const firstUnanswered = questions.find((q) => answers[q.id] === undefined || answers[q.id] === '')
      if (firstUnanswered) {
        const el = document.getElementById(`q-${firstUnanswered.id}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/apply/${token}/assessment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, raw_answers: answers }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? t.failed); setSubmitting(false); return
      }
      try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
      // Full reload so the server component re-fetches and routes to the next gate.
      window.location.reload()
    } catch {
      setError(t.failed); setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', padding: '24px 16px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 18, overflow: 'hidden' }}>

        <div style={{ background: '#0F3D3E', color: '#FFFFFF', padding: '22px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.16)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 9 }}>360</div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>360 Hire</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', margin: 0 }}>{name}</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', margin: '6px 0 0' }}>{t.estimate(estimatedMinutes)} · {description}</p>
        </div>

        <div style={{ padding: '24px 28px', borderBottom: '1px solid #F0EEE8', background: '#FAF9F5' }}>
          <p style={{ fontSize: 13, color: '#0A0A0A', lineHeight: 1.6, margin: 0 }}>{intro}</p>
        </div>

        {/* progress */}
        <div style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #F0EEE8' }}>
          <div style={{ flex: 1, height: 6, background: '#E2E0DA', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#0F3D3E', borderRadius: 99, transition: 'width 0.2s' }} />
          </div>
          <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 600 }}>{answeredCount} {t.of} {total}</span>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {questions.map((q, i) => (
            <QuestionRow key={q.id} q={q} index={i} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} language={language} likertLabels={t.likert} />
          ))}

          {error && (
            <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={handleSubmit} disabled={submitting}
              style={{
                background: submitting ? '#AEABA3' : '#0F3D3E', color: '#FFFFFF', border: 'none',
                borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuestionRow({
  q, index, value, onChange, language, likertLabels,
}: {
  q: Question
  index: number
  value: string | number | undefined
  onChange: (v: string | number) => void
  language: 'en' | 'es'
  likertLabels: readonly string[]
}) {
  return (
    <div id={`q-${q.id}`} style={{ marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid #F0EEE8' }}>
      <p style={{ fontSize: 14, color: '#0A0A0A', lineHeight: 1.55, marginBottom: 12 }}>
        <span style={{ color: '#AEABA3', fontWeight: 700, marginRight: 6 }}>{index + 1}.</span>
        {q.text[language]}
      </p>
      {q.type === 'likert5' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = value === n
            return (
              <button key={n} type="button" onClick={() => onChange(n)}
                style={{
                  background: selected ? '#0F3D3E' : '#FFFFFF',
                  color: selected ? '#FFFFFF' : '#0A0A0A',
                  border: `1px solid ${selected ? '#0F3D3E' : '#E2E0DA'}`,
                  borderRadius: 10, padding: '10px 6px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>{n}</span>
                <span style={{ fontSize: 9, lineHeight: 1.2, opacity: 0.85 }}>{likertLabels[n - 1]}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((o) => {
            const selected = value === o.value
            return (
              <button key={o.value} type="button" onClick={() => onChange(o.value)}
                style={{
                  background: selected ? '#0F3D3E' : '#FFFFFF',
                  color: selected ? '#FFFFFF' : '#0A0A0A',
                  border: `1px solid ${selected ? '#0F3D3E' : '#E2E0DA'}`,
                  borderRadius: 10, padding: '11px 14px', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.5,
                }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: selected ? 'rgba(255,255,255,0.2)' : '#F5F4F0',
                  color: selected ? '#FFFFFF' : '#6B6B6B',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 11, flexShrink: 0, marginTop: 1,
                }}>{o.value.toUpperCase()}</span>
                <span>{o.label[language]}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CULTURE_FIT_DIMENSIONS, CULTURE_FIT_TYPE_META, type CultureType } from '@/lib/assessments/culture_fit'

const TYPES: CultureType[] = ['CLAN', 'ADHOCRACY', 'MARKET', 'HIERARCHY']

const I18N = {
  en: {
    title: 'Culture Fit',
    intro: 'For each of the six items below, distribute 100 points across the four statements based on how much each describes the kind of organization you most want to work in. The total must be 100 per item.',
    pointsRemaining: 'remaining',
    total: 'Total',
    needs100: 'Each block must total exactly 100 points.',
    submit: 'Save and continue',
    submitting: 'Saving...',
    failed: 'Could not save your answers. Please try again.',
    estimate: (m: number) => `About ${m} minutes`,
  },
  es: {
    title: 'Encaje Cultural',
    intro: 'Para cada uno de los seis bloques, reparte 100 puntos entre las cuatro afirmaciones según cuánto describe cada una el tipo de organización en la que más quieres trabajar. El total debe ser 100 por bloque.',
    pointsRemaining: 'restantes',
    total: 'Total',
    needs100: 'Cada bloque debe sumar exactamente 100 puntos.',
    submit: 'Guardar y continuar',
    submitting: 'Guardando...',
    failed: 'No se pudieron guardar tus respuestas. Inténtalo de nuevo.',
    estimate: (m: number) => `Aproximadamente ${m} minutos`,
  },
} as const

type Props = { token: string; language: 'en' | 'es'; estimatedMinutes: number }

type Allocations = Record<string, Record<CultureType, number>>

function freshAllocations(): Allocations {
  const out: Allocations = {}
  for (const d of CULTURE_FIT_DIMENSIONS) {
    out[d.id] = { CLAN: 0, ADHOCRACY: 0, MARKET: 0, HIERARCHY: 0 }
  }
  return out
}

export default function CultureFitAssessment({ token, language, estimatedMinutes }: Props) {
  const router = useRouter()
  const [allocs, setAllocs] = useState<Allocations>(freshAllocations())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const t = I18N[language]

  const storageKey = `assess-${token}-culture_fit`
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved && typeof saved === 'object') setAllocs({ ...freshAllocations(), ...saved })
      }
    } catch { /* ignore */ }
  }, [storageKey])

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(allocs)) } catch { /* ignore */ }
  }, [allocs, storageKey])

  function setPoints(dimId: string, t: CultureType, value: number) {
    setAllocs((prev) => ({ ...prev, [dimId]: { ...prev[dimId], [t]: Math.max(0, Math.min(100, value)) } }))
  }

  const dimSums = useMemo(() => {
    const out: Record<string, number> = {}
    for (const d of CULTURE_FIT_DIMENSIONS) {
      out[d.id] = TYPES.reduce((s, k) => s + (allocs[d.id]?.[k] ?? 0), 0)
    }
    return out
  }, [allocs])

  const allGood = CULTURE_FIT_DIMENSIONS.every((d) => dimSums[d.id] === 100)

  async function handleSubmit() {
    setError('')
    if (!allGood) { setError(t.needs100); return }
    setSubmitting(true)
    try {
      // Flatten to q{id}_{TYPE} key shape that the score function expects
      const raw_answers: Record<string, number> = {}
      for (const d of CULTURE_FIT_DIMENSIONS) {
        for (const k of TYPES) raw_answers[`${d.id}_${k}`] = allocs[d.id]?.[k] ?? 0
      }
      const res = await fetch(`/api/apply/${token}/assessment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'culture_fit', raw_answers }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? t.failed); setSubmitting(false); return
      }
      try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
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
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', margin: 0 }}>{t.title}</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', margin: '6px 0 0' }}>{t.estimate(estimatedMinutes)}</p>
        </div>

        <div style={{ padding: '24px 28px', borderBottom: '1px solid #F0EEE8', background: '#FAF9F5' }}>
          <p style={{ fontSize: 13, color: '#0A0A0A', lineHeight: 1.6, margin: 0 }}>{t.intro}</p>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {CULTURE_FIT_DIMENSIONS.map((d, idx) => {
            const remaining = 100 - dimSums[d.id]
            const isBad = dimSums[d.id] !== 100
            return (
              <div key={d.id} style={{ marginBottom: 26, paddingBottom: 22, borderBottom: idx < CULTURE_FIT_DIMENSIONS.length - 1 ? '1px solid #F0EEE8' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', margin: 0 }}>{d.title[language]}</h3>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isBad ? '#9B2335' : '#2D6A4F' }}>
                    {t.total}: {dimSums[d.id]} / 100 {remaining !== 0 && ` · ${remaining > 0 ? `+${remaining}` : remaining} ${t.pointsRemaining}`}
                  </span>
                </div>
                {TYPES.map((k) => {
                  const meta = CULTURE_FIT_TYPE_META[k]
                  const v = allocs[d.id]?.[k] ?? 0
                  return (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 70px', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                      <p style={{ fontSize: 12.5, color: '#0A0A0A', lineHeight: 1.5, margin: 0 }}>
                        <span style={{ display: 'inline-block', background: meta.bg, color: meta.color, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, marginRight: 8, letterSpacing: '0.08em' }}>{language === 'es' ? meta.nameEs : meta.nameEn}</span>
                        {d.statements[k][language]}
                      </p>
                      <input type="range" min={0} max={100} value={v} onChange={(e) => setPoints(d.id, k, Number(e.target.value))}
                        style={{ accentColor: meta.color }} />
                      <input type="number" min={0} max={100} value={v} onChange={(e) => setPoints(d.id, k, Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #E2E0DA', borderRadius: 8, fontSize: 13, textAlign: 'right' as const, color: meta.color, fontWeight: 700, fontFamily: 'inherit' }} />
                    </div>
                  )
                })}
              </div>
            )
          })}

          {error && (
            <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSubmit} disabled={submitting || !allGood}
              style={{ background: submitting || !allGood ? '#AEABA3' : '#0F3D3E', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: submitting || !allGood ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

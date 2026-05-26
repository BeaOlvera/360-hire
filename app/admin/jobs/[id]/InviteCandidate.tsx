'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type JobCompetency = { name: string; weight?: 1 | 2 | 3 }

type Props = {
  jobId: string
  jobLanguage: string
  jobAssessments: string[]
  jobCompetencies: JobCompetency[]
}

const ALL_ASSESSMENTS: Array<{ code: string; label: string }> = [
  { code: 'thinking_style',     label: 'Thinking Style' },
  { code: 'growth_orientation', label: 'Growth Orientation' },
  { code: 'career_values',      label: 'Career Values' },
  { code: 'culture_fit',        label: 'Culture Fit (OCAI)' },
  { code: 'big_five',           label: 'Big Five Personality' },
  { code: 'icar_reasoning',     label: 'Reasoning (ICAR-style)' },
  { code: 'resilience',         label: 'Resilience' },
]

export default function InviteCandidate({ jobId, jobLanguage, jobAssessments, jobCompetencies }: Props) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [surname1, setSurname1] = useState('')
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState<'en' | 'es'>(jobLanguage === 'es' ? 'es' : 'en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Customisation: start ticked from the job's defaults; admin can add or remove anything
  const [customise, setCustomise] = useState(false)
  const [chosenAssessments, setChosenAssessments] = useState<string[]>(
    jobAssessments.length > 0 ? jobAssessments : ALL_ASSESSMENTS.map((a) => a.code)
  )
  const [chosenCompetencies, setChosenCompetencies] = useState<string[]>(jobCompetencies.map((c) => c.name))

  function toggleAssessment(code: string) {
    setChosenAssessments((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code])
  }
  function toggleCompetency(name: string) {
    setChosenCompetencies((prev) => prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!firstName.trim()) { setError('First name is required.'); return }
    if (!email.trim()) { setError('Email is required.'); return }
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        first_name: firstName.trim(),
        surname1: surname1.trim() || null,
        email: email.trim(),
        preferred_language: language,
      }
      if (customise) {
        // Always send the explicit selection — admin may have broadened the set beyond job defaults
        body.assessments_override = chosenAssessments
        const chosenCompObjs = jobCompetencies.filter((c) => chosenCompetencies.includes(c.name))
        if (chosenCompObjs.length !== jobCompetencies.length) {
          body.competencies_override = chosenCompObjs
        }
      }
      const res = await fetch(`/api/admin/jobs/${jobId}/applications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to invite candidate'); return }
      setSuccess('Candidate invited. Email sent.')
      setFirstName(''); setSurname1(''); setEmail('')
      router.refresh()
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasCompetencies = jobCompetencies.length > 0
  // Always offer the full questionnaire set — admin can pick any per candidate
  const hasAssessments = true

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '24px 28px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 14 }}>
        Invite a candidate
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 110px', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>First name *</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Maria" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Surname</label>
            <input value={surname1} onChange={(e) => setSurname1(e.target.value)} placeholder="Garcia" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="maria@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'es')} style={{ ...inputStyle, appearance: 'none' as const }}>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </div>
        </div>

        {(hasAssessments || hasCompetencies) && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={customise} onChange={(e) => setCustomise(e.target.checked)} />
              <span style={{ fontSize: 12, color: '#3F3F3F' }}>
                Customise for this candidate (otherwise the job&apos;s full configuration is used)
              </span>
            </label>

            {customise && (
              <div style={{ background: '#F5F4F0', border: '1px solid #E2E0DA', borderRadius: 12, padding: '14px 16px', marginBottom: 14, display: 'grid', gridTemplateColumns: hasAssessments && hasCompetencies ? '1fr 1fr' : '1fr', gap: 14 }}>
                {hasAssessments && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 8 }}>Questionnaires for this candidate</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {ALL_ASSESSMENTS.map((a) => {
                        const fromJob = jobAssessments.includes(a.code)
                        return (
                          <label key={a.code} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={chosenAssessments.includes(a.code)} onChange={() => toggleAssessment(a.code)} />
                            <span style={{ fontSize: 12, color: '#0A0A0A' }}>{a.label}</span>
                            {fromJob && <span style={{ fontSize: 9, fontWeight: 700, color: '#6B6B6B', background: '#EAEAEA', padding: '1px 6px', borderRadius: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>job default</span>}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
                {hasCompetencies && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 8 }}>Competencies to explore</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {jobCompetencies.map((c) => {
                        const w = c.weight ?? 2
                        const tag = w === 3 ? 'Critical' : w === 1 ? 'Relevant' : 'Important'
                        return (
                          <label key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={chosenCompetencies.includes(c.name)} onChange={() => toggleCompetency(c.name)} />
                            <span style={{ fontSize: 12, color: '#0A0A0A' }}>{c.name}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8, background: w === 3 ? '#E2E0DA' : w === 1 ? '#F5F4F0' : '#EAEAEA', color: w === 3 ? '#0A0A0A' : w === 1 ? '#AEABA3' : '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tag}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && (
          <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ background: '#EAEAEA', border: '1px solid #D5D3CE', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#3F3F3F', fontWeight: 600 }}>{success}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading} style={{
            background: loading ? '#AEABA3' : '#0A0A0A', color: '#FFFFFF', border: 'none',
            borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
            {loading ? 'Inviting...' : 'Invite candidate'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #E2E0DA',
  borderRadius: 10, fontSize: 13, color: '#0A0A0A', background: '#FFFFFF',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
}
const labelStyle: React.CSSProperties = {
  display: 'block' as const, fontSize: 11, fontWeight: 600 as const,
  color: '#6B6B6B', marginBottom: 4,
}

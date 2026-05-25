'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type JobCompetency = { name: string; weight?: 1 | 2 | 3 }
type OpenJob = { id: string; title: string; assessments: string[]; competencies: JobCompetency[] }

type Props = { candidateId: string; openJobs: OpenJob[] }

const ASSESSMENT_LABELS: Record<string, string> = {
  thinking_style:     'Thinking Style',
  growth_orientation: 'Growth Orientation',
  career_values:      'Career Values',
  culture_fit:        'Culture Fit (OCAI)',
  big_five:           'Big Five Personality',
  icar_reasoning:     'Reasoning (ICAR-style)',
  resilience:         'Resilience',
}

const GENERIC_ASSESSMENTS = ['thinking_style', 'growth_orientation', 'career_values', 'big_five', 'resilience']

export default function CandidateActions({ candidateId, openJobs }: Props) {
  const router = useRouter()
  const [jobId, setJobId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  // Customisation
  const [customise, setCustomise] = useState(false)
  const [chosenAssessments, setChosenAssessments] = useState<string[]>([])
  const [chosenCompetencies, setChosenCompetencies] = useState<string[]>([])

  // Available assessments/competencies depend on whether a specific job is picked
  const selectedJob = useMemo(() => openJobs.find((j) => j.id === jobId) ?? null, [openJobs, jobId])
  const availableAssessments: string[] = selectedJob ? selectedJob.assessments : GENERIC_ASSESSMENTS
  const availableCompetencies: JobCompetency[] = selectedJob ? selectedJob.competencies : []

  function handleJobChange(newId: string) {
    setJobId(newId)
    const job = openJobs.find((j) => j.id === newId) ?? null
    setChosenAssessments(job ? job.assessments : GENERIC_ASSESSMENTS)
    setChosenCompetencies(job ? job.competencies.map((c) => c.name) : [])
    setCustomise(false)
  }
  function toggleAssessment(code: string) {
    setChosenAssessments((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code])
  }
  function toggleCompetency(name: string) {
    setChosenCompetencies((prev) => prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name])
  }

  function buildOverrides(mode: 'job' | 'generic') {
    if (!customise) return {}
    const out: Record<string, unknown> = {}
    const defaults = mode === 'job' ? (selectedJob?.assessments ?? []) : GENERIC_ASSESSMENTS
    if (!sameSet(chosenAssessments, defaults)) out.assessments_override = chosenAssessments
    if (mode === 'job') {
      const chosenObjs = (selectedJob?.competencies ?? []).filter((c) => chosenCompetencies.includes(c.name))
      if (chosenObjs.length !== (selectedJob?.competencies.length ?? 0)) out.competencies_override = chosenObjs
    }
    return out
  }

  async function start(mode: 'job' | 'generic') {
    setLoading(true); setError(''); setInfo('')
    try {
      const payload: Record<string, unknown> = {
        job_id: mode === 'job' ? jobId : null,
        ...buildOverrides(mode),
      }
      const res = await fetch(`/api/admin/candidates/${candidateId}/evaluate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setInfo(mode === 'job' ? 'Job-fit evaluation started. Invite email sent.' : 'Generic evaluation started. Invite email sent.')
      router.refresh()
      setTimeout(() => router.push(`/admin/applications/${data.application_id}`), 600)
    } catch {
      setError('Connection error.')
    } finally {
      setLoading(false)
    }
  }

  const hasAssessments = availableAssessments.length > 0
  const hasCompetencies = availableCompetencies.length > 0

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '22px 24px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 14 }}>Start an evaluation</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 12 }}>
        <select value={jobId} onChange={(e) => handleJobChange(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 13, color: '#0A0A0A', background: '#FFFFFF', outline: 'none', fontFamily: 'inherit', appearance: 'none' as const }}>
          <option value="">Select a job…</option>
          {openJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <button type="button" onClick={() => jobId && start('job')} disabled={!jobId || loading}
          style={{ background: !jobId || loading ? '#AEABA3' : '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 600, cursor: !jobId || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Starting…' : 'Assign to job'}
        </button>
      </div>

      {(hasAssessments || hasCompetencies) && (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={customise} onChange={(e) => setCustomise(e.target.checked)} />
            <span style={{ fontSize: 12, color: '#3F3F3F' }}>
              Customise for this candidate (otherwise {selectedJob ? "the job's full configuration is used" : 'the generic set is used'})
            </span>
          </label>

          {customise && (
            <div style={{ background: '#F5F4F0', border: '1px solid #E2E0DA', borderRadius: 12, padding: '14px 16px', marginBottom: 14, display: 'grid', gridTemplateColumns: hasAssessments && hasCompetencies ? '1fr 1fr' : '1fr', gap: 14 }}>
              {hasAssessments && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 8 }}>Questionnaires</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {availableAssessments.map((code) => (
                      <label key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={chosenAssessments.includes(code)} onChange={() => toggleAssessment(code)} />
                        <span style={{ fontSize: 12, color: '#0A0A0A' }}>{ASSESSMENT_LABELS[code] ?? code}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {hasCompetencies && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 8 }}>Competencies to explore</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {availableCompetencies.map((c) => {
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

      <div style={{ borderTop: '1px solid #F0EEE8', paddingTop: 14, marginTop: 6 }}>
        <p style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 10 }}>
          Don&apos;t have a job in mind yet? Start a <strong>generic evaluation</strong> — we&apos;ll assess them for fit across projects and opportunities. You can convert it to a specific job fit later.
        </p>
        <button type="button" onClick={() => start('generic')} disabled={loading}
          style={{ background: '#FFFFFF', color: '#0A0A0A', border: '1px solid #0A0A0A', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          Start generic evaluation
        </button>
      </div>

      {info && (
        <div style={{ background: '#EAEAEA', border: '1px solid #D5D3CE', borderRadius: 10, padding: '8px 12px', marginTop: 12 }}>
          <p style={{ fontSize: 12, color: '#3F3F3F', fontWeight: 600 }}>{info}</p>
        </div>
      )}
      {error && (
        <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '8px 12px', marginTop: 12 }}>
          <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
        </div>
      )}
    </div>
  )
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  for (const x of b) if (!setA.has(x)) return false
  return true
}

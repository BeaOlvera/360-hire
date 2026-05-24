'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const REC_LABELS: Record<string, string> = {
  strong_hire: 'Strong hire',
  hire:        'Hire',
  maybe:       'Maybe',
  no_hire:     'Do not hire',
}
const REC_COLORS: Record<string, { bg: string; color: string }> = {
  strong_hire: { bg: '#E2E0DA', color: '#0A0A0A' },
  hire:        { bg: '#EAEAEA', color: '#3F3F3F' },
  maybe:       { bg: '#F0EEE8', color: '#6B6B6B' },
  no_hire:     { bg: '#F5F4F0', color: '#AEABA3' },
}
const STATUS_OPTIONS = [
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'hired',    label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
]

type Props = {
  applicationId: string
  initialFitScore: number | null
  initialRecommendation: string | null
  initialStatus: string
  initialReviewNotes: string | null
  hasReport: boolean
  hasTranscript: boolean
  isGeneric: boolean
  openJobs: Array<{ id: string; title: string }>
}

export default function ScoringPanel({
  applicationId, initialFitScore, initialRecommendation, initialStatus, initialReviewNotes, hasReport, hasTranscript, isGeneric, openJobs,
}: Props) {
  const router = useRouter()
  const [scoring, setScoring] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedJob, setSelectedJob] = useState<string>('')

  const [fitScore, setFitScore] = useState<number | null>(initialFitScore)
  const [recommendation, setRecommendation] = useState<string | null>(initialRecommendation)
  const [status, setStatus] = useState<string>(initialStatus)
  const [notes, setNotes] = useState<string>(initialReviewNotes ?? '')
  const [report, setReport] = useState<boolean>(hasReport)
  const [savingDecision, setSavingDecision] = useState(false)

  async function handleScore(jobIdOverride?: string) {
    setScoring(true); setError(''); setSuccess('')
    try {
      const body: Record<string, unknown> = {}
      if (jobIdOverride) body.job_id = jobIdOverride
      const res = await fetch(`/api/admin/applications/${applicationId}/score`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to score'); return }
      setFitScore(data.result.overall_fit)
      setRecommendation(data.result.recommendation)
      setReport(true)
      setSuccess(jobIdOverride ? 'Converted to job fit. Fit score generated.' : 'Fit score generated.')
      router.refresh()
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setScoring(false)
    }
  }

  async function saveDecision() {
    setSavingDecision(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/recommendation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation, status, review_notes: notes }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Save failed')
        return
      }
      setSuccess('Decision saved.')
      router.refresh()
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setSavingDecision(false)
    }
  }

  const fitPct = fitScore == null ? null : Math.round(fitScore * 100)
  const recColor = recommendation ? (REC_COLORS[recommendation] ?? REC_COLORS.maybe) : null

  // Generic eval + no score yet: show the "Convert to job fit" picker instead of plain "Generate fit score"
  const needsJobChoice = isGeneric && fitScore == null

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 12 }}>
        Fit &amp; recommendation
      </p>

      {needsJobChoice ? (
        <>
          <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.5, marginBottom: 14 }}>
            This is a <strong>generic evaluation</strong> with no target role yet. Pick a job to score against; the transcript and CV will be evaluated for fit with that JD.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
            <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: '#FFFFFF', outline: 'none', appearance: 'none' as const }}>
              <option value="">Select a job…</option>
              {openJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <button onClick={() => selectedJob && handleScore(selectedJob)} disabled={!selectedJob || scoring || !hasTranscript}
              style={{
                background: !selectedJob || scoring || !hasTranscript ? '#AEABA3' : '#0A0A0A', color: '#FFFFFF', border: 'none',
                borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600,
                cursor: !selectedJob || scoring || !hasTranscript ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
              {scoring ? 'Scoring…' : 'Convert to job fit'}
            </button>
          </div>
          {!hasTranscript && (
            <p style={{ fontSize: 11, color: '#AEABA3', marginTop: 8 }}>The candidate has not completed the interview yet.</p>
          )}
        </>
      ) : fitScore == null ? (
        <>
          <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.5, marginBottom: 14 }}>
            Generate an AI-assisted fit assessment using the transcript, CV, and job description.
            You can override the recommendation afterwards.
          </p>
          <button onClick={() => handleScore()} disabled={scoring || !hasTranscript}
            style={{
              background: scoring || !hasTranscript ? '#AEABA3' : '#0A0A0A', color: '#FFFFFF', border: 'none',
              borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600,
              cursor: scoring || !hasTranscript ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
            {scoring ? 'Scoring...' : 'Generate fit score'}
          </button>
          {!hasTranscript && (
            <p style={{ fontSize: 11, color: '#AEABA3', marginTop: 8 }}>The candidate has not completed the interview yet.</p>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 4 }}>Fit</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.5px' }}>{fitPct}%</p>
              <div style={{ height: 6, background: '#E2E0DA', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
                <div style={{ height: '100%', width: `${fitPct}%`, background: '#0A0A0A', borderRadius: 99 }} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 4 }}>Recommendation</p>
              <select value={recommendation ?? ''} onChange={(e) => setRecommendation(e.target.value || null)}
                style={{
                  width: '100%', padding: '7px 10px', border: '1px solid #E2E0DA', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: recColor?.bg ?? '#FFFFFF',
                  color: recColor?.color ?? '#0A0A0A', appearance: 'none' as const, outline: 'none',
                }}>
                {Object.entries(REC_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B6B6B', marginBottom: 4, letterSpacing: '0.05em' }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', background: '#FFFFFF', outline: 'none', appearance: 'none' as const }}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B6B6B', marginBottom: 4, letterSpacing: '0.05em' }}>Review notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Optional internal notes"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5, outline: 'none', boxSizing: 'border-box' as const }} />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={saveDecision} disabled={savingDecision}
              style={{
                background: savingDecision ? '#AEABA3' : '#0A0A0A', color: '#FFFFFF', border: 'none',
                borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600,
                cursor: savingDecision ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
              {savingDecision ? 'Saving...' : 'Save decision'}
            </button>
            {report && (
              <>
                <a href={`/api/admin/applications/${applicationId}/report`} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#FFFFFF', color: '#0A0A0A', border: '1px solid #E2E0DA', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  Fit report
                </a>
                <a href={`/api/admin/applications/${applicationId}/comprehensive`} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  Comprehensive report
                </a>
                <a href={`/api/admin/applications/${applicationId}/report.pdf`} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#FFFFFF', color: '#0A0A0A', border: '1px solid #E2E0DA', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  Fit PDF
                </a>
              </>
            )}
            <button onClick={() => handleScore()} disabled={scoring}
              style={{ background: '#F5F4F0', color: '#0A0A0A', border: '1px solid #E2E0DA', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: scoring ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {scoring ? 'Regenerating...' : 'Regenerate fit'}
            </button>
          </div>
        </>
      )}

      {error && (
        <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '8px 12px', marginTop: 12 }}>
          <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
        </div>
      )}
      {success && (
        <div style={{ background: '#EAEAEA', border: '1px solid #D5D3CE', borderRadius: 10, padding: '8px 12px', marginTop: 12 }}>
          <p style={{ fontSize: 12, color: '#3F3F3F', fontWeight: 600 }}>{success}</p>
        </div>
      )}
    </div>
  )
}

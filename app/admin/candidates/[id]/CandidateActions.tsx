'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { candidateId: string; openJobs: Array<{ id: string; title: string }> }

export default function CandidateActions({ candidateId, openJobs }: Props) {
  const router = useRouter()
  const [jobId, setJobId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  async function start(payload: { job_id: string | null }) {
    setLoading(true); setError(''); setInfo('')
    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}/evaluate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setInfo(payload.job_id ? `Job-fit evaluation started. Invite email sent.` : `Generic evaluation started. Invite email sent.`)
      router.refresh()
      setTimeout(() => router.push(`/admin/applications/${data.application_id}`), 600)
    } catch {
      setError('Connection error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '22px 24px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 14 }}>Start an evaluation</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 12 }}>
        <select value={jobId} onChange={(e) => setJobId(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 13, color: '#0A0A0A', background: '#FFFFFF', outline: 'none', fontFamily: 'inherit', appearance: 'none' as const }}>
          <option value="">Select a job…</option>
          {openJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <button type="button" onClick={() => jobId && start({ job_id: jobId })} disabled={!jobId || loading}
          style={{ background: !jobId || loading ? '#AEABA3' : '#0F3D3E', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 600, cursor: !jobId || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Starting…' : 'Assign to job'}
        </button>
      </div>

      <div style={{ borderTop: '1px solid #F0EEE8', paddingTop: 14, marginTop: 6 }}>
        <p style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 10 }}>
          Don't have a job in mind yet? Start a <strong>generic evaluation</strong> (career-discovery interview + complementary assessments, no job-fit score). You can convert it to a specific job fit later.
        </p>
        <button type="button" onClick={() => start({ job_id: null })} disabled={loading}
          style={{ background: '#FFFFFF', color: '#0F3D3E', border: '1px solid #0F3D3E', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          Start generic evaluation
        </button>
      </div>

      {info && (
        <div style={{ background: '#EAF4EF', border: '1px solid #B3D9C4', borderRadius: 10, padding: '8px 12px', marginTop: 12 }}>
          <p style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600 }}>{info}</p>
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

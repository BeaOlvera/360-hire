import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '../../AdminHeader'
import CandidateActions from './CandidateActions'

export const dynamic = 'force-dynamic'

async function getCandidate(id: string) {
  const { data: candidate, error } = await supabaseAdmin
    .from('candidates')
    .select('id, first_name, surname1, surname2, email, preferred_language, created_at')
    .eq('id', id)
    .single()
  if (error || !candidate) return null

  const { data: apps } = await supabaseAdmin
    .from('applications')
    .select('id, status, fit_score, recommendation, invited_at, completed_at, job_id, jobs ( title )')
    .eq('candidate_id', id)
    .order('invited_at', { ascending: false })

  const { data: openJobs } = await supabaseAdmin
    .from('jobs')
    .select('id, title, assessments, competencies')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return { candidate, applications: apps ?? [], openJobs: openJobs ?? [] }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Invited', in_progress: 'In progress', completed: 'Completed',
  reviewed: 'Reviewed', hired: 'Hired', rejected: 'Rejected',
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function CandidateDetail({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) redirect('/admin')
  const result = await getCandidate(params.id)
  if (!result) notFound()
  const { candidate, applications, openJobs } = result
  const name = [candidate.first_name, candidate.surname1, candidate.surname2].filter(Boolean).join(' ')

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0' }}>
      <AdminHeader />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px' }}>
        <Link href="/admin/candidates" style={{ fontSize: 12, color: '#6B6B6B', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>← Back to candidates</Link>

        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.4px' }}>{name}</h1>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 4 }}>{candidate.email} · {(candidate.preferred_language ?? 'en').toUpperCase()}</p>
        </div>

        <CandidateActions
          candidateId={candidate.id}
          openJobs={openJobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            assessments: Array.isArray(j.assessments) ? j.assessments : [],
            competencies: Array.isArray(j.competencies) ? j.competencies : [],
          }))}
        />

        <div style={{ marginTop: 26 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 12 }}>Evaluations</p>
          {applications.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#6B6B6B' }}>No evaluations yet. Start one above.</p>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 100px 100px 110px', padding: '12px 24px', borderBottom: '1px solid #E2E0DA', background: '#F5F4F0' }}>
                {['Job / type', 'Status', 'Fit', 'Recommendation', 'Invited'].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#AEABA3', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {applications.map((a: any, i) => (
                <Link key={a.id} href={`/admin/applications/${a.id}`}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 100px 100px 110px', padding: '14px 24px', borderBottom: i < applications.length - 1 ? '1px solid #F0EEE8' : 'none', alignItems: 'center', textDecoration: 'none', color: '#0A0A0A' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {a.jobs?.title ?? <em style={{ color: '#6B6B6B', fontStyle: 'italic' }}>Generic evaluation</em>}
                  </span>
                  <span style={{ fontSize: 12, color: '#6B6B6B' }}>{STATUS_LABELS[a.status] ?? a.status}</span>
                  <span style={{ fontSize: 13, color: '#0A0A0A', fontWeight: 600 }}>{a.fit_score == null ? '-' : `${Math.round(a.fit_score * 100)}%`}</span>
                  <span style={{ fontSize: 12, color: '#6B6B6B' }}>{a.recommendation ?? '-'}</span>
                  <span style={{ fontSize: 12, color: '#6B6B6B' }}>{formatDate(a.invited_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

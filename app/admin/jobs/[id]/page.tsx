import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '../../AdminHeader'
import InviteCandidate from './InviteCandidate'

type ApplicationRow = {
  id: string
  candidate_name: string
  candidate_email: string
  status: string
  fit_score: number | null
  recommendation: string | null
  invited_at: string
  completed_at: string | null
}

async function getJob(id: string) {
  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .select('id, title, description, org_level, language, hiring_manager, status, created_at, assessments, competencies')
    .eq('id', id)
    .single()
  if (error || !job) return null

  const { data: appsRaw } = await supabaseAdmin
    .from('applications')
    .select('id, status, fit_score, recommendation, invited_at, completed_at, candidate_id')
    .eq('job_id', id)
    .order('invited_at', { ascending: false })

  const candidateIds = (appsRaw ?? []).map((a) => a.candidate_id)
  const { data: candidates } = candidateIds.length
    ? await supabaseAdmin
        .from('candidates')
        .select('id, first_name, surname1, surname2, email')
        .in('id', candidateIds)
    : { data: [] }

  const candById: Record<string, any> = {}
  for (const c of candidates ?? []) candById[c.id] = c

  const applications: ApplicationRow[] = (appsRaw ?? []).map((a) => {
    const c = candById[a.candidate_id] ?? {}
    return {
      id: a.id,
      candidate_name: [c.first_name, c.surname1, c.surname2].filter(Boolean).join(' ') || '(unknown)',
      candidate_email: c.email ?? '',
      status: a.status,
      fit_score: a.fit_score,
      recommendation: a.recommendation,
      invited_at: a.invited_at,
      completed_at: a.completed_at,
    }
  })

  return { job, applications }
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:     { bg: '#F5F4F0', color: '#AEABA3', label: 'Invited' },
  in_progress: { bg: '#FEF3E2', color: '#B7791F', label: 'In progress' },
  completed:   { bg: '#EAF4EF', color: '#2D6A4F', label: 'Completed' },
  reviewed:    { bg: '#E8E4F3', color: '#4C3A8C', label: 'Reviewed' },
  hired:       { bg: '#DCEEEA', color: '#0F3D3E', label: 'Hired' },
  rejected:    { bg: '#FBEAEC', color: '#9B2335', label: 'Rejected' },
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) redirect('/admin')

  const result = await getJob(params.id)
  if (!result) notFound()
  const { job, applications } = result

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0' }}>
      <AdminHeader />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px' }}>
        <Link href="/admin/dashboard" style={{ fontSize: 12, color: '#6B6B6B', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>← Back to jobs</Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.4px' }}>{job.title}</h1>
            <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 4 }}>
              {job.org_level ?? '-'} · {job.language.toUpperCase()}{job.hiring_manager ? ` · ${job.hiring_manager}` : ''}
            </p>
          </div>
        </div>

        {/* JD card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '24px 28px', marginBottom: 22 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 12 }}>
            Job description
          </p>
          <p style={{ fontSize: 13, color: '#0A0A0A', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{job.description}</p>
        </div>

        {/* Invite + applications */}
        <InviteCandidate
          jobId={job.id}
          jobLanguage={job.language}
          jobAssessments={Array.isArray((job as any).assessments) ? (job as any).assessments : []}
          jobCompetencies={Array.isArray((job as any).competencies) ? (job as any).competencies : []}
        />

        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 12 }}>
            Candidates
          </p>
          {applications.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#6B6B6B' }}>No candidates invited yet.</p>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 100px 100px 110px', padding: '12px 24px', borderBottom: '1px solid #E2E0DA', background: '#F5F4F0' }}>
                {['Candidate', 'Email', 'Status', 'Fit', 'Invited'].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#AEABA3', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {applications.map((a, i) => {
                const s = STATUS_STYLES[a.status] ?? STATUS_STYLES.pending
                return (
                  <Link key={a.id} href={`/admin/applications/${a.id}`} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.4fr 100px 100px 110px',
                    padding: '14px 24px', borderBottom: i < applications.length - 1 ? '1px solid #F0EEE8' : 'none',
                    alignItems: 'center', textDecoration: 'none', color: '#0A0A0A',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{a.candidate_name}</span>
                    <span style={{ fontSize: 12, color: '#6B6B6B' }}>{a.candidate_email}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, justifySelf: 'start',
                      background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: '#0A0A0A', fontWeight: 600 }}>
                      {a.fit_score == null ? '-' : `${Math.round(a.fit_score * 100)}%`}
                    </span>
                    <span style={{ fontSize: 12, color: '#6B6B6B' }}>{formatDate(a.invited_at)}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

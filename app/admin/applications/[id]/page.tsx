import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '../../AdminHeader'
import { logAudit } from '@/lib/audit'
import ScoringPanel from './ScoringPanel'
import CandidateLinkCard from './CandidateLinkCard'
import { ASSESSMENT_CODES, getAssessment, type AssessmentCode } from '@/lib/assessments'

type Message = { role: 'assistant' | 'user'; content: string; created_at: string }

async function getApplication(id: string) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, job_id, status, cv_url, cv_text, video_url, fit_score, recommendation, report_html, token,
      reviewed_by, reviewed_at, review_notes, invited_at, started_at, completed_at,
      jobs ( id, title, description, language, org_level, hiring_manager, assessments ),
      candidates ( first_name, surname1, surname2, email, preferred_language )
    `)
    .eq('id', id)
    .single()
  if (error || !app) return null

  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('role, content, created_at')
    .eq('application_id', app.id)
    .order('created_at', { ascending: true })

  const { data: assessmentRows } = await supabaseAdmin
    .from('assessment_responses')
    .select('assessment_code, scores, language, completed_at')
    .eq('application_id', app.id)

  // For the generic-eval -> job-fit conversion picker
  const { data: openJobsRaw } = await supabaseAdmin
    .from('jobs')
    .select('id, title')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
  const openJobs = openJobsRaw ?? []

  logAudit({ action: 'transcript.viewed', actorType: 'admin', resourceType: 'application', resourceId: app.id })
  if (app.video_url) {
    logAudit({ action: 'video.viewed', actorType: 'admin', resourceType: 'application', resourceId: app.id })
  }

  return { app, messages: (messages ?? []) as Message[], assessmentRows: assessmentRows ?? [], openJobs }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Invited',
  in_progress: 'In progress',
  completed: 'Completed',
  reviewed: 'Reviewed',
  hired: 'Hired',
  rejected: 'Rejected',
}

function formatDateTime(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return '-'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms <= 0) return '-'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export default async function ApplicationReviewPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) redirect('/admin')

  const result = await getApplication(params.id)
  if (!result) notFound()
  const { app, messages, assessmentRows, openJobs } = result

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  const candidateName = [candidate?.first_name, candidate?.surname1, candidate?.surname2].filter(Boolean).join(' ') || '(unknown)'

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0' }}>
      <AdminHeader />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>
        <Link href={`/admin/jobs/${job?.id ?? ''}`} style={{ fontSize: 12, color: '#6B6B6B', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>← Back to job</Link>

        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.4px' }}>{candidateName}</h1>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 4 }}>
            {candidate?.email ?? ''} · {job?.title ?? ''}
          </p>
        </div>

        {/* Summary card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 26px', marginBottom: 22, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          <Stat label="Status" value={STATUS_LABELS[app.status] ?? app.status} />
          <Stat label="Fit score" value={app.fit_score == null ? '-' : `${Math.round(app.fit_score * 100)}%`} />
          <Stat label="Invited" value={formatDateTime(app.invited_at)} />
          <Stat label="Interview length" value={formatDuration(app.started_at, app.completed_at)} />
        </div>

        {/* Candidate link, shareable directly + resend invite email */}
        {app.status !== 'completed' && app.status !== 'reviewed' && app.status !== 'hired' && app.status !== 'rejected' && (
          <CandidateLinkCard applicationId={app.id} token={app.token} candidateEmail={candidate?.email ?? null} />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22, alignItems: 'start' }}>

          {/* Left column: video + transcript */}
          <div>
            {app.video_url ? (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px', marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase' }}>Session recording</p>
                  {app.status !== 'completed' && app.status !== 'reviewed' && app.status !== 'hired' && app.status !== 'rejected' && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FEF3E2', color: '#B7791F', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Partial - candidate did not finish
                    </span>
                  )}
                </div>
                {/* Cache-bust the stable URL so we always show the latest snapshot. */}
                <video src={`${app.video_url}?t=${Date.now()}`} controls preload="metadata"
                  style={{ width: '100%', borderRadius: 12, background: '#000', display: 'block' }} />
                <p style={{ fontSize: 11, color: '#AEABA3', marginTop: 8 }}>
                  <a href={app.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0F3D3E' }}>Open in new tab</a>
                  {app.status !== 'completed' && app.status !== 'reviewed' && app.status !== 'hired' && app.status !== 'rejected' && (
                    <span> · auto-saves every 60 seconds while the candidate is in the interview</span>
                  )}
                </p>
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px', marginBottom: 22 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 8 }}>Session recording</p>
                <p style={{ fontSize: 13, color: '#6B6B6B' }}>
                  No video yet{app.status === 'completed' ? ' (candidate may have denied camera access).' : '. The recording starts when the candidate enters the interview and auto-saves every 60 seconds.'}
                </p>
              </div>
            )}

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 12 }}>Transcript</p>
              {messages.length === 0 ? (
                <p style={{ fontSize: 13, color: '#6B6B6B' }}>No messages yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                      background: m.role === 'assistant' ? '#F5F4F0' : '#EAF4EF',
                      color: '#0A0A0A',
                      borderLeft: m.role === 'assistant' ? '3px solid #0F3D3E' : '3px solid #2D6A4F',
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: m.role === 'assistant' ? '#0F3D3E' : '#2D6A4F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                        {m.role === 'assistant' ? 'Interviewer' : 'Candidate'}
                      </p>
                      <p>{m.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: job + CV + assessments + actions */}
          <div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px', marginBottom: 22 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 12 }}>Job</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>{job?.title ?? ''}</p>
              <p style={{ fontSize: 12, color: '#6B6B6B', marginTop: 4 }}>
                {job?.org_level ?? '-'} · {(job?.language ?? 'en').toUpperCase()}{job?.hiring_manager ? ` · ${job.hiring_manager}` : ''}
              </p>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px', marginBottom: 22 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 12 }}>CV</p>
              {app.cv_url ? (
                <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#0F3D3E', color: '#FFFFFF', textDecoration: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'inline-block' }}>
                  Open CV
                </a>
              ) : (
                <p style={{ fontSize: 13, color: '#6B6B6B' }}>No CV uploaded.</p>
              )}
              {app.cv_text && (
                <details style={{ marginTop: 12 }}>
                  <summary style={{ fontSize: 12, color: '#6B6B6B', cursor: 'pointer' }}>Extracted text</summary>
                  <pre style={{ fontSize: 11, color: '#0A0A0A', whiteSpace: 'pre-wrap', marginTop: 8, fontFamily: 'inherit', lineHeight: 1.5 }}>{app.cv_text}</pre>
                </details>
              )}
            </div>

            {/* Assessment results card */}
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const enabled: string[] = Array.isArray((job as any)?.assessments) ? (job as any).assessments : []
              if (enabled.length === 0) return null
              return (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px', marginBottom: 22 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 12 }}>Complementary assessments</p>
                  {enabled.map((code) => {
                    const def = getAssessment(code)
                    const row = assessmentRows.find((r) => r.assessment_code === code)
                    const name = def ? def.name.en : code
                    return (
                      <div key={code} style={{ padding: '10px 0', borderBottom: '1px solid #F0EEE8' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{name}</span>
                          {row ? (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#EAF4EF', color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completed</span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#F5F4F0', color: '#AEABA3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pending</span>
                          )}
                        </div>
                        {row && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: '#6B6B6B' }}>{summarizeScores(code as AssessmentCode, row.scores)}</span>
                            <a href={`/api/admin/applications/${app.id}/assessment/${code}`} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, color: '#0F3D3E', fontWeight: 600, textDecoration: 'underline' }}>
                              Open report
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}

            <ScoringPanel
              applicationId={app.id}
              initialFitScore={app.fit_score}
              initialRecommendation={app.recommendation}
              initialStatus={app.status}
              initialReviewNotes={app.review_notes}
              hasReport={!!app.report_html}
              hasTranscript={messages.length > 0}
              isGeneric={!app.job_id}
              openJobs={openJobs}
            />

            {app.review_notes && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px', marginTop: 22 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 8 }}>Saved notes</p>
                <p style={{ fontSize: 13, color: '#0A0A0A', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{app.review_notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function summarizeScores(code: AssessmentCode, scores: any): string {
  if (code === 'thinking_style') {
    const dom = scores?.dominant ?? '-'
    const pct = scores?.percentages?.[dom] ?? 0
    return `Dominant: ${dom} (${pct}%)`
  }
  if (code === 'growth_orientation') {
    const overall = Number(scores?.overall ?? 0).toFixed(2)
    const level = scores?.level ?? '-'
    return `Overall: ${overall} / 5 · ${level}`
  }
  if (code === 'career_values') {
    const top: string[] = Array.isArray(scores?.top) ? scores.top : []
    return `Top: ${top.join(', ') || '-'}`
  }
  return ''
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{value}</p>
    </div>
  )
}

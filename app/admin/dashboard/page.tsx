import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '../AdminHeader'

type JobRow = {
  id: string
  title: string
  status: string
  language: string
  hiring_manager: string | null
  created_at: string
  application_count: number
  completed_count: number
}

async function getJobs(): Promise<JobRow[]> {
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select('id, title, status, language, hiring_manager, created_at')
    .order('created_at', { ascending: false })

  if (error || !jobs) return []

  const { data: apps } = await supabaseAdmin
    .from('applications')
    .select('job_id, status')

  const counts: Record<string, { total: number; completed: number }> = {}
  for (const a of apps ?? []) {
    if (!a.job_id) continue
    counts[a.job_id] ||= { total: 0, completed: 0 }
    counts[a.job_id].total += 1
    if (a.status === 'completed' || a.status === 'reviewed' || a.status === 'hired' || a.status === 'rejected') {
      counts[a.job_id].completed += 1
    }
  }

  return jobs.map((j) => ({
    ...j,
    application_count: counts[j.id]?.total ?? 0,
    completed_count: counts[j.id]?.completed ?? 0,
  }))
}

export default async function DashboardPage() {
  if (!isAdminAuthenticated()) redirect('/admin')

  const jobs = await getJobs()

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0' }}>
      <AdminHeader />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.4px' }}>Jobs</h1>
          <Link href="/admin/jobs/new" style={{
            background: '#0F3D3E', color: '#FFFFFF', textDecoration: 'none',
            padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          }}>
            + New job
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 16 }}>No jobs yet. Create your first one to start inviting candidates.</p>
            <Link href="/admin/jobs/new" style={{
              background: '#0F3D3E', color: '#FFFFFF', textDecoration: 'none',
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            }}>
              Create job
            </Link>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', padding: '12px 24px', borderBottom: '1px solid #E2E0DA', background: '#F5F4F0' }}>
              {['Title', 'Hiring manager', 'Language', 'Candidates', 'Status'].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#AEABA3', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {jobs.map((j, i) => (
              <Link key={j.id} href={`/admin/jobs/${j.id}`} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
                padding: '14px 24px', borderBottom: i < jobs.length - 1 ? '1px solid #F0EEE8' : 'none',
                alignItems: 'center', textDecoration: 'none', color: '#0A0A0A',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{j.title}</span>
                <span style={{ fontSize: 13, color: '#6B6B6B' }}>{j.hiring_manager ?? '-'}</span>
                <span style={{ fontSize: 13, color: '#6B6B6B' }}>{j.language.toUpperCase()}</span>
                <span style={{ fontSize: 13, color: '#0A0A0A' }}>{j.completed_count} / {j.application_count}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, justifySelf: 'start',
                  background: j.status === 'open' ? '#EAF4EF' : '#F5F4F0',
                  color: j.status === 'open' ? '#2D6A4F' : '#6B6B6B',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{j.status}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

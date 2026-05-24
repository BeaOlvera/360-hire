import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '../AdminHeader'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  name: string
  email: string
  language: string
  application_count: number
  last_activity: string | null
}

async function getCandidates(): Promise<Row[]> {
  const { data: candidates } = await supabaseAdmin
    .from('candidates')
    .select('id, first_name, surname1, surname2, email, preferred_language, created_at')
    .order('created_at', { ascending: false })

  if (!candidates) return []

  const ids = candidates.map((c) => c.id)
  const { data: apps } = ids.length
    ? await supabaseAdmin
        .from('applications')
        .select('candidate_id, invited_at')
        .in('candidate_id', ids)
    : { data: [] }

  const stats: Record<string, { count: number; latest: string | null }> = {}
  for (const a of apps ?? []) {
    if (!a.candidate_id) continue
    stats[a.candidate_id] ||= { count: 0, latest: null }
    stats[a.candidate_id].count += 1
    if (!stats[a.candidate_id].latest || (a.invited_at && a.invited_at > stats[a.candidate_id].latest!)) {
      stats[a.candidate_id].latest = a.invited_at
    }
  }

  return candidates.map((c) => ({
    id: c.id,
    name: [c.first_name, c.surname1, c.surname2].filter(Boolean).join(' '),
    email: c.email,
    language: c.preferred_language ?? 'en',
    application_count: stats[c.id]?.count ?? 0,
    last_activity: stats[c.id]?.latest ?? null,
  }))
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function CandidatesPage() {
  if (!isAdminAuthenticated()) redirect('/admin')
  const candidates = await getCandidates()

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0' }}>
      <AdminHeader />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.4px' }}>Candidates</h1>
          <Link href="/admin/candidates/new" style={{ background: '#0F3D3E', color: '#FFFFFF', textDecoration: 'none', padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
            + New candidate
          </Link>
        </div>

        {candidates.length === 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 16 }}>No candidates yet. Add one to evaluate them with or without a specific job.</p>
            <Link href="/admin/candidates/new" style={{ background: '#0F3D3E', color: '#FFFFFF', textDecoration: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
              Add candidate
            </Link>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 90px 90px 120px', padding: '12px 24px', borderBottom: '1px solid #E2E0DA', background: '#F5F4F0' }}>
              {['Name', 'Email', 'Lang', 'Evals', 'Last invited'].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#AEABA3', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {candidates.map((c, i) => (
              <Link key={c.id} href={`/admin/candidates/${c.id}`}
                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 90px 90px 120px', padding: '14px 24px', borderBottom: i < candidates.length - 1 ? '1px solid #F0EEE8' : 'none', alignItems: 'center', textDecoration: 'none', color: '#0A0A0A' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: '#6B6B6B' }}>{c.email}</span>
                <span style={{ fontSize: 12, color: '#6B6B6B' }}>{c.language.toUpperCase()}</span>
                <span style={{ fontSize: 13, color: '#0A0A0A', fontWeight: 600 }}>{c.application_count}</span>
                <span style={{ fontSize: 12, color: '#6B6B6B' }}>{formatDate(c.last_activity)}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminHeader() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  return (
    <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E0DA' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0F3D3E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 9 }}>360</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A', letterSpacing: '-0.3px' }}>Hire</span>
        </Link>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/admin/dashboard" style={pillStyle}>Jobs</Link>
          <Link href="/admin/candidates" style={pillStyle}>Candidates</Link>
          <Link href="/admin/samples" style={pillStyle}>Samples</Link>
          <button onClick={handleLogout} style={{ ...pillStyle, border: '1px solid #E2E0DA', cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

const pillStyle: React.CSSProperties = {
  background: '#F5F4F0', color: '#0A0A0A', textDecoration: 'none',
  padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
  border: '1px solid #E2E0DA',
}

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function InviteCandidate({ jobId, jobLanguage }: { jobId: string; jobLanguage: string }) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [surname1, setSurname1] = useState('')
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState<'en' | 'es'>(jobLanguage === 'es' ? 'es' : 'en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!firstName.trim()) { setError('First name is required.'); return }
    if (!email.trim()) { setError('Email is required.'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          surname1: surname1.trim() || null,
          email: email.trim(),
          preferred_language: language,
        }),
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

        {error && (
          <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ background: '#EAF4EF', border: '1px solid #B3D9C4', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#2D6A4F', fontWeight: 600 }}>{success}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading} style={{
            background: loading ? '#AEABA3' : '#0F3D3E', color: '#FFFFFF', border: 'none',
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

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCandidateForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [surname1, setSurname1] = useState('')
  const [email, setEmail] = useState('')
  const [language, setLanguage] = useState<'en' | 'es'>('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) { setError('First name is required.'); return }
    if (!email.trim()) { setError('Email is required.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName.trim(), surname1: surname1.trim() || null, email: email.trim(), preferred_language: language }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      router.push(`/admin/candidates/${data.id}`)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '24px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <Field label="First name *">
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Maria" style={inputStyle} />
        </Field>
        <Field label="Surname">
          <input value={surname1} onChange={(e) => setSurname1(e.target.value)} placeholder="Garcia" style={inputStyle} />
        </Field>
      </div>
      <Field label="Email *">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="maria@example.com" style={inputStyle} />
      </Field>
      <Field label="Preferred language">
        <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'es')} style={{ ...inputStyle, appearance: 'none' as const }}>
          <option value="en">English</option>
          <option value="es">Espanol</option>
        </select>
      </Field>

      {error && (
        <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" onClick={() => router.push('/admin/candidates')} style={{ background: '#FFFFFF', color: '#0A0A0A', border: '1px solid #E2E0DA', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button type="submit" disabled={loading} style={{ background: loading ? '#AEABA3' : '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Creating...' : 'Create candidate'}
        </button>
      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 13, color: '#0A0A0A', background: '#FFFFFF', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A0A0A', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

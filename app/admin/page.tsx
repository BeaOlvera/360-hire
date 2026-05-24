'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/admin/dashboard')
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '36px 40px 32px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#0F3D3E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 11 }}>360</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 19, color: '#0A0A0A', letterSpacing: '-0.5px' }}>Hire</span>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.5px', marginBottom: 6 }}>
            Admin sign in
          </h1>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 24 }}>
            Access the hiring assessment portal.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A0A0A', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                placeholder="Enter admin password"
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #E2E0DA',
                  borderRadius: 10, fontSize: 13, color: '#0A0A0A', background: '#FFFFFF',
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>

            {error && (
              <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%', background: loading || !password ? '#AEABA3' : '#0A0A0A',
                color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '11px 0',
                fontSize: 13, fontWeight: 600, cursor: loading || !password ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ fontSize: 11, color: '#AEABA3', textAlign: 'center', marginTop: 12 }}>
          360 Hire · Candidate Assessment Platform
        </p>
      </div>
    </div>
  )
}

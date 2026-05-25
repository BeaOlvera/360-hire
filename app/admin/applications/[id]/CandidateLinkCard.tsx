'use client'

import { useState } from 'react'

export default function CandidateLinkCard({ applicationId, token, candidateEmail }: { applicationId: string; token: string; candidateEmail: string | null }) {
  const [copied, setCopied] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [resendErr, setResendErr] = useState('')

  const url = typeof window !== 'undefined' ? `${window.location.origin}/apply/${token}` : `/apply/${token}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable */ }
  }

  async function handleResend() {
    setResending(true); setResendMsg(''); setResendErr('')
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/resend-invite`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setResendErr(data.error ?? 'Could not resend the email'); return }
      setResendMsg(`Email resent to ${data.to ?? candidateEmail ?? 'the candidate'}.`)
    } catch {
      setResendErr('Network error. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px', marginBottom: 22 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 10 }}>Candidate link</p>
      <p style={{ fontSize: 11, color: '#6B6B6B', lineHeight: 1.5, marginBottom: 10 }}>
        Share this link with the candidate to start the evaluation. You can also resend the original invitation email at any point as a reminder.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <input readOnly value={url}
          onFocus={(e) => e.currentTarget.select()}
          style={{ flex: 1, minWidth: 200, padding: '9px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 12, fontFamily: 'monospace', background: '#F5F4F0', color: '#0A0A0A', outline: 'none' }} />
        <button onClick={handleCopy}
          style={{ background: copied ? '#3F3F3F' : '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
        <button onClick={handleResend} disabled={resending || !candidateEmail}
          title={!candidateEmail ? 'No email on file for this candidate' : ''}
          style={{ background: '#FFFFFF', color: '#0A0A0A', border: '1px solid #E2E0DA', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: resending || !candidateEmail ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: resending || !candidateEmail ? 0.6 : 1 }}>
          {resending ? 'Resending…' : 'Resend email'}
        </button>
      </div>
      {resendMsg && (
        <div style={{ background: '#EAEAEA', border: '1px solid #D5D3CE', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ fontSize: 12, color: '#3F3F3F', fontWeight: 600 }}>{resendMsg}</p>
        </div>
      )}
      {resendErr && (
        <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '8px 12px' }}>
          <p style={{ fontSize: 12, color: '#9B2335' }}>{resendErr}</p>
        </div>
      )}
    </div>
  )
}

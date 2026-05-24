'use client'

import { useState } from 'react'

export default function CandidateLinkCard({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/apply/${token}` : `/apply/${token}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '20px 22px', marginBottom: 22 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#AEABA3', textTransform: 'uppercase', marginBottom: 10 }}>Candidate link</p>
      <p style={{ fontSize: 11, color: '#6B6B6B', lineHeight: 1.5, marginBottom: 10 }}>
        Share this link with the candidate to start the evaluation. The invitation email may not always deliver (free Resend tier limits), so you can paste this link into WhatsApp / Slack / SMS directly.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input readOnly value={url}
          onFocus={(e) => e.currentTarget.select()}
          style={{ flex: 1, minWidth: 0, padding: '9px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 12, fontFamily: 'monospace', background: '#F5F4F0', color: '#0A0A0A', outline: 'none' }} />
        <button onClick={handleCopy}
          style={{ background: copied ? '#3F3F3F' : '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

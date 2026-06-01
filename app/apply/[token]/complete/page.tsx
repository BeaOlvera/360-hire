import Logo from '@/components/Logo'

export default function CompletePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 520, background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '40px 36px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <Logo variant="dark" height={26} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', marginBottom: 10 }}>Thank you</h1>
        <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.65 }}>
          Your interview has been recorded. The hiring team will review it and get back to you with next steps. You can safely close this window.
        </p>
      </div>
    </div>
  )
}

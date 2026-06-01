import Logo from '@/components/Logo'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F5F4F0' }}>
      <div style={{ maxWidth: 480, background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '32px 36px' }}>
        <div style={{ marginBottom: 18 }}>
          <Logo variant="dark" height={26} />
        </div>
        <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.6 }}>
          AI-led candidate assessment for hiring teams. Candidates complete a structured conversational interview;
          the platform produces a job-fit match against the role&apos;s requirements.
        </p>
        <p style={{ fontSize: 12, color: '#AEABA3', marginTop: 18 }}>
          Admin login and candidate links coming next.
        </p>
      </div>
    </div>
  )
}

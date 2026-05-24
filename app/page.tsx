export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '32px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0F3D3E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 10 }}>360</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>360 Hire</span>
        </div>
        <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.6 }}>
          AI-led candidate assessment for hiring teams. Candidates complete a structured conversational interview;
          the platform produces a job-fit match against the role's requirements.
        </p>
        <p style={{ fontSize: 12, color: '#AEABA3', marginTop: 18 }}>
          Admin login and candidate links coming next.
        </p>
      </div>
    </div>
  )
}

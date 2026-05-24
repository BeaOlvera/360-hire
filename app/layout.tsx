export const metadata = {
  title: '360 Hire',
  description: 'AI-led candidate assessment and job-fit analysis.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#F5F4F0', color: '#0A0A0A' }}>
        {children}
      </body>
    </html>
  )
}

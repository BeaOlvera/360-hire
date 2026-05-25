import { isAdminAuthenticated } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminHeader from '../AdminHeader'

export const dynamic = 'force-dynamic'

type SampleEntry = {
  code: string
  name: string
  description: string
  category: 'assessment' | 'fit' | 'comprehensive'
}

const SAMPLES: SampleEntry[] = [
  // Top-level reports
  { code: 'comprehensive',      name: 'Comprehensive Report',  category: 'comprehensive',
    description: 'The synthesis report: executive summary + recommendation up top, then per-competency interview coding, cross-signal observations, assessments at a glance, suggested next steps, transcript appendix.' },
  { code: 'fit_report',          name: 'Job-Fit Report',         category: 'fit',
    description: 'The standalone job-fit scoring report: overall fit percentage, recommendation, per-competency scores with evidence and gaps, strengths, concerns, risk flags, suggested next steps.' },

  // Complementary assessments
  { code: 'thinking_style',      name: 'Thinking Style',         category: 'assessment',
    description: 'Four-quadrant brain-dominance profile (simplified Herrmann). 12 forced-choice items. Visualisation: 2x2 monochrome grid.' },
  { code: 'growth_orientation',  name: 'Growth Orientation',     category: 'assessment',
    description: 'Learning agility across three subscales. 18 Likert items. Visualisation: ring gauge + per-subscale bars.' },
  { code: 'career_values',       name: 'Career Values',          category: 'assessment',
    description: 'Eight career anchors (Schein framework). 24 Likert items. Visualisation: ranked bar chart with top three highlighted.' },
  { code: 'culture_fit',         name: 'Culture Fit (OCAI)',     category: 'assessment',
    description: 'OCAI 4-quadrant culture profile compared with the role profile. 6 dimensions x 100-point allocation. Visualisation: radar overlay.' },
  { code: 'big_five',            name: 'Big Five Personality',   category: 'assessment',
    description: 'Five-factor personality (IPIP items). 30 Likert items. Visualisation: per-trait bars with high / average / lower bands.' },
  { code: 'icar_reasoning',      name: 'Reasoning (ICAR-style)', category: 'assessment',
    description: 'General cognitive reasoning across four subdomains (verbal, number, letter, logic). 12 multiple-choice items with right answers.' },
  { code: 'resilience',          name: 'Resilience',             category: 'assessment',
    description: 'Recovery from setbacks and stress. 6 Likert items. Visualisation: single score with banded interpretation.' },
]

const CATEGORY_LABEL: Record<SampleEntry['category'], string> = {
  comprehensive: 'Synthesis',
  fit:           'Job fit',
  assessment:    'Complementary assessment',
}

export default function SamplesPage() {
  if (!isAdminAuthenticated()) redirect('/admin')

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0' }}>
      <AdminHeader />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.4px' }}>Sample reports</h1>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 6, lineHeight: 1.5 }}>
            Static demonstrations of every report variant, rendered against a fictional candidate (&ldquo;Maria Sample&rdquo;) and a fictional Senior Product Manager role. Useful for showing your partner what the output looks like without running a real assessment.
          </p>
        </div>

        <div style={{ background: '#F0EEE8', border: '1px solid #E2E0DA', borderRadius: 12, padding: '12px 16px', marginBottom: 22 }}>
          <p style={{ fontSize: 12, color: '#3F3F3F', lineHeight: 1.55, margin: 0 }}>
            <strong>Note:</strong> these reports use hardcoded sample data and the actual report-generation code, so they always reflect the current templates. They do not call the AI (free + instant). When you run a real evaluation, the Comprehensive and Fit reports are produced by Claude against the real transcript and scores.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SAMPLES.map((s) => (
            <div key={s.code} style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 14, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 120px', gap: 18, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>{s.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: '#F5F4F0', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{CATEGORY_LABEL[s.category]}</span>
                </div>
                <p style={{ fontSize: 12.5, color: '#6B6B6B', lineHeight: 1.55, margin: 0 }}>{s.description}</p>
              </div>
              <a href={`/api/admin/samples/${s.code}`} target="_blank" rel="noopener noreferrer"
                style={{ background: '#0A0A0A', color: '#FFFFFF', textDecoration: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 600, textAlign: 'center' as const, whiteSpace: 'nowrap' }}>
                View sample
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

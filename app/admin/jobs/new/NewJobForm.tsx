'use client'

import { useState, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'

const ORG_LEVELS = ['Individual contributor', 'Manager', 'Director', 'VP', 'Executive']

const ASSESSMENT_OPTIONS = [
  { code: 'thinking_style',      name: 'Thinking Style',          desc: 'Four-quadrant brain-dominance profile, 12 forced-choice items (~5 min).' },
  { code: 'growth_orientation',  name: 'Growth Orientation',      desc: 'Learning agility across 3 subscales, 18 Likert items (~5 min).' },
  { code: 'career_values',       name: 'Career Values',           desc: '8 career anchors mapping what drives the candidate, 24 Likert items (~6 min).' },
  { code: 'culture_fit',         name: 'Culture Fit (OCAI)',      desc: "OCAI 4-quadrant culture profile vs. the role's culture, 6 dimensions, 100-point allocation (~7 min). Set the company culture below." },
  { code: 'big_five',            name: 'Big Five Personality',    desc: 'Five-factor personality profile (E, A, C, N, O), 30 IPIP items (~6 min). Strongest single personality predictor of job performance.' },
  { code: 'icar_reasoning',      name: 'Reasoning (ICAR-style)',  desc: 'General cognitive ability across 4 subdomains, 12 multiple-choice items with right answers (~8 min). Modeled on the open ICAR project.' },
  { code: 'resilience',          name: 'Resilience',              desc: 'Recovery from setbacks and stress, 6 Likert items (~2 min). Inspired by the Brief Resilience Scale framework.' },
]

type Competency = { name: string; weight: 1 | 2 | 3 }
type Culture = { CLAN: number; ADHOCRACY: number; MARKET: number; HIERARCHY: number }

export default function NewJobForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [orgLevel, setOrgLevel] = useState('Individual contributor')
  const [language, setLanguage] = useState<'en' | 'es'>('en')
  const [hiringManager, setHiringManager] = useState('')
  const [assessments, setAssessments] = useState<string[]>([])
  const [culture, setCulture] = useState<Culture>({ CLAN: 25, ADHOCRACY: 25, MARKET: 25, HIERARCHY: 25 })
  const [comps, setComps] = useState<Competency[]>([])
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleAssessment(code: string) {
    setAssessments((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code])
  }

  async function handleExtractFile(f: File) {
    setError(''); setInfo(''); setExtracting(true)
    try {
      const form = new FormData()
      form.append('file', f, f.name)
      const res = await fetch('/api/admin/jobs/extract-from-file', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Extraction failed'); return }
      setTitle(data.title ?? '')
      setDescription(data.description ?? '')
      if (data.org_level) setOrgLevel(data.org_level)
      if (data.language === 'es' || data.language === 'en') setLanguage(data.language)
      if (Array.isArray(data.suggested_competencies) && data.suggested_competencies.length > 0) {
        setComps(data.suggested_competencies.slice(0, 7).map((name: string) => ({ name, weight: 2 as const })))
      }
      setInfo(`Extracted from "${f.name}". Review the title, description, and competencies below before saving.`)
    } catch {
      setError('Could not contact the extractor. Please try again.')
    } finally {
      setExtracting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }
    if (!description.trim()) { setError('Description is required.'); return }
    if (assessments.includes('culture_fit')) {
      const total = culture.CLAN + culture.ADHOCRACY + culture.MARKET + culture.HIERARCHY
      if (total !== 100) { setError('The culture profile must total 100 points across the four quadrants.'); return }
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          org_level: orgLevel,
          language,
          hiring_manager: hiringManager.trim() || null,
          assessments,
          culture_profile: assessments.includes('culture_fit') ? culture : null,
          competencies: comps.filter((c) => c.name.trim().length > 0),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create job'); return }
      router.push(`/admin/jobs/${data.id}`)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 20, padding: '28px 32px' }}>

      <div style={{ background: '#F5F4F0', border: '1px dashed #E2E0DA', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#0A0A0A', marginBottom: 4 }}>Upload a JD file (PDF) and auto-fill</p>
          <p style={{ fontSize: 11, color: '#6B6B6B' }}>Title, description, level, language, and competencies will be extracted by Claude. You can still edit before saving.</p>
        </div>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExtractFile(f) }}
          style={{ display: 'none' }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={extracting}
          style={{ background: extracting ? '#AEABA3' : '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: extracting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {extracting ? 'Extracting...' : 'Upload JD'}
        </button>
      </div>

      {info && (
        <div style={{ background: '#EAEAEA', border: '1px solid #D5D3CE', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#3F3F3F' }}>{info}</p>
        </div>
      )}

      <Field label="Job title *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Senior Product Manager" style={inputStyle} />
      </Field>

      <Field label="Job description *" hint="Paste the full job description, or upload a PDF above to auto-fill. Used to build the interview and the fit score.">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={10}
          placeholder="Responsibilities, requirements, what success looks like..."
          style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 220, lineHeight: 1.55 }} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Org level">
          <select value={orgLevel} onChange={(e) => setOrgLevel(e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
            {ORG_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Interview language">
          <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'es')} style={{ ...inputStyle, appearance: 'none' as const }}>
            <option value="en">English</option>
            <option value="es">Espanol</option>
          </select>
        </Field>
      </div>

      <Field label="Hiring manager (optional)">
        <input value={hiringManager} onChange={(e) => setHiringManager(e.target.value)} placeholder="Name shown on the dashboard" style={inputStyle} />
      </Field>

      <Field label="Competencies for the in-depth interview" hint="The AI interviewer will probe each competency at the depth you set: Critical = 2-3 detailed incidents, Important = 1-2 incidents, Relevant = at least 1 example. Leave empty to let the AI extract them from the JD.">
        <CompetenciesEditor comps={comps} onChange={setComps} />
      </Field>

      <Field label="Complementary assessments (optional)" hint="Candidate takes each enabled test after CV upload and before the interview.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ASSESSMENT_OPTIONS.map((a) => {
            const on = assessments.includes(a.code)
            return (
              <label key={a.code} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                border: `1px solid ${on ? '#0A0A0A' : '#E2E0DA'}`, borderRadius: 10,
                background: on ? '#F5F4F0' : '#FFFFFF', cursor: 'pointer',
              }}>
                <input type="checkbox" checked={on} onChange={() => toggleAssessment(a.code)} style={{ marginTop: 3 }} />
                <span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{a.name}</span>
                  <span style={{ display: 'block', fontSize: 12, color: '#6B6B6B', marginTop: 2 }}>{a.desc}</span>
                </span>
              </label>
            )
          })}
        </div>
      </Field>

      {assessments.includes('culture_fit') && (
        <CultureProfileEditor culture={culture} onChange={setCulture} />
      )}

      {error && (
        <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" onClick={() => router.push('/admin/dashboard')} style={{
          background: '#FFFFFF', color: '#0A0A0A', border: '1px solid #E2E0DA',
          borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>Cancel</button>
        <button type="submit" disabled={loading} style={{
          background: loading ? '#AEABA3' : '#0A0A0A', color: '#FFFFFF', border: 'none',
          borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          {loading ? 'Creating...' : 'Create job'}
        </button>
      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E2E0DA',
  borderRadius: 10, fontSize: 13, color: '#0A0A0A', background: '#FFFFFF',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A0A0A', marginBottom: 6 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: '#AEABA3', marginBottom: 6 }}>{hint}</p>}
      {children}
    </div>
  )
}

// Competencies editor (name + weight + remove)
const WEIGHT_BG: Record<1 | 2 | 3, string> = { 1: '#F5F4F0', 2: '#EAEAEA', 3: '#E2E0DA' }
const WEIGHT_FG: Record<1 | 2 | 3, string> = { 1: '#AEABA3', 2: '#6B6B6B', 3: '#0A0A0A' }

function CompetenciesEditor({
  comps, onChange,
}: { comps: Competency[]; onChange: (c: Competency[]) => void }) {
  function update(i: number, patch: Partial<Competency>) {
    const next = comps.slice()
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  function remove(i: number) { onChange(comps.slice(0, i).concat(comps.slice(i + 1))) }
  function add() { onChange([...comps, { name: '', weight: 2 }]) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {comps.map((c, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 36px', gap: 8, alignItems: 'center' }}>
          <input value={c.name} onChange={(e) => update(i, { name: e.target.value })}
            placeholder="e.g. Stakeholder management"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E0DA', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const, outline: 'none' }} />
          <select value={c.weight} onChange={(e) => update(i, { weight: Number(e.target.value) as 1 | 2 | 3 })}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E0DA', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', fontWeight: 700, color: WEIGHT_FG[c.weight], background: WEIGHT_BG[c.weight], appearance: 'none' as const, outline: 'none' }}>
            <option value={3}>Critical</option>
            <option value={2}>Important</option>
            <option value={1}>Relevant</option>
          </select>
          <button type="button" onClick={() => remove(i)}
            title="Remove"
            style={{ background: '#FFFFFF', color: '#9B2335', border: '1px solid #E2E0DA', borderRadius: 8, padding: '7px 0', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>×</button>
        </div>
      ))}
      <button type="button" onClick={add}
        style={{ alignSelf: 'flex-start', background: '#FFFFFF', color: '#0A0A0A', border: '1px dashed #E2E0DA', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        + Add competency
      </button>
    </div>
  )
}

// Culture profile editor (4 sliders summing to 100)
const CULTURE_TYPES: Array<{ key: keyof Culture; name: string; tag: string }> = [
  { key: 'CLAN',      name: 'Clan',      tag: 'Collaborate (family-like)' },
  { key: 'ADHOCRACY', name: 'Adhocracy', tag: 'Create (innovative)' },
  { key: 'MARKET',    name: 'Market',    tag: 'Compete (results)' },
  { key: 'HIERARCHY', name: 'Hierarchy', tag: 'Control (structured)' },
]

function CultureProfileEditor({
  culture, onChange,
}: { culture: Culture; onChange: (c: Culture) => void }) {
  const total = CULTURE_TYPES.reduce((s, t) => s + (culture[t.key] ?? 0), 0)
  const isOk = total === 100
  return (
    <div style={{ background: '#F5F4F0', border: '1px solid #E2E0DA', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#0A0A0A' }}>Company culture profile for this role</p>
        <span style={{ fontSize: 12, fontWeight: 700, color: isOk ? '#0A0A0A' : '#9B2335' }}>Total: {total} / 100</span>
      </div>
      <p style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 12 }}>Distribute 100 points across the four OCAI quadrants describing the culture in which the new hire will work. The candidate&apos;s preference is compared to this profile.</p>
      {CULTURE_TYPES.map((t) => {
        const v = culture[t.key] ?? 0
        return (
          <div key={t.key} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 70px', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#0A0A0A' }}>
              <span style={{ display: 'inline-block', background: '#EAEAEA', color: '#3F3F3F', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, marginRight: 8, letterSpacing: '0.08em' }}>{t.name}</span>
              {t.tag}
            </span>
            <input type="range" min={0} max={100} value={v} onChange={(e) => onChange({ ...culture, [t.key]: Number(e.target.value) })} style={{ accentColor: '#0A0A0A' }} />
            <input type="number" min={0} max={100} value={v} onChange={(e) => onChange({ ...culture, [t.key]: Number(e.target.value) })}
              style={{ width: '100%', padding: '5px 8px', border: '1px solid #E2E0DA', borderRadius: 8, fontSize: 13, textAlign: 'right' as const, color: '#0A0A0A', fontWeight: 700, fontFamily: 'inherit' }} />
          </div>
        )
      })}
    </div>
  )
}

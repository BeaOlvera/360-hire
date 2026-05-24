// Verify CV upload via Supabase Storage end-to-end.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// Reset our test application then upload
const token = '786232c6-47ed-4b85-8662-37d0b23c70eb'
await supabase.from('applications').update({ cv_url: null, cv_text: null }).eq('token', token)
await fetch(`http://localhost:3003/api/apply/${token}/consent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })

// Minimal valid PDF (10 lines, "Hello PDF") - smallest possible
const pdfBytes = Buffer.from(
  '%PDF-1.1\n' +
  '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
  '4 0 obj<</Length 44>>stream\nBT /F1 24 Tf 30 100 Td (Hello CV) Tj ET\nendstream\nendobj\n' +
  '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
  'xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000054 00000 n\n0000000101 00000 n\n0000000189 00000 n\n0000000273 00000 n\n' +
  'trailer<</Size 6/Root 1 0 R>>\nstartxref\n328\n%%EOF\n'
)
console.log('PDF size:', pdfBytes.length, 'bytes')

const fd = new FormData()
fd.append('cv', new Blob([pdfBytes], { type: 'application/pdf' }), 'test_cv.pdf')

console.log('POSTing to /api/apply/[token]/cv ...')
const r = await fetch(`http://localhost:3003/api/apply/${token}/cv`, { method: 'POST', body: fd })
console.log('HTTP', r.status)
console.log('body:', await r.text())

// Verify the row was updated
const { data: app } = await supabase.from('applications').select('cv_url, cv_text').eq('token', token).single()
console.log('\nDB state:')
console.log('  cv_url:', app?.cv_url)
console.log('  cv_text preview:', (app?.cv_text ?? '').slice(0, 80))

// Reset
await supabase.from('applications').update({ cv_url: null, cv_text: null }).eq('token', token)
await supabase.from('privacy_consents').delete().eq('application_id', (await supabase.from('applications').select('id').eq('token', token).single()).data.id)
console.log('\n(reset application to fresh)')

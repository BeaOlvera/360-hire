import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

/**
 * POST, upload the candidate's CV to Supabase Storage (bucket: 'cv').
 * Body: multipart/form-data with `cv` file.
 * Attempts to extract text from PDFs via Anthropic so the interview prompt
 * can reference concrete CV content.
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('id, status')
    .eq('token', params.token)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (app.status === 'completed') return NextResponse.json({ error: 'Application already completed' }, { status: 400 })

  let form: FormData
  try { form = await request.formData() } catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }

  const file = form.get('cv')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'cv field required' }, { status: 400 })
  }
  const original = (file as File).name || 'cv.pdf'
  const safeName = original.replace(/[^a-zA-Z0-9._-]/g, '_')
  const contentType = (file as File).type || 'application/pdf'

  const buf = await file.arrayBuffer()
  const objectPath = `${app.id}/${Date.now()}-${safeName}`

  const { error: upErr } = await supabaseAdmin.storage
    .from('cv')
    .upload(objectPath, buf, { contentType, upsert: false })
  if (upErr) {
    console.error('CV storage upload failed:', upErr)
    return NextResponse.json({ error: `Failed to store CV: ${upErr.message}` }, { status: 500 })
  }
  const { data: pub } = supabaseAdmin.storage.from('cv').getPublicUrl(objectPath)
  const cvUrl = pub.publicUrl

  // Try to extract text (PDFs only) so the interview prompt can use it
  let cvText: string | null = null
  if (contentType.includes('pdf')) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const base64 = Buffer.from(buf).toString('base64')
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: 'Extract the full text content of this CV / resume in plain text. Preserve section order. Return only the extracted text, nothing else.' },
          ],
        }],
      })
      const block = response.content[0]
      if (block.type === 'text') cvText = block.text.trim()
    } catch (err) {
      console.error('CV text extraction failed (non-fatal):', err)
    }
  }

  await supabaseAdmin.from('applications').update({ cv_url: cvUrl, cv_text: cvText }).eq('id', app.id)

  logAudit({
    action: 'cv.uploaded',
    actorType: 'candidate',
    resourceType: 'application',
    resourceId: app.id,
    details: { filename: safeName, extracted_text: cvText !== null },
  })

  return NextResponse.json({ ok: true, cv_url: cvUrl, extracted_text: cvText !== null })
}

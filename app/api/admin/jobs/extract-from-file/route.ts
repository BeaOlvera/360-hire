import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth'
import { logAI } from '@/lib/audit'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST, accept a JD file (PDF) and ask Anthropic to extract structured fields.
 * Body: multipart/form-data with `file` blob.
 * Returns: { title, description, org_level, language, suggested_competencies }
 */
export async function POST(request: NextRequest) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let form: FormData
  try { form = await request.formData() } catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }
  const file = form.get('file')
  if (!file || !(file instanceof Blob)) return NextResponse.json({ error: 'file field required' }, { status: 400 })

  const type = (file as File).type || ''
  if (!type.includes('pdf')) {
    return NextResponse.json({ error: 'Only PDF files are supported for extraction. For DOC/DOCX, paste the text manually.' }, { status: 400 })
  }
  const buf = await file.arrayBuffer()
  if (buf.byteLength === 0) return NextResponse.json({ error: 'Empty file' }, { status: 400 })
  if (buf.byteLength > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })

  const base64 = Buffer.from(buf).toString('base64')
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = `You extract structured information from a job description PDF. Output STRICT JSON only, no surrounding prose.

Schema:
{
  "title": string,                       // role title, short
  "description": string,                 // clean rewritten description, no boilerplate, no recruiter contact info. Preserve substantive content. 400-1200 words.
  "org_level": string,                   // one of: "Individual contributor", "Manager", "Director", "VP", "Executive" (best guess from level cues like reports / scope / years)
  "language": string,                    // "en" or "es", detect from the body of the JD
  "suggested_competencies": [string]     // 4-7 short labels, extracted from the JD requirements / responsibilities, in the same language as the JD
}

Rules:
- The description MUST be in the same language as the source PDF.
- Strip headers / footers / legal boilerplate / company about-us blurbs unless they materially describe the role.
- If the PDF is not a job description, return: {"error": "not a job description"}.
- Never use em or en dashes ("—" / "–"); use commas, parentheses, or separate sentences.`

  const started = Date.now()
  let raw = ''
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: 'Extract the structured JSON.' },
        ],
      }],
    })
    const block = response.content[0]
    raw = block.type === 'text' ? block.text : ''
    logAI({
      actionType: 'ai.jd_extraction',
      model: 'claude-haiku-4-5-20251001',
      promptLength: systemPrompt.length,
      responseLength: raw.length,
      tokensUsed: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
      durationMs: Date.now() - started,
    })
  } catch (err: any) {
    console.error('JD extraction failed:', err)
    return NextResponse.json({ error: err?.message ?? 'Extraction failed' }, { status: 500 })
  }

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json({ error: 'No JSON in extraction response' }, { status: 500 })

  let parsed: any
  try { parsed = JSON.parse(match[0]) } catch { return NextResponse.json({ error: 'Invalid JSON in extraction response' }, { status: 500 }) }

  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const allowedLevels = ['Individual contributor', 'Manager', 'Director', 'VP', 'Executive']
  const result = {
    title: String(parsed.title ?? '').trim(),
    description: String(parsed.description ?? '').trim(),
    org_level: allowedLevels.includes(parsed.org_level) ? parsed.org_level : 'Individual contributor',
    language: parsed.language === 'es' ? 'es' : 'en',
    suggested_competencies: Array.isArray(parsed.suggested_competencies)
      ? parsed.suggested_competencies.map((s: unknown) => String(s)).slice(0, 7)
      : [],
  }
  if (!result.title || !result.description) return NextResponse.json({ error: 'Extraction returned empty title or description' }, { status: 500 })

  return NextResponse.json(result)
}

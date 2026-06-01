import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { transcribeAudio } from '@/lib/whisper'

export const maxDuration = 60

/**
 * POST, transcribe a recorded chunk from the live interview chat (voice input).
 * Body: multipart/form-data with an `audio` Blob.
 * Returns: { text }, or { error, detail } on failure.
 *
 * Returns structured error info (with `detail`) so the client UI can surface
 * the actual reason rather than a generic "Transcription failed" message.
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Transcribe: OPENAI_API_KEY missing on server')
    return NextResponse.json({ error: 'STT not configured on this server', detail: 'OPENAI_API_KEY missing' }, { status: 503 })
  }

  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('id, status, candidates ( preferred_language ), jobs ( language )')
    .eq('token', params.token)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (app.status === 'completed') return NextResponse.json({ error: 'Interview already completed' }, { status: 400 })

  let form: FormData
  try { form = await request.formData() } catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }

  const file = form.get('audio')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'audio field required' }, { status: 400 })
  }
  const buffer = await file.arrayBuffer()
  if (buffer.byteLength === 0) return NextResponse.json({ error: 'Empty audio' }, { status: 400 })

  // Whisper requires at least ~0.1s of audio. Below 2KB is almost certainly
  // an accidental tap-to-record/stop with no actual speech.
  if (buffer.byteLength < 2000) {
    return NextResponse.json({ error: 'Audio too short, please speak for at least one second', detail: `size=${buffer.byteLength}` }, { status: 400 })
  }

  const filename = (file as File).name || 'clip.webm'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  const language = (candidate?.preferred_language ?? job?.language ?? 'en') === 'es' ? 'es' : 'en'

  console.log('Transcribe: app', app.id, 'size', buffer.byteLength, 'name', filename, 'lang', language)

  try {
    const text = await transcribeAudio(buffer, filename, language)
    const clean = (text ?? '').trim()
    console.log('Transcribe: ok, len', clean.length)
    return NextResponse.json({ text: clean })
  } catch (err: any) {
    const detail = err?.message ?? String(err)
    console.error('Transcribe failed:', detail, err)
    return NextResponse.json({ error: 'Transcription failed', detail }, { status: 500 })
  }
}

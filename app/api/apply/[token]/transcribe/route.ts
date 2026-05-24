import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { transcribeAudio } from '@/lib/whisper'

export const maxDuration = 60

/**
 * POST, transcribe a recorded chunk from the live interview chat (voice input).
 * Body: multipart/form-data with an `audio` Blob.
 * Returns: { text }.
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
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

  const filename = (file as File).name || 'clip.webm'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  const language = (candidate?.preferred_language ?? job?.language ?? 'en') === 'es' ? 'es' : 'en'

  try {
    const text = await transcribeAudio(buffer, filename, language)
    return NextResponse.json({ text: (text ?? '').trim() })
  } catch (err) {
    console.error('Transcribe failed:', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}

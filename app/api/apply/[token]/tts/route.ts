import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 30

/**
 * POST, OpenAI text-to-speech for the interviewer's voice.
 *
 * Body: { text: string }
 * Returns: audio/mpeg (MP3) stream.
 *
 * Uses tts-1 (the faster, cheaper model) with a single voice per language
 * so the voice stays consistent across an entire interview. Costs ~$0.015
 * per 1k chars (~$0.001 per minute of interview audio).
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured on this server' }, { status: 503 })
  }

  // Validate token + look up the candidate's language preference
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('id, status, jobs ( language ), candidates ( preferred_language )')
    .eq('token', params.token)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const text = String(body.text ?? '').trim().slice(0, 4000)
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  const language: 'en' | 'es' = (candidate?.preferred_language ?? job?.language ?? 'en') === 'es' ? 'es' : 'en'

  // Voice choice: "nova" is warm, clear, and works well in both EN and ES.
  // "shimmer" as an alternative; we keep a single voice for consistency.
  const voice = 'nova'

  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice,
      input: text,
      // language hint not strictly required, model auto-detects
      response_format: 'mp3',
      speed: language === 'es' ? 1.0 : 1.0,
    }),
  })

  if (!r.ok) {
    const errText = await r.text().catch(() => '')
    console.error('OpenAI TTS failed', r.status, errText)
    return NextResponse.json({ error: 'TTS upstream error' }, { status: 502 })
  }

  const audio = await r.arrayBuffer()
  return new NextResponse(audio, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  })
}

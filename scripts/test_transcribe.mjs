// Verify the transcribe endpoint works end-to-end with OpenAI Whisper.
// Generates a 1-second silent WAV file in memory and POSTs to /api/apply/[token]/transcribe.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// Get a valid token from any application; if none, exit
const { data: anyApp } = await supabase.from('applications').select('token').limit(1).maybeSingle()
if (!anyApp) { console.error('No application found'); process.exit(1) }
const token = anyApp.token
console.log('Testing transcribe with token', token)

// Build a 1s 8kHz mono 16-bit PCM silent WAV
function makeSilentWav(durationSec = 1, sampleRate = 8000) {
  const numSamples = sampleRate * durationSec
  const dataSize = numSamples * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)        // PCM chunk size
  buf.writeUInt16LE(1, 20)         // PCM format
  buf.writeUInt16LE(1, 22)         // mono
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  // samples already 0
  return buf
}

const wav = makeSilentWav(1, 8000)
console.log('WAV size:', wav.length, 'bytes')

const fd = new FormData()
fd.append('audio', new Blob([wav], { type: 'audio/wav' }), 'silent.wav')

const r = await fetch(`http://localhost:3003/api/apply/${token}/transcribe`, { method: 'POST', body: fd })
console.log('HTTP', r.status)
const body = await r.text()
console.log('body:', body)

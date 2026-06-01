#!/usr/bin/env node
/**
 * Validate the partner-feedback fixes against an independent reviewer (OpenAI).
 *
 * Reads the relevant changed files, sends them along with the partner's
 * original comments to GPT, asks for a strict per-item verdict, and prints
 * a structured report.
 *
 *   PASS / PARTIAL / FAIL per item, plus an overall verdict and any
 *   concrete gaps the reviewer wants closed.
 *
 * Usage:
 *   OPENAI_API_KEY=... node scripts/validate_partner_feedback.mjs
 *   (or just `node scripts/validate_partner_feedback.mjs` — script auto-loads
 *    OPENAI_API_KEY from .env.local)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.dirname(path.dirname(__filename))

// ── 1) Read API keys (OpenAI primary, Anthropic fallback) ────────────────
function loadEnvKey(name) {
  if (process.env[name]) return process.env[name]
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return null
  const txt = fs.readFileSync(envPath, 'utf8')
  for (const line of txt.split(/\r?\n/)) {
    const re = new RegExp(`^${name}\\s*=\\s*(.+)$`)
    const m = line.match(re)
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, '')
  }
  return null
}

const openaiKey = loadEnvKey('OPENAI_API_KEY')
const anthropicKey = loadEnvKey('ANTHROPIC_API_KEY')
const FORCE = (process.env.REVIEWER || '').toLowerCase()  // 'openai' | 'anthropic' to force a vendor
if (!openaiKey && !anthropicKey) {
  console.error('FATAL: no OPENAI_API_KEY or ANTHROPIC_API_KEY available')
  process.exit(2)
}

// ── 2) Partner comments (post-correction round) ──────────────────────────
const PARTNER_COMMENTS = `Comentarios post corrección del socio (en castellano):

(1) "La transcripción de voz a texto no funciona cuando haces la entrevista como candidato. Por lo que parece si funcionara, es hablar y darle al botón cada vez que te pregunta y respondes, no sé si es muy práctico eso o si aporta demasiado..."

(2) "El otro día sí pero hoy no me funciona que me lea las preguntas para valorar si es igual o menos robótico."

(3) "No sé qué pasa porque ahora, aunque intente entrar a la prueba que me envío al correo de alyseu o al de gmail, me entra al candidato primero que he creado y en el punto en el que he dejado la entrevista. He borrado cookies y todo y nada."

(4) "La cámara ha grabado algo de voz pero nada de video, no sé por qué la verdad, de inicio se me ha conectado al móvil como si mi móvil fuera la cámara del ordenador."

(5) "Creo que no has puesto nada corporativo de la empresa en el email que envías a candidatos."

(6) "He utilizado lo de 'resend email' y, al entrar, entra en el mismo punto en el que la he dejado. Está bien pero, si queremos que inicie de nuevo, no podemos? Más que nada porque yo he iniciado mal por tema video que veía como iba, por voz no funcionaba la transcripción y bla bla."

(7) "No está resuelto el tema de que el cursor, cada vez que respondes, desaparece y hay que volver a clicar en la caja de texto. Una vez, vale pero si son 100 veces, es bastante palo."
`

// ── 3) Relevant code snippets to show the reviewer ───────────────────────
function read(rel, maxLines = 0) {
  const p = path.join(ROOT, rel)
  if (!fs.existsSync(p)) return `# MISSING FILE: ${rel}`
  let txt = fs.readFileSync(p, 'utf8')
  if (maxLines > 0) {
    const lines = txt.split(/\r?\n/)
    if (lines.length > maxLines) {
      txt = lines.slice(0, maxLines).join('\n') + `\n# ... (file truncated at ${maxLines} lines)`
    }
  }
  return `# === ${rel} ===\n${txt}`
}

const FIXES_SUMMARY = `What I changed in response to the comments:

(1) STT (voice-to-text) reliability:
  - Added structured error reporting on the server side. The transcribe route returns { error, detail } so the client can show the real cause (audio too short / OPENAI_API_KEY missing / Whisper upstream).
  - Server logs every call with size/filename/language.
  - Root cause for "silent recording" fixed: startRecording() now CLONES the audio track from the existing video stream instead of calling getUserMedia({audio:true}) a second time. Two getUserMedia calls for audio while one already owns the mic returns a silent track on Windows/Safari/Chrome mobile.
  - Race-condition guard: if the user taps Record before startVideo() finished, we wait up to 3 seconds for videoStreamRef to be ready before falling back to a fresh audio-only stream. We only skip the wait when the candidate explicitly opted out of video in the preflight.
  - The tap-to-record UX (one tap per turn) is kept by design — the partner explicitly wasn't sure if a different UX would be better, so I surface errors clearly rather than redesign the UX without confirmation. Continuous-listening would need separate consent and a different VAD pipeline.
  See: app/api/apply/[token]/transcribe/route.ts and the startRecording() function in app/apply/[token]/InterviewChat.tsx

(2) TTS (interviewer voice) sometimes not playing:
  - Diagnosed: browser autoplay policy blocks audio.play() until the candidate has interacted with the page.
  - Added a state ttsBlocked. When audio.play() throws (autoplay blocked), we show a "🔊 Toca para activar la voz" button. One tap by the user enables playback for the rest of the session.
  See: the TTS useEffect and the ttsBlocked button block in app/apply/[token]/InterviewChat.tsx

(3) Both invitation links land on the same first-candidate session:
  - Root cause hypothesis: when admin re-invites the same email to the same job, the existing application's token is reused (correct dedupe behaviour) but the admin doesn't realise both emails point to the same session.
  - Fix: /api/admin/jobs/[id]/applications/route.ts now returns "already_invited: true" when an existing application was reused; the InviteCandidate.tsx form surfaces this as a clear warning: "this candidate already had an evaluation for this job; the SAME link was resent; use Reset interview for a fresh start".
  - The Resend button now also shows a confirm dialog with the exact email the link will go to ("Resend the invitation email to test@alyseu.es? This sends the SAME interview link as before"), and the link card permanently shows the linked email under the URL.
  - Added diagnostic server-side logging on /apply/[token] so we can see in Vercel logs which applicationId each token resolves to, in case it happens again with a different cause.

(4) Camera picked the phone (virtual cam) instead of the laptop camera:
  - Built a Device Preflight screen that runs before the interview chat. It enumerates available cameras and microphones, lets the candidate pick one, shows a live preview, and persists the choice to localStorage. InterviewChat.tsx then honours the chosen deviceId when starting the recording.
  See: app/apply/[token]/DevicePreflight.tsx, app/apply/[token]/InterviewGateway.tsx, app/apply/[token]/page.tsx, and the startVideo() in app/apply/[token]/InterviewChat.tsx

(5) Email lacks branding:
  - The wordmark was previously embedded as inline SVG, which is blocked by Gmail / Outlook / iOS Mail. Replaced with a tiny HTML <table> wordmark using system fonts so it renders in every email client (no @font-face, no SVG).
  - Added a company_name column to the jobs table (migration 009). NewJobForm now has a "Company name (optional)" field. All three invite call sites (/api/admin/jobs/[id]/applications, /api/admin/applications/[id]/resend-invite, /api/admin/candidates/[id]/evaluate) now fetch jobs.company_name and pass it as the companyName argument to sendCandidateInvite. emailLogoHtml(company) renders "For ACME Corp" as a prominent line under the Zephyron|Hire wordmark when set.
  See: emailLogoHtml() in lib/email.ts and the three /api routes

(6) Need a way to restart an evaluation:
  - New endpoint POST /api/admin/applications/[id]/reset that wipes messages, assessment_responses, privacy_consents, video file; resets status to pending and clears completion data. Optional flag wipe_cv to also delete the CV.
  - New buttons on the candidate link card: "Reset interview (keep CV)" and "Reset + delete CV". Each with a confirm dialog.
  - The candidate link card is now visible even after completion, so admins can rerun a completed evaluation.
  See: app/api/admin/applications/[id]/reset/route.ts, app/admin/applications/[id]/CandidateLinkCard.tsx, app/admin/applications/[id]/page.tsx

(7) Cursor still leaves the chat textarea after every reply:
  - Previous attempt used a useEffect on [canType, inputMode] but apparently didn't work in practice.
  - Now using requestAnimationFrame so focus runs after the textarea is re-enabled in the next paint, plus we restore the caret position to the end of the existing text, plus the dependency includes messages.length so it also fires on each new turn, plus we added autoFocus on the textarea for the initial mount.
  See: the "Keep cursor in the textarea" useEffect and the <textarea> element in app/apply/[token]/InterviewChat.tsx
`

const CODE_BUNDLE = [
  read('app/api/apply/[token]/transcribe/route.ts'),
  read('app/api/apply/[token]/tts/route.ts'),
  read('app/api/admin/applications/[id]/reset/route.ts'),
  read('app/api/admin/applications/[id]/resend-invite/route.ts'),
  read('app/api/admin/jobs/[id]/applications/route.ts'),
  read('app/admin/applications/[id]/CandidateLinkCard.tsx'),
  read('app/admin/jobs/[id]/InviteCandidate.tsx'),
  read('app/apply/[token]/DevicePreflight.tsx'),
  read('app/apply/[token]/InterviewGateway.tsx'),
  read('app/apply/[token]/page.tsx'),
  read('app/apply/[token]/InterviewChat.tsx'),
  read('lib/email.ts'),
  read('app/api/admin/jobs/route.ts'),
  read('app/admin/jobs/new/NewJobForm.tsx', 80),
  read('app/api/admin/candidates/[id]/evaluate/route.ts'),
].join('\n\n')

// ── 4) Build the validation request ──────────────────────────────────────
const SYSTEM = `You are a strict, senior software engineer asked to independently verify whether a series of fixes correctly address user-reported issues. You are NOT the engineer who wrote the code; you are reviewing it.

Rules:
- For EACH numbered partner comment, render a verdict: "PASS", "PARTIAL", or "FAIL".
- For PARTIAL or FAIL, name the concrete file:line problem and the smallest correct fix.
- Be precise and code-grounded. Quote tiny snippets if needed.
- Catch real bugs: race conditions, hooks dependency issues, accessibility, security, server/client boundaries.
- If a fix is correct but incomplete (e.g. fixes the visible symptom but the underlying cause remains a footgun), mark PARTIAL.
- Do NOT invent issues. If a fix is correct, just say PASS with one short sentence of evidence.

End your review with:
  OVERALL: GREEN | YELLOW | RED
and a final 2-sentence summary.`

const USER = `Here are the partner's comments, my summary of what I changed for each, and the current code.

== PARTNER COMMENTS ==
${PARTNER_COMMENTS}

== MY FIXES SUMMARY ==
${FIXES_SUMMARY}

== RELEVANT CODE (current state on disk) ==
${CODE_BUNDLE}

Now go through items (1)..(7) and give your verdict. Be strict.`

// ── 5) Call reviewer (OpenAI first, Anthropic fallback) ──────────────────
async function reviewWithOpenAI() {
  const body = {
    model: 'gpt-4o',
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: USER },
    ],
  }
  console.error(`Posting ${(JSON.stringify(body).length / 1024).toFixed(1)} KB to OpenAI (gpt-4o)...`)
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const txt = await r.text()
    return { ok: false, status: r.status, error: txt, vendor: 'openai' }
  }
  const j = await r.json()
  return {
    ok: true,
    vendor: 'openai',
    model: 'gpt-4o',
    text: j.choices?.[0]?.message?.content ?? '(no content)',
    usage: j.usage,
  }
}

async function reviewWithAnthropic() {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    temperature: 0,
    system: SYSTEM,
    messages: [{ role: 'user', content: USER }],
  }
  console.error(`Posting ${(JSON.stringify(body).length / 1024).toFixed(1)} KB to Anthropic (claude-sonnet-4-6)...`)
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const txt = await r.text()
    return { ok: false, status: r.status, error: txt, vendor: 'anthropic' }
  }
  const j = await r.json()
  const text = j.content?.[0]?.type === 'text' ? j.content[0].text : '(no content)'
  return { ok: true, vendor: 'anthropic', model: 'claude-sonnet-4-6', text, usage: j.usage }
}

let result
if (FORCE === 'anthropic') {
  result = await reviewWithAnthropic()
} else if (FORCE === 'openai') {
  result = await reviewWithOpenAI()
} else if (openaiKey) {
  result = await reviewWithOpenAI()
  if (!result.ok && /insufficient_quota|quota|429/i.test(result.error ?? '') && anthropicKey) {
    console.error('OpenAI quota exhausted, falling back to Anthropic...')
    result = await reviewWithAnthropic()
  }
} else {
  result = await reviewWithAnthropic()
}

if (!result.ok) {
  console.error(`${result.vendor} HTTP error ${result.status}`)
  console.error(result.error)
  process.exit(3)
}

console.log('========================================================')
console.log(`INDEPENDENT REVIEW (${result.vendor} / ${result.model})`)
console.log('========================================================')
console.log(result.text)
console.log('========================================================')
if (result.usage) console.log(`tokens: ${JSON.stringify(result.usage)}`)

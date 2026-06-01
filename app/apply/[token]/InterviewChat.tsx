'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

type Message = { role: 'assistant' | 'user'; content: string }
type IOMode = 'voice' | 'text'

type Props = {
  token: string
  candidateFirstName: string
  candidateFullName: string
  jobTitle: string
  language: 'en' | 'es'
  existingMessages: Message[]
  voiceTranscriptionAvailable?: boolean   // false if the server has no OPENAI_API_KEY; hides voice-input toggle
}

const I18N = {
  en: {
    header: (title: string) => `Interview for ${title}`,
    subheader: 'Conversational interview',
    input_voice: 'Voice',
    input_text: 'Text',
    your_input: 'Your input',
    ai_voice: 'AI voice',
    tap_to_record: 'Tap to record',
    tap_to_stop: 'Tap to stop',
    transcribing: 'Transcribing...',
    mic_denied: 'Microphone access denied. Switch to text or grant permission.',
    mic_unsupported: 'Voice input is not supported in this browser.',
    voice_unconfigured: 'Voice input is not configured on this server. Please use text.',
    tts_unsupported: 'Voice output is not available in this browser.',
    tts_unavailable: 'Voice output is not configured on this server. Please use text.',
    tts_enable: 'Tap to enable voice',
    transcribe_failed: 'Could not transcribe. Try again or switch to text.',
    placeholder_text: 'Type your response... (Enter to send, Shift+Enter for new line)',
    placeholder_waiting: 'Waiting for interviewer...',
    typing: 'Interviewer is typing...',
    complete: 'Interview complete',
    redirecting: 'Redirecting you now...',
    footer: 'Your responses are confidential and used only for this hiring assessment.',
    failed: 'Something went wrong. Please try again.',
    conn_error: 'Connection error. Please try again.',
    failed_start: 'Failed to start the interview. Please refresh.',
  },
  es: {
    header: (title: string) => `Entrevista para ${title}`,
    subheader: 'Entrevista conversacional',
    input_voice: 'Voz',
    input_text: 'Texto',
    your_input: 'Tu entrada',
    ai_voice: 'Voz IA',
    tap_to_record: 'Toca para grabar',
    tap_to_stop: 'Toca para detener',
    transcribing: 'Transcribiendo...',
    mic_denied: 'Acceso al micrófono denegado. Cambia a texto o concede el permiso.',
    mic_unsupported: 'La entrada por voz no es compatible con este navegador.',
    voice_unconfigured: 'La entrada por voz no está configurada en este servidor. Por favor usa texto.',
    tts_unsupported: 'La salida por voz no está disponible en este navegador.',
    tts_unavailable: 'La voz no está configurada en este servidor. Por favor usa texto.',
    tts_enable: 'Toca para activar la voz',
    transcribe_failed: 'No se pudo transcribir. Inténtalo de nuevo o cambia a texto.',
    placeholder_text: 'Escribe tu respuesta... (Enter para enviar, Shift+Enter para nueva línea)',
    placeholder_waiting: 'Esperando al entrevistador...',
    typing: 'La entrevistadora está escribiendo...',
    complete: 'Entrevista completa',
    redirecting: 'Te redirigimos ahora...',
    footer: 'Tus respuestas son confidenciales y se usan únicamente para esta evaluación de selección.',
    failed: 'Hubo un problema. Inténtalo de nuevo.',
    conn_error: 'Error de conexión. Inténtalo de nuevo.',
    failed_start: 'No se pudo iniciar la entrevista. Recarga la página.',
  },
} as const

export default function InterviewChat({
  token, candidateFirstName, candidateFullName, jobTitle, language, existingMessages, voiceTranscriptionAvailable,
}: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(existingMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasInitialized = useRef(false)

  const t = I18N[language]

  // Voice I/O state
  const [inputMode, setInputMode] = useState<IOMode>('text')
  const [outputMode, setOutputMode] = useState<IOMode>('text')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSpokenIndexRef = useRef<number>(-1)
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)
  const pendingTtsUrlRef = useRef<string | null>(null)
  const [ttsBlocked, setTtsBlocked] = useState(false)
  // TTS is now server-side (OpenAI tts-1). Always available unless the route
  // returns 503 (server has no OPENAI_API_KEY) — handled lazily on first use.
  const ttsAvailable = true
  const sttAvailable = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof window.MediaRecorder !== 'undefined'

  // Continuous video recording (whole session) with periodic snapshot uploads
  const [videoReady, setVideoReady] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [lastSnapshotAt, setLastSnapshotAt] = useState<Date | null>(null)
  const videoStreamRef = useRef<MediaStream | null>(null)
  const videoRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef = useRef<BlobPart[]>([])
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const videoMimeRef = useRef<string>('')
  const snapshotInFlightRef = useRef(false)
  const snapshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoUploadedRef = useRef(false)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true
    if (existingMessages.length === 0) getFirstMessage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`apply-mode-${token}`)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.input === 'voice' || saved.input === 'text') {
          // If the server can't transcribe (no OPENAI_API_KEY), force text regardless of saved preference
          setInputMode(saved.input === 'voice' && voiceTranscriptionAvailable === false ? 'text' : saved.input)
        }
        if (saved.output === 'voice' || saved.output === 'text') setOutputMode(saved.output)
      }
    } catch { /* ignore */ }
    lastSpokenIndexRef.current = existingMessages.length - 1
  }, [token, existingMessages.length, voiceTranscriptionAvailable])

  useEffect(() => {
    try { localStorage.setItem(`apply-mode-${token}`, JSON.stringify({ input: inputMode, output: outputMode })) } catch { /* ignore */ }
  }, [token, inputMode, outputMode])

  useEffect(() => {
    return () => {
      if (ttsAudioRef.current) {
        try { ttsAudioRef.current.pause(); ttsAudioRef.current.src = '' } catch { /* ignore */ }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
      if (recordTimerRef.current) clearInterval(recordTimerRef.current)
      if (snapshotTimerRef.current) clearInterval(snapshotTimerRef.current)
      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        try { videoRecorderRef.current.stop() } catch { /* ignore */ }
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((tr) => tr.stop())
      }
    }
  }, [])

  // Snapshot upload: bundle all chunks so far and overwrite the server-side recording.
  // Used both periodically (every 60s, automatically) AND at completion.
  // Idempotent: if no chunks, no-op. If already uploading, skip.
  async function uploadSnapshot(): Promise<boolean> {
    if (snapshotInFlightRef.current) return false
    if (videoChunksRef.current.length === 0) return false
    snapshotInFlightRef.current = true
    try {
      const blob = new Blob(videoChunksRef.current, { type: videoMimeRef.current || 'video/webm' })
      if (blob.size < 2000) return false
      const form = new FormData()
      form.append('video', blob, 'recording.webm')
      const res = await fetch(`/api/apply/${token}/video`, { method: 'POST', body: form })
      if (res.ok) {
        setLastSnapshotAt(new Date())
        return true
      }
      console.warn('Video snapshot upload returned', res.status)
      return false
    } catch (err) {
      console.warn('Video snapshot upload failed', err)
      return false
    } finally {
      snapshotInFlightRef.current = false
    }
  }

  // Start the continuous video recording (camera + mic) on mount
  useEffect(() => {
    let cancelled = false
    async function startVideo() {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
        setVideoError(language === 'es' ? 'Tu navegador no permite grabar vídeo.' : 'Your browser does not support recording.')
        return
      }
      try {
        // Honour the camera/mic the candidate picked in the preflight screen.
        // localStorage preflight-<token>: { camId?, micId?, skip?: true }
        let chosenCamId: string | null = null
        let chosenMicId: string | null = null
        let skipped = false
        try {
          const raw = localStorage.getItem(`preflight-${token}`)
          if (raw) {
            const obj = JSON.parse(raw)
            if (obj?.skip === true) skipped = true
            if (typeof obj?.camId === 'string') chosenCamId = obj.camId
            if (typeof obj?.micId === 'string') chosenMicId = obj.micId
          }
        } catch { /* ignore */ }

        if (skipped) {
          // Candidate opted out of video; do nothing. Interview continues without recording.
          return
        }

        // Modest resolution + bitrate so the cumulative file stays within the 50 MB
        // Supabase Storage limit for typical 30-45 min interviews (~300 kbps * 45 min ~= 100 MB).
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 12, max: 15 },
        }
        if (chosenCamId) videoConstraints.deviceId = { exact: chosenCamId }
        const audioConstraints: MediaTrackConstraints | boolean = chosenMicId ? { deviceId: { exact: chosenMicId } } : true
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        })
        if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); return }
        videoStreamRef.current = stream
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream
        }
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus'
                   : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus'
                   : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm'
                   : ''
        videoMimeRef.current = mime || 'video/webm'
        const rec = mime ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 250_000, audioBitsPerSecond: 48_000 })
                         : new MediaRecorder(stream, { videoBitsPerSecond: 250_000, audioBitsPerSecond: 48_000 })
        videoRecorderRef.current = rec
        rec.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data) }
        rec.onstop = async () => {
          if (videoUploadedRef.current) return
          videoUploadedRef.current = true
          if (snapshotTimerRef.current) { clearInterval(snapshotTimerRef.current); snapshotTimerRef.current = null }
          setIsUploadingVideo(true)
          await uploadSnapshot()
          if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach((tr) => tr.stop())
          setIsUploadingVideo(false)
          router.push(`/apply/${token}/complete`)
        }
        // Smaller timeslice (15 s) so chunks accumulate in memory; periodic snapshot uploads every 60 s.
        rec.start(15_000)
        snapshotTimerRef.current = setInterval(() => { void uploadSnapshot() }, 60_000)
        setVideoReady(true)
      } catch (err) {
        console.error('Camera setup failed', err)
        setVideoError(language === 'es'
          ? 'No se pudo acceder a la cámara. La sesión se realizará sin grabación de vídeo.'
          : 'Camera access was not granted. The session will continue without video recording.')
      }
    }
    startVideo()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When the interview completes, stop the video recorder (its onstop handler uploads + redirects)
  useEffect(() => {
    if (!isComplete) return
    const rec = videoRecorderRef.current
    if (rec && rec.state !== 'inactive') {
      try { rec.stop() } catch { /* ignore */ }
    } else {
      // No video to upload, complete handler in onstop won't fire; redirect after a short delay
      setTimeout(() => router.push(`/apply/${token}/complete`), 1500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete])

  // Server-side TTS via OpenAI tts-1. We fetch an MP3 for each new assistant
  // message and play it; one consistent voice ("nova") across the interview.
  useEffect(() => {
    if (outputMode !== 'voice') return
    const lastIdx = messages.length - 1
    if (lastIdx <= lastSpokenIndexRef.current) return
    const last = messages[lastIdx]
    if (!last || last.role !== 'assistant') { lastSpokenIndexRef.current = lastIdx; return }
    lastSpokenIndexRef.current = lastIdx

    let cancelled = false
    ;(async () => {
      try {
        // Cancel any in-flight playback before starting the new one
        if (ttsAudioRef.current) {
          try { ttsAudioRef.current.pause() } catch { /* ignore */ }
          ttsAudioRef.current = null
        }
        const res = await fetch(`/api/apply/${token}/tts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: last.content }),
        })
        if (!res.ok) {
          // Server not configured or upstream failed; degrade gracefully
          if (res.status === 503) setError(t.tts_unavailable)
          return
        }
        const blob = await res.blob()
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        ttsAudioRef.current = audio
        audio.onended = () => { try { URL.revokeObjectURL(url) } catch { /* ignore */ } }
        try {
          await audio.play()
          setTtsBlocked(false)
        } catch (playErr) {
          // Browsers block autoplay until first user gesture. Surface a
          // play button so the candidate can manually enable the voice.
          console.warn('TTS autoplay blocked', playErr)
          pendingTtsUrlRef.current = url
          setTtsBlocked(true)
        }
      } catch {
        /* ignore */
      }
    })()
    return () => { cancelled = true }
  }, [messages, outputMode, language, token, t.tts_unavailable])

  // When the candidate switches OUT of voice mode, stop any current playback.
  useEffect(() => {
    if (outputMode === 'text' && ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); ttsAudioRef.current.src = '' } catch { /* ignore */ }
      ttsAudioRef.current = null
    }
  }, [outputMode])

  async function getFirstMessage() {
    setIsTyping(true); setError('')
    try {
      const res = await fetch(`/api/apply/${token}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(t.failed_start); return }
      setMessages([{ role: 'assistant', content: data.reply }])
      if (data.completed) setIsComplete(true)
    } catch {
      setError(t.failed_start)
    } finally {
      setIsTyping(false)
    }
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isTyping || isComplete) return
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsTyping(true); setError('')
    try {
      const res = await fetch(`/api/apply/${token}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: text }),
      })
      const data = await res.json()
      if (!res.ok) { setError(t.failed); setMessages((prev) => prev.slice(0, -1)); setInput(text); return }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      if (data.completed) setIsComplete(true)
    } catch {
      setError(t.conn_error); setMessages((prev) => prev.slice(0, -1)); setInput(text)
    } finally {
      setIsTyping(false); inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isTyping && !isComplete) sendMessage({ preventDefault: () => {} } as FormEvent)
    }
  }

  async function sendTranscribedText(text: string) {
    const clean = text.trim()
    if (!clean || isTyping || isComplete) return
    setMessages((prev) => [...prev, { role: 'user', content: clean }])
    setIsTyping(true); setError('')
    try {
      const res = await fetch(`/api/apply/${token}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: clean }),
      })
      const data = await res.json()
      if (!res.ok) { setError(t.failed); setMessages((prev) => prev.slice(0, -1)); return }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      if (data.completed) setIsComplete(true)
    } catch {
      setError(t.conn_error); setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsTyping(false)
    }
  }

  async function startRecording() {
    setError('')
    if (!sttAvailable) { setError(t.mic_unsupported); return }
    if (ttsAvailable) window.speechSynthesis.cancel()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      mediaRecorderRef.current = rec
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop())
        if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null }
        setIsRecording(false); setRecordSeconds(0)
        const blob = new Blob(audioChunksRef.current, { type: mime || 'audio/webm' })
        audioChunksRef.current = []
        if (blob.size < 500) return
        setIsTranscribing(true)
        try {
          const form = new FormData()
          form.append('audio', blob, 'clip.webm')
          const res = await fetch(`/api/apply/${token}/transcribe`, { method: 'POST', body: form })
          const data = await res.json().catch(() => ({}))
          if (!res.ok || !data.text) {
            // Surface the real reason so the candidate can act on it
            const detail = (data && (data.error || data.detail)) ? `${t.transcribe_failed} (${data.error}${data.detail ? `: ${data.detail}` : ''})` : t.transcribe_failed
            setError(detail)
          } else {
            await sendTranscribedText(data.text)
          }
        } catch (err) {
          console.warn('Transcribe network error', err)
          setError(t.transcribe_failed)
        } finally {
          setIsTranscribing(false)
        }
      }
      rec.start()
      setIsRecording(true); setRecordSeconds(0)
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch {
      setError(t.mic_denied)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop()
  }

  function formatRecordTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const canType = !isTyping && !isTranscribing && !isRecording && messages.length > 0 && !isComplete

  // Keep cursor in the textarea after the interviewer replies AND whenever a
  // new message arrives. Defer to next paint so the textarea is rendered as
  // enabled at the moment we call focus(). Belt-and-suspenders: also focus
  // when the messages array changes (some browsers drop focus during diffing).
  useEffect(() => {
    if (!canType || inputMode !== 'text') return
    const el = inputRef.current
    if (!el) return
    const id = requestAnimationFrame(() => {
      el.focus()
      // Place caret at the end (some browsers move it to the start on programmatic focus)
      const v = el.value
      el.setSelectionRange(v.length, v.length)
    })
    return () => cancelAnimationFrame(id)
  }, [canType, inputMode, messages.length])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', display: 'flex', flexDirection: 'column' }}>

      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E0DA', flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Logo variant="dark" height={20} />
            <div style={{ borderLeft: '1px solid #E2E0DA', paddingLeft: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.3px' }}>{t.header(jobTitle)}</p>
              <p style={{ fontSize: 11, color: '#AEABA3' }}>{t.subheader}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {videoReady && (
              <div style={{ position: 'relative' }}>
                <video ref={videoPreviewRef} autoPlay muted playsInline
                  style={{ width: 96, height: 72, borderRadius: 8, background: '#000', objectFit: 'cover' as const, display: 'block' }} />
                <span style={{
                  position: 'absolute', top: 4, left: 4,
                  background: '#9B2335', color: '#FFFFFF', fontSize: 9, fontWeight: 800,
                  padding: '2px 6px', borderRadius: 8, letterSpacing: '0.08em',
                }}>● REC</span>
                {lastSnapshotAt && (
                  <span title={lastSnapshotAt.toLocaleTimeString()} style={{
                    position: 'absolute', bottom: 4, right: 4,
                    background: 'rgba(0,0,0,0.6)', color: '#FFFFFF', fontSize: 8, fontWeight: 700,
                    padding: '1px 5px', borderRadius: 6,
                  }}>✓ {language === 'es' ? 'guardado' : 'saved'}</span>
                )}
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A' }}>{candidateFullName}</p>
            </div>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {messages.length === 0 && !isTyping && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 13, color: '#AEABA3' }}>{language === 'es' ? 'Preparando tu entrevista…' : 'Preparing your interview...'}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 10 }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 30, height: 30, borderRadius: 10, background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <span style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 800 }}>AI</span>
                </div>
              )}
              <div style={{
                maxWidth: '78%', padding: '12px 16px', borderRadius: 16, fontSize: 13, lineHeight: 1.6,
                ...(msg.role === 'assistant'
                  ? { background: '#FFFFFF', border: '1px solid #E2E0DA', color: '#0A0A0A', borderTopLeftRadius: 4 }
                  : { background: '#0A0A0A', color: '#FFFFFF', borderTopRightRadius: 4 }),
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <span style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 800 }}>AI</span>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 16, borderTopLeftRadius: 4, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#AEABA3', display: 'inline-block',
                        animation: 'bounce 1s infinite', animationDelay: `${delay}ms`,
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: '#AEABA3' }}>{t.typing}</span>
                </div>
              </div>
            </div>
          )}

          {isComplete && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#EAF4EF', border: '1px solid #C3E0D0', borderRadius: 14, padding: '16px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#2D6A4F' }}>{t.complete}</p>
                <p style={{ fontSize: 11, color: '#4D9A6F', marginTop: 3 }}>
                  {isUploadingVideo
                    ? (language === 'es' ? 'Subiendo la grabación…' : 'Uploading recording...')
                    : t.redirecting}
                </p>
              </div>
            </div>
          )}

          {videoError && !isComplete && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#FEF3E2', border: '1px solid #F7D9A1', borderRadius: 12, padding: '10px 16px', maxWidth: 540 }}>
                <p style={{ fontSize: 12, color: '#B7791F', textAlign: 'center' }}>{videoError}</p>
              </div>
            </div>
          )}

          {ttsBlocked && outputMode === 'voice' && !isComplete && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button"
                onClick={async () => {
                  const audio = ttsAudioRef.current
                  if (!audio) { setTtsBlocked(false); return }
                  try {
                    await audio.play()
                    setTtsBlocked(false)
                  } catch (err) {
                    console.warn('Manual TTS play failed', err)
                  }
                }}
                style={{ background: '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 999, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🔊</span> {t.tts_enable}
              </button>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 12, padding: '12px 18px' }}>
                <p style={{ fontSize: 13, color: '#9B2335' }}>{error}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {!isComplete && (
        <div style={{ background: '#FFFFFF', borderTop: '1px solid #E2E0DA', flexShrink: 0 }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 24px 14px' }}>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <ModeToggle label={t.your_input} value={inputMode}
                onChange={(v) => {
                  if (v === 'voice') {
                    if (!sttAvailable) { setError(t.mic_unsupported); return }
                    if (voiceTranscriptionAvailable === false) { setError(t.voice_unconfigured); return }
                  }
                  setInputMode(v)
                }}
                voiceLabel={t.input_voice} textLabel={t.input_text}
                disabled={isRecording || isTranscribing} />
              <ModeToggle label={t.ai_voice} value={outputMode}
                onChange={(v) => setOutputMode(v)}
                voiceLabel={t.input_voice} textLabel={t.input_text}
                disabled={false} />
            </div>

            {inputMode === 'text' ? (
              <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <textarea
                  ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  disabled={!canType} rows={1} autoFocus
                  placeholder={messages.length === 0 ? t.placeholder_waiting : t.placeholder_text}
                  style={{
                    flex: 1, resize: 'none', padding: '10px 14px', border: '1px solid #E2E0DA',
                    borderRadius: 12, fontSize: 13, color: '#0A0A0A', background: '#FFFFFF',
                    outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, minHeight: 44, maxHeight: 128,
                    overflowY: 'auto', opacity: !canType ? 0.5 : 1,
                  }} />
                <button type="submit" disabled={!input.trim() || !canType}
                  style={{
                    width: 42, height: 42, borderRadius: 12, background: !input.trim() || !canType ? '#E2E0DA' : '#0A0A0A',
                    border: 'none', cursor: !input.trim() || !canType ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }} aria-label="Send">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" width={16} height={16}>
                    <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                  </svg>
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <button type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTyping || isTranscribing || messages.length === 0}
                  aria-label={isRecording ? t.tap_to_stop : t.tap_to_record}
                  style={{
                    width: 64, height: 64, borderRadius: 32,
                    background: isRecording ? '#9B2335' : (isTyping || isTranscribing || messages.length === 0 ? '#E2E0DA' : '#0A0A0A'),
                    border: 'none',
                    cursor: isTyping || isTranscribing || messages.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s, transform 0.15s',
                    transform: isRecording ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isRecording ? '0 0 0 6px rgba(155,35,53,0.15)' : 'none',
                  }}>
                  {isRecording ? (
                    <span style={{ width: 18, height: 18, background: '#FFFFFF', borderRadius: 4, display: 'block' }} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width={24} height={24}>
                      <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" />
                      <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H8a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07A7 7 0 0019 11z" />
                    </svg>
                  )}
                </button>
                <p style={{ fontSize: 12, color: '#6B6B6B', minHeight: 18 }}>
                  {isTranscribing ? t.transcribing
                    : isRecording ? `${t.tap_to_stop} · ${formatRecordTime(recordSeconds)}`
                    : messages.length === 0 ? t.placeholder_waiting : t.tap_to_record}
                </p>
              </div>
            )}

            <p style={{ fontSize: 11, color: '#AEABA3', textAlign: 'center', marginTop: 8 }}>{t.footer}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

function ModeToggle({
  label, value, onChange, voiceLabel, textLabel, disabled,
}: {
  label: string; value: IOMode; onChange: (v: IOMode) => void
  voiceLabel: string; textLabel: string; disabled: boolean
}) {
  const wrap: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 11, color: '#6B6B6B', fontWeight: 600,
  }
  const pillBase: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
    border: '1px solid #E2E0DA', background: '#FFFFFF', color: '#6B6B6B',
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
  }
  const active: React.CSSProperties = { background: '#0A0A0A', color: '#FFFFFF', borderColor: '#0A0A0A' }
  return (
    <div style={wrap}>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ display: 'inline-flex', gap: 4 }}>
        <button type="button" disabled={disabled} onClick={() => onChange('voice')} style={{ ...pillBase, ...(value === 'voice' ? active : {}) }}>{voiceLabel}</button>
        <button type="button" disabled={disabled} onClick={() => onChange('text')} style={{ ...pillBase, ...(value === 'text' ? active : {}) }}>{textLabel}</button>
      </div>
    </div>
  )
}

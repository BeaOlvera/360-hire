'use client'

import { useState, useEffect, useRef } from 'react'
import Logo from '@/components/Logo'

/**
 * Device pre-flight. Shown before the interview chat mounts.
 *
 * Why: a partner test found that getUserMedia auto-picked a virtual camera
 * (DroidCam / phone-as-webcam), so the candidate ended up with no real video.
 * This screen enumerates available devices, lets the candidate pick which
 * camera and microphone to use, previews the camera, and persists the choice
 * to localStorage so the InterviewChat can use it.
 */

type Props = {
  token: string
  language: 'en' | 'es'
  onReady: () => void
}

const I18N = {
  en: {
    title: 'Camera & microphone check',
    intro: 'Before we start, please confirm the camera and microphone we will use during your interview. You can switch if the wrong device is selected.',
    cameraLabel: 'Camera',
    micLabel: 'Microphone',
    noPermission: 'We need access to your camera and microphone to record the interview. Please click "Allow" if your browser asks.',
    permissionDenied: 'Permission was denied. Please grant camera and microphone access in your browser settings and reload this page.',
    notSupported: 'Your browser does not support media devices. Please use the latest version of Chrome, Safari, Edge or Firefox.',
    requestAccess: 'Allow camera & microphone',
    requesting: 'Asking your browser...',
    ready: 'Looks good, start the interview',
    skip: 'Skip and continue without video',
  },
  es: {
    title: 'Comprobación de cámara y micrófono',
    intro: 'Antes de empezar, por favor confirma la cámara y el micrófono que usaremos durante tu entrevista. Puedes cambiarlos si está seleccionado el dispositivo equivocado.',
    cameraLabel: 'Cámara',
    micLabel: 'Micrófono',
    noPermission: 'Necesitamos acceso a tu cámara y micrófono para grabar la entrevista. Pulsa "Permitir" si el navegador te lo pregunta.',
    permissionDenied: 'Has denegado el permiso. Concede acceso a la cámara y micrófono en los ajustes del navegador y recarga la página.',
    notSupported: 'Tu navegador no admite dispositivos multimedia. Usa la última versión de Chrome, Safari, Edge o Firefox.',
    requestAccess: 'Permitir cámara y micrófono',
    requesting: 'Pidiendo permiso al navegador...',
    ready: 'Todo bien, empezar la entrevista',
    skip: 'Continuar sin vídeo',
  },
} as const

type State = 'idle' | 'requesting' | 'denied' | 'ready' | 'unsupported'

export default function DevicePreflight({ token, language, onReady }: Props) {
  const t = I18N[language]
  const [state, setState] = useState<State>('idle')
  const [cams, setCams] = useState<MediaDeviceInfo[]>([])
  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const [camId, setCamId] = useState<string>('')
  const [micId, setMicId] = useState<string>('')
  const previewRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Detect unsupported up front
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
    }
    // Pre-fill saved preferences if any
    try {
      const saved = localStorage.getItem(`preflight-${token}`)
      if (saved) {
        const obj = JSON.parse(saved)
        if (typeof obj.camId === 'string') setCamId(obj.camId)
        if (typeof obj.micId === 'string') setMicId(obj.micId)
      }
    } catch { /* ignore */ }
  }, [token])

  // When camId changes, re-acquire the stream with the new device
  useEffect(() => {
    if (state !== 'ready' || !camId) return
    let cancelled = false
    ;(async () => {
      try {
        streamRef.current?.getTracks().forEach((tr) => tr.stop())
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: camId }, width: { ideal: 480 }, height: { ideal: 360 } },
          audio: micId ? { deviceId: { exact: micId } } : true,
        })
        if (cancelled) { stream.getTracks().forEach((tr) => tr.stop()); return }
        streamRef.current = stream
        if (previewRef.current) previewRef.current.srcObject = stream
      } catch (err) {
        console.warn('Re-acquire stream failed', err)
      }
    })()
    return () => { cancelled = true }
  }, [camId, micId, state])

  // Clean up on unmount
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach((tr) => tr.stop()) }
  }, [])

  async function requestAccess() {
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (previewRef.current) previewRef.current.srcObject = stream
      // Enumerate AFTER the prompt so labels are visible
      const devices = await navigator.mediaDevices.enumerateDevices()
      const allCams = devices.filter((d) => d.kind === 'videoinput')
      const allMics = devices.filter((d) => d.kind === 'audioinput')
      setCams(allCams)
      setMics(allMics)
      // Default to the currently-active devices from the granted stream
      const activeVideoTrack = stream.getVideoTracks()[0]
      const activeAudioTrack = stream.getAudioTracks()[0]
      const activeCamId = activeVideoTrack?.getSettings().deviceId
      const activeMicId = activeAudioTrack?.getSettings().deviceId
      if (activeCamId && allCams.some((c) => c.deviceId === activeCamId)) setCamId(activeCamId)
      else if (allCams.length > 0) setCamId(allCams[0].deviceId)
      if (activeMicId && allMics.some((m) => m.deviceId === activeMicId)) setMicId(activeMicId)
      else if (allMics.length > 0) setMicId(allMics[0].deviceId)
      setState('ready')
    } catch (err) {
      console.warn('Permission denied', err)
      setState('denied')
    }
  }

  function handleReady() {
    try {
      localStorage.setItem(`preflight-${token}`, JSON.stringify({ camId, micId }))
    } catch { /* ignore */ }
    // Stop our preview stream so InterviewChat can acquire fresh tracks
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    onReady()
  }

  function handleSkip() {
    try { localStorage.setItem(`preflight-${token}`, JSON.stringify({ skip: true })) } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    onReady()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 640, width: '100%', background: '#FFFFFF', border: '1px solid #E2E0DA', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ background: '#0A0A0A', color: '#FFFFFF', padding: '22px 28px' }}>
          <div style={{ marginBottom: 10 }}><Logo variant="light" height={20} /></div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', margin: 0 }}>{t.title}</h1>
        </div>

        <div style={{ padding: '24px 28px' }}>
          <p style={{ fontSize: 13, color: '#0A0A0A', lineHeight: 1.6, marginBottom: 18 }}>{t.intro}</p>

          {state === 'unsupported' && (
            <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, color: '#9B2335' }}>{t.notSupported}</p>
            </div>
          )}

          {state === 'idle' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={requestAccess}
                style={{ background: '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t.requestAccess}
              </button>
            </div>
          )}

          {state === 'requesting' && (
            <p style={{ fontSize: 13, color: '#6B6B6B', textAlign: 'center' }}>{t.requesting}</p>
          )}

          {state === 'denied' && (
            <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#9B2335' }}>{t.permissionDenied}</p>
            </div>
          )}

          {state === 'ready' && (
            <>
              <div style={{ background: '#000', borderRadius: 10, overflow: 'hidden', marginBottom: 16, aspectRatio: '4 / 3', position: 'relative' }}>
                <video ref={previewRef} autoPlay muted playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
              </div>

              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 6 }}>{t.cameraLabel}</label>
              <select value={camId} onChange={(e) => setCamId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 13, color: '#0A0A0A', background: '#FFFFFF', outline: 'none', fontFamily: 'inherit', marginBottom: 14 }}>
                {cams.map((c, i) => (
                  <option key={c.deviceId} value={c.deviceId}>{c.label || `${t.cameraLabel} ${i + 1}`}</option>
                ))}
              </select>

              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: 6 }}>{t.micLabel}</label>
              <select value={micId} onChange={(e) => setMicId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E0DA', borderRadius: 10, fontSize: 13, color: '#0A0A0A', background: '#FFFFFF', outline: 'none', fontFamily: 'inherit', marginBottom: 18 }}>
                {mics.map((m, i) => (
                  <option key={m.deviceId} value={m.deviceId}>{m.label || `${t.micLabel} ${i + 1}`}</option>
                ))}
              </select>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <button onClick={handleSkip}
                  style={{ background: '#FFFFFF', color: '#6B6B6B', border: '1px solid #E2E0DA', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t.skip}
                </button>
                <button onClick={handleReady}
                  style={{ background: '#0A0A0A', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t.ready}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

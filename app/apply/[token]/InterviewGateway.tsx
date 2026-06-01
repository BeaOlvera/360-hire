'use client'

import { useEffect, useState } from 'react'
import DevicePreflight from './DevicePreflight'
import InterviewChat from './InterviewChat'

type Message = { role: 'assistant' | 'user'; content: string }

type Props = {
  token: string
  candidateFirstName: string
  candidateFullName: string
  jobTitle: string
  language: 'en' | 'es'
  existingMessages: Message[]
  voiceTranscriptionAvailable?: boolean
}

/**
 * Gate the interview behind a one-time device pre-flight. Once the candidate
 * confirms (or skips) their camera/mic selection, the InterviewChat mounts.
 * The preflight selection is persisted in localStorage under preflight-<token>.
 */
export default function InterviewGateway(props: Props) {
  // We need this state to render only on the client (avoid SSR/CSR mismatch)
  const [ready, setReady] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`preflight-${props.token}`)
      if (raw) {
        const obj = JSON.parse(raw)
        // Treat both "skip" and "device selected" as ready
        if (obj && (obj.skip === true || obj.camId || obj.micId)) {
          setReady(true); return
        }
      }
    } catch { /* ignore */ }
    setReady(false)
  }, [props.token])

  if (ready === null) return null
  if (!ready) {
    return (
      <DevicePreflight
        token={props.token}
        language={props.language}
        onReady={() => setReady(true)}
      />
    )
  }

  return <InterviewChat {...props} />
}

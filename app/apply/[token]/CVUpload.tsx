'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TEXTS = {
  en: {
    title: 'Upload your CV',
    intro: (jobTitle: string) =>
      `Please share your CV so the interviewer can ask informed questions about your background for the ${jobTitle} role. PDF is preferred.`,
    pick: 'Choose file',
    drag: 'or drag and drop',
    pdfHint: 'PDF, DOC, or DOCX up to 10 MB',
    uploading: 'Uploading...',
    failed: 'Upload failed. Please try again.',
    too_large: 'File is too large (max 10 MB).',
    continue: 'Upload and continue',
  },
  es: {
    title: 'Sube tu CV',
    intro: (jobTitle: string) =>
      `Por favor comparte tu CV para que la entrevistadora pueda hacer preguntas informadas sobre tu experiencia para el puesto de ${jobTitle}. Se prefiere PDF.`,
    pick: 'Elegir archivo',
    drag: 'o arrástralo y suéltalo',
    pdfHint: 'PDF, DOC o DOCX hasta 10 MB',
    uploading: 'Subiendo...',
    failed: 'La subida falló. Inténtalo de nuevo.',
    too_large: 'El archivo es demasiado grande (máx. 10 MB).',
    continue: 'Subir y continuar',
  },
} as const

const TEXTS_SKIP = {
  en: { skip: 'Skip for now', skipping: 'Skipping...', skipFailed: 'Could not skip. Try again.' },
  es: { skip: 'Omitir por ahora', skipping: 'Omitiendo...', skipFailed: 'No se pudo omitir. Inténtalo de nuevo.' },
}

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export default function CVUpload({
  token, candidateFirstName, jobTitle, language, canSkip,
}: { token: string; candidateFirstName: string; jobTitle: string; language: 'en' | 'es'; canSkip?: boolean }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const t = TEXTS[language]
  const ts = TEXTS_SKIP[language]

  async function handleSkip() {
    setSkipping(true); setError('')
    try {
      const res = await fetch(`/api/apply/${token}/cv/skip`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? ts.skipFailed)
        return
      }
      window.location.reload()
    } catch {
      setError(ts.skipFailed)
    } finally {
      setSkipping(false)
    }
  }

  function handleFile(f: File | null) {
    setError('')
    if (!f) { setFile(null); return }
    if (f.size > MAX_BYTES) { setError(t.too_large); return }
    setFile(f)
  }

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('cv', file, file.name)
      const res = await fetch(`/api/apply/${token}/cv`, { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? t.failed)
        return
      }
      router.refresh()
    } catch {
      setError(t.failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 600, width: '100%', background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E0DA', padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0F3D3E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 9 }}>360</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>{t.title}</span>
        </div>

        <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.6, marginBottom: 18 }}>
          {t.intro(jobTitle)}
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0] ?? null) }}
          style={{
            border: '2px dashed', borderColor: dragging ? '#0F3D3E' : '#E2E0DA',
            borderRadius: 14, padding: '32px 24px', textAlign: 'center',
            background: dragging ? '#EAF4EF' : '#F5F4F0', marginBottom: 14,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {file ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 4 }}>{file.name}</p>
              <p style={{ fontSize: 11, color: '#AEABA3' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = '' }}
                style={{ marginTop: 10, background: '#FFFFFF', color: '#0A0A0A', border: '1px solid #E2E0DA', borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                {language === 'es' ? 'Cambiar' : 'Change'}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => inputRef.current?.click()}
                style={{ background: '#0F3D3E', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
                {t.pick}
              </button>
              <p style={{ fontSize: 12, color: '#6B6B6B' }}>{t.drag}</p>
              <p style={{ fontSize: 11, color: '#AEABA3', marginTop: 6 }}>{t.pdfHint}</p>
            </>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,application/pdf"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }} />
        </div>

        {error && (
          <div style={{ background: '#FBEAEC', border: '1px solid #F5C5CB', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#9B2335' }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          {canSkip ? (
            <button onClick={handleSkip} disabled={skipping || loading}
              style={{
                background: '#FFFFFF', color: '#6B6B6B', border: '1px solid #E2E0DA',
                borderRadius: 10, padding: '9px 16px', fontSize: 12, fontWeight: 600,
                cursor: skipping || loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
              {skipping ? ts.skipping : ts.skip}
            </button>
          ) : <span />}
          <button onClick={handleSubmit} disabled={!file || loading || skipping}
            style={{
              background: !file || loading || skipping ? '#AEABA3' : '#0F3D3E', color: '#FFFFFF', border: 'none',
              borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 600,
              cursor: !file || loading || skipping ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
            {loading ? t.uploading : t.continue}
          </button>
        </div>
      </div>
    </div>
  )
}

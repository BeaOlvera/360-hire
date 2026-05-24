import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'

export const maxDuration = 300

/**
 * POST, store the continuous interview video recording in Supabase Storage (bucket: 'video').
 * Body: multipart/form-data with a `video` Blob (typically video/webm).
 * Saves the public URL on applications.video_url.
 *
 * NOTE: Supabase Storage on the free tier limits individual files to ~50 MB.
 * For 30 to 45 min sessions you may need to upgrade the project plan or
 * compress further. If the upload fails for that reason, the candidate still
 * gets redirected to /complete (the recording is just lost).
 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('token', params.token)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  let form: FormData
  try { form = await request.formData() } catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }

  const file = form.get('video')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'video field required' }, { status: 400 })
  }

  const buf = await file.arrayBuffer()
  if (buf.byteLength === 0) return NextResponse.json({ error: 'Empty video' }, { status: 400 })

  const contentType = (file as File).type || 'video/webm'
  // Stable filename so periodic snapshot uploads overwrite a single object per application.
  const objectPath = `${app.id}/recording.webm`

  // upsert: true so periodic snapshot uploads can overwrite a single "current" object per app.
  const { error: upErr } = await supabaseAdmin.storage
    .from('video')
    .upload(objectPath, buf, { contentType, upsert: true })
  if (upErr) {
    console.error('Video storage upload failed:', upErr)
    return NextResponse.json({ error: `Failed to store video: ${upErr.message}` }, { status: 500 })
  }
  const { data: pub } = supabaseAdmin.storage.from('video').getPublicUrl(objectPath)
  const url = pub.publicUrl

  await supabaseAdmin.from('applications').update({ video_url: url }).eq('id', app.id)

  logAudit({
    action: 'video.uploaded',
    actorType: 'candidate',
    resourceType: 'application',
    resourceId: app.id,
    details: { bytes: buf.byteLength },
  })

  return NextResponse.json({ ok: true, video_url: url })
}

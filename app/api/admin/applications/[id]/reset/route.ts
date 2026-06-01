import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

/**
 * POST /api/admin/applications/[id]/reset
 *
 * Wipes an in-progress (or completed) interview so the same candidate can
 * start over from the consent gate. Used when an admin or a tester needs a
 * clean re-run without inviting a new candidate.
 *
 * Body (optional):
 *   { wipe_cv?: boolean }  // default false; if true, CV is also deleted
 *
 * What it does:
 *   - Deletes all chat messages for this application
 *   - Deletes all assessment_responses
 *   - Removes the video file from Supabase Storage and clears video_url
 *   - Optionally removes the CV file and clears cv_url/cv_text
 *   - Removes the privacy_consents rows so the consent gate appears again
 *   - Resets status='pending', clears fit_score, recommendation, score_data,
 *     report_html, comprehensive_html, started_at, completed_at, review_notes
 *   - Keeps: candidate_id, job_id, token, invited_at, assessments_override,
 *     competencies_override (so the same invite link still resolves).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let body: any = {}
  try { body = await request.json() } catch { /* no body is fine */ }
  const wipeCv: boolean = body.wipe_cv === true

  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('id, cv_url, video_url')
    .eq('id', params.id)
    .single()
  if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  // Delete dependent rows
  await supabaseAdmin.from('messages').delete().eq('application_id', app.id)
  await supabaseAdmin.from('assessment_responses').delete().eq('application_id', app.id)
  await supabaseAdmin.from('privacy_consents').delete().eq('application_id', app.id)

  // Best-effort delete the video file from Storage. Path is the part after /video/ in the URL.
  if (app.video_url) {
    const videoPath = extractStoragePath(app.video_url, 'video')
    if (videoPath) {
      try { await supabaseAdmin.storage.from('video').remove([videoPath]) } catch { /* ignore */ }
    }
  }

  // Reset the row
  const update: Record<string, unknown> = {
    status: 'pending',
    video_url: null,
    started_at: null,
    completed_at: null,
    fit_score: null,
    recommendation: null,
    score_data: null,
    report_html: null,
    comprehensive_html: null,
    comprehensive_generated_at: null,
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
  }
  if (wipeCv) {
    if (app.cv_url) {
      const cvPath = extractStoragePath(app.cv_url, 'cv')
      if (cvPath) {
        try { await supabaseAdmin.storage.from('cv').remove([cvPath]) } catch { /* ignore */ }
      }
    }
    update.cv_url = null
    update.cv_text = null
  }

  const { error: upErr } = await supabaseAdmin.from('applications').update(update).eq('id', app.id)
  if (upErr) {
    console.error('Reset interview update failed', upErr)
    return NextResponse.json({ error: 'Failed to reset application' }, { status: 500 })
  }

  logAudit({
    action: 'application.reset',
    actorType: 'admin',
    resourceType: 'application',
    resourceId: app.id,
    details: { wipe_cv: wipeCv },
  })

  return NextResponse.json({ ok: true, wipe_cv: wipeCv })
}

// Extract the Supabase Storage object path from a public URL.
// URL pattern: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return decodeURIComponent(url.slice(i + marker.length))
}

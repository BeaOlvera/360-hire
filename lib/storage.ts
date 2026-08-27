import { supabaseAdmin } from '@/lib/supabase'

/**
 * Private-storage helpers for candidate files (CVs and interview recordings).
 *
 * These objects are personal data of job candidates. CVs carry identity,
 * contact and employment history; recordings carry face and voice. Neither
 * may be served from a public bucket.
 *
 * Historic rows stored a public URL in applications.cv_url / video_url.
 * Newer rows store the bare object path. Both shapes are accepted here so the
 * change needs no data migration, and both are served through a short-lived
 * signed URL.
 *
 * NOTE: the Supabase buckets 'cv' and 'video' must be set to PRIVATE in the
 * Supabase dashboard. Signed URLs work either way; only turning the buckets
 * private actually closes the exposure.
 */

export type CandidateBucket = 'cv' | 'video'

/** Sentinel written when a candidate skips the CV step. Never a real object. */
const SKIPPED = 'SKIPPED'

/**
 * Normalise whatever is stored in the column to a Storage object path.
 * Returns null for the SKIPPED sentinel, empty values, or unparseable URLs.
 */
export function toObjectPath(stored: string | null | undefined, bucket: CandidateBucket): string | null {
  if (!stored || stored === SKIPPED) return null

  // Legacy public URL: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const publicMarker = `/storage/v1/object/public/${bucket}/`
  const pi = stored.indexOf(publicMarker)
  if (pi !== -1) return decodeURIComponent(stored.slice(pi + publicMarker.length))

  // Already-signed URL: .../storage/v1/object/sign/<bucket>/<path>?token=...
  const signMarker = `/storage/v1/object/sign/${bucket}/`
  const si = stored.indexOf(signMarker)
  if (si !== -1) return decodeURIComponent(stored.slice(si + signMarker.length).split('?')[0])

  // Anything else that still looks like a URL is not ours.
  if (/^https?:\/\//i.test(stored)) return null

  return stored.replace(/^\/+/, '')
}

/**
 * Mint a short-lived signed URL for a candidate file.
 * Default TTL is 15 minutes, which is long enough to open a CV or start a
 * recording and short enough that a copied link dies quickly.
 */
export async function signedUrl(
  stored: string | null | undefined,
  bucket: CandidateBucket,
  expiresInSeconds = 900,
): Promise<string | null> {
  const path = toObjectPath(stored, bucket)
  if (!path) return null

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data?.signedUrl) {
    console.error(`Failed to sign ${bucket} object "${path}":`, error?.message)
    return null
  }
  return data.signedUrl
}

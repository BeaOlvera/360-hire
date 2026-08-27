import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE = 'admin_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * Session token format: "<expiry-unix-seconds>.<hex HMAC-SHA256>".
 * The HMAC is computed over "admin-session:<expiry>" with a server-side secret,
 * so a token cannot be forged without the secret and cannot be extended after issue.
 *
 * Secret: ADMIN_SESSION_SECRET, falling back to ADMIN_PASSWORD so a deployment that
 * has not yet set the dedicated secret still gets signed tokens (rotating the password
 * then also invalidates every session, which is the desired behaviour).
 *
 * middleware.ts verifies the same format with Web Crypto (edge runtime cannot import
 * node:crypto). Keep the two in sync if the format ever changes.
 */
function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (!secret) throw new Error('ADMIN_SESSION_SECRET or ADMIN_PASSWORD must be set')
  return secret
}

function sign(expiry: number): string {
  return createHmac('sha256', sessionSecret()).update(`admin-session:${expiry}`).digest('hex')
}

/** Mint a signed session token valid for maxAgeSeconds (default 7 days). */
export function createSessionToken(maxAgeSeconds: number = SESSION_MAX_AGE): string {
  const expiry = Math.floor(Date.now() / 1000) + maxAgeSeconds
  return `${expiry}.${sign(expiry)}`
}

/** Verify a session token: well-formed, signature valid, not expired. */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const expiry = Number(token.slice(0, dot))
  const sig = token.slice(dot + 1)
  if (!Number.isInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) return false
  const expected = sign(expiry)
  if (sig.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))
}

/**
 * Check admin auth in API routes. Returns a 401 NextResponse if not authenticated.
 * Returns null if authenticated (caller should proceed).
 */
export function checkAdminAuth(request: NextRequest): NextResponse | null {
  const cookie = request.cookies.get(SESSION_COOKIE)
  if (!verifySessionToken(cookie?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * Check admin auth in Server Components (uses next/headers).
 * Returns true if authenticated.
 */
export function isAdminAuthenticated(): boolean {
  const cookieStore = cookies()
  const cookie = cookieStore.get(SESSION_COOKIE)
  return verifySessionToken(cookie?.value)
}

import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/admin/dashboard', '/admin/jobs', '/admin/applications', '/admin/candidates', '/admin/samples']

/**
 * Edge-runtime verification of the admin session token issued by lib/auth.ts
 * (format "<expiry>.<hex HMAC-SHA256 over 'admin-session:<expiry>'>").
 * Web Crypto is used here because middleware cannot import node:crypto.
 */
async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const expiry = Number(token.slice(0, dot))
  const sig = token.slice(dot + 1)
  if (!Number.isInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) return false

  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (!secret) return false

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`admin-session:${expiry}`))
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (sig.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const session = request.cookies.get('admin_session')
  if (!(await verifySessionToken(session?.value))) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/jobs/:path*', '/admin/applications/:path*', '/admin/candidates/:path*', '/admin/samples/:path*'],
}

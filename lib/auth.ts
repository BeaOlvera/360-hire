import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'admin_session'
const SESSION_VALUE = 'authenticated'

/**
 * Check admin auth in API routes. Returns a 401 NextResponse if not authenticated.
 * Returns null if authenticated (caller should proceed).
 */
export function checkAdminAuth(request: NextRequest): NextResponse | null {
  const cookie = request.cookies.get(SESSION_COOKIE)
  if (!cookie || cookie.value !== SESSION_VALUE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * Check admin auth in Server Components (uses next/headers).
 */
export function isAdminAuthenticated(): boolean {
  const cookieStore = cookies()
  const cookie = cookieStore.get(SESSION_COOKIE)
  return cookie?.value === SESSION_VALUE
}

import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/admin/dashboard', '/admin/jobs', '/admin/applications', '/admin/candidates', '/admin/samples']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const session = request.cookies.get('admin_session')
  if (!session || session.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/jobs/:path*', '/admin/applications/:path*', '/admin/candidates/:path*', '/admin/samples/:path*'],
}

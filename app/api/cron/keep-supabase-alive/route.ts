import { NextRequest, NextResponse } from 'next/server'

/**
 * Vercel Cron — pings the Free-tier Supabase projects so they don't get
 * auto-paused after 7 days of inactivity.
 *
 * Schedule lives in vercel.json: every 5 days at 09:00 UTC.
 *
 * Endpoints chosen on purpose:
 *  - /auth/v1/health is public and unauthenticated, returns 200, forces the
 *    GoTrue service in the project to respond.
 *  - /rest/v1/ requires the anon key. The dev project's anon key is committed
 *    here because anon keys are PUBLIC by design (Supabase puts them in
 *    browser JavaScript; row-level security on the database does the real
 *    protection). Climate-app has no anon key in this repo, so we only hit
 *    /auth/v1/health for that one — still enough to reset the inactivity
 *    timer.
 */

type Target = {
  name: string
  ref: string
  anonKey?: string
}

const TARGETS: Target[] = [
  {
    name: 'climate-app',
    ref: 'kaoiruwvmbjnycykwtlo',
  },
  {
    name: 'dev-360-hire',
    ref: 'lrkxauqllvvprwfjktap',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya3hhdXFsbHZ2cHJ3ZmprdGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTE1NDEsImV4cCI6MjA5NDg2NzU0MX0.f6uOXolQnoRBrpfogOH3lfgDmz8QyUFn4KdMNuYo_aM',
  },
]

async function pingOne(t: Target) {
  const base = `https://${t.ref}.supabase.co`
  const results: Array<{ url: string; ok: boolean; status: number }> = []

  // 1) Public health endpoint — works without any key, returns 200.
  try {
    const r = await fetch(`${base}/auth/v1/health`, { cache: 'no-store' })
    results.push({ url: '/auth/v1/health', ok: r.ok, status: r.status })
  } catch {
    results.push({ url: '/auth/v1/health', ok: false, status: 0 })
  }

  // 2) PostgREST root — only if we have the anon key. Forces a DB connection.
  if (t.anonKey) {
    try {
      const r = await fetch(`${base}/rest/v1/`, {
        headers: { apikey: t.anonKey, Authorization: `Bearer ${t.anonKey}` },
        cache: 'no-store',
      })
      results.push({ url: '/rest/v1/', ok: r.ok, status: r.status })
    } catch {
      results.push({ url: '/rest/v1/', ok: false, status: 0 })
    }
  }

  return { name: t.name, ref: t.ref, results }
}

export async function GET(request: NextRequest) {
  // Vercel Cron sets this header on scheduled invocations. We allow both
  // cron-triggered runs and manual GETs (handy for "Run now" testing).
  const isCron = request.headers.get('x-vercel-cron') === '1'

  const summary = await Promise.all(TARGETS.map(pingOne))

  return NextResponse.json({
    ok: true,
    triggered_by: isCron ? 'cron' : 'manual',
    at: new Date().toISOString(),
    targets: summary,
  })
}

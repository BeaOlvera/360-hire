import { NextRequest, NextResponse } from 'next/server'

/**
 * Vercel Cron — pings the Free-tier Supabase projects so they don't get
 * auto-paused after 7 days of inactivity. Schedule is in vercel.json.
 *
 * Each ping hits /auth/v1/health on the project with the anon key header.
 * That endpoint requires apikey (verified by experiment 2026-05-30) and
 * returns 200 with the GoTrue banner when the project is awake.
 *
 *   - dev-360-hire: anon key is committed below. Anon keys are PUBLIC by
 *     design (Supabase puts them in browser JavaScript; row-level security
 *     on the database does the real protection).
 *   - climate-app: anon key is NOT in this repo because the climate app only
 *     ever used the server-side service-role key. It must be set as a Vercel
 *     env var: SUPABASE_CLIMATE_ANON_KEY. Without it, climate is skipped and
 *     the response notes "missing-env-var".
 */

const DEV_360_HIRE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya3hhdXFsbHZ2cHJ3ZmprdGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTE1NDEsImV4cCI6MjA5NDg2NzU0MX0.f6uOXolQnoRBrpfogOH3lfgDmz8QyUFn4KdMNuYo_aM'

type Target = { name: string; ref: string; apikey: string | null }

function buildTargets(): Target[] {
  return [
    {
      name: 'climate-app',
      ref: 'kaoiruwvmbjnycykwtlo',
      apikey: process.env.SUPABASE_CLIMATE_ANON_KEY ?? null,
    },
    {
      name: 'dev-360-hire',
      ref: 'lrkxauqllvvprwfjktap',
      apikey: DEV_360_HIRE_ANON,
    },
  ]
}

async function pingOne(t: Target) {
  if (!t.apikey) {
    return { name: t.name, ref: t.ref, skipped: 'missing-env-var', status: null, ok: false }
  }
  try {
    const r = await fetch(`https://${t.ref}.supabase.co/auth/v1/health`, {
      headers: { apikey: t.apikey },
      cache: 'no-store',
    })
    return { name: t.name, ref: t.ref, status: r.status, ok: r.ok }
  } catch (err) {
    return { name: t.name, ref: t.ref, status: 0, ok: false, error: String(err) }
  }
}

export async function GET(request: NextRequest) {
  const isCron = request.headers.get('x-vercel-cron') === '1'
  const results = await Promise.all(buildTargets().map(pingOne))

  return NextResponse.json({
    ok: true,
    triggered_by: isCron ? 'cron' : 'manual',
    at: new Date().toISOString(),
    targets: results,
  })
}

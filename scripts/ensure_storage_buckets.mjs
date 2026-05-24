// One-time setup: create the 'cv' and 'video' storage buckets in Supabase (public-read).
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

for (const name of ['cv', 'video']) {
  const { data: existing } = await supabase.storage.getBucket(name)
  if (existing) {
    console.log(`bucket "${name}" already exists (public=${existing.public})`)
    if (!existing.public) {
      const { error } = await supabase.storage.updateBucket(name, { public: true })
      console.log(`  updated to public: ${error ? error.message : 'ok'}`)
    }
    continue
  }
  const { error } = await supabase.storage.createBucket(name, {
    public: true,
    fileSizeLimit: name === 'video' ? 50 * 1024 * 1024 : 15 * 1024 * 1024,
  })
  console.log(`created "${name}":`, error ? error.message : 'ok')
}

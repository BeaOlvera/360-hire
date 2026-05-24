// Run a migration file directly against Supabase Postgres via pg client.
// Usage: node scripts/run_migration.mjs supabase/migrations/004_phase6.sql
import { readFileSync } from 'node:fs'
import pg from 'pg'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const supabaseHost = (() => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const m = url.match(/https?:\/\/([^/]+)/)
  if (!m) throw new Error('Cannot parse NEXT_PUBLIC_SUPABASE_URL')
  return m[1] // e.g. zoyeryxisueycvmaygtk.supabase.co
})()
const projectRef = supabaseHost.split('.')[0]

// Try both pooler (recommended) and direct connection
const dbPassword = process.env.SUPABASE_DB_PASSWORD ?? process.argv[3]
if (!dbPassword) {
  console.error('Usage: SUPABASE_DB_PASSWORD=<password> node scripts/run_migration.mjs <sql-file>')
  console.error('  or:  node scripts/run_migration.mjs <sql-file> <password>')
  process.exit(1)
}

const sqlPath = process.argv[2]
if (!sqlPath) { console.error('Missing SQL file path'); process.exit(1) }
const sql = readFileSync(sqlPath, 'utf8')

// Connection candidates: direct connection first (port 5432), then pooler endpoints.
const targets = [
  { name: 'direct (db.<ref>.supabase.co:5432)', config: { host: `db.${projectRef}.supabase.co`, port: 5432, user: 'postgres', password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
  // Pooler regions we'll guess from environment cues
  { name: 'session pooler eu-central-1', config: { host: `aws-0-eu-central-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
  { name: 'transaction pooler eu-central-1', config: { host: `aws-0-eu-central-1.pooler.supabase.com`, port: 6543, user: `postgres.${projectRef}`, password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
  { name: 'session pooler eu-west-1', config: { host: `aws-0-eu-west-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
  { name: 'session pooler eu-west-2', config: { host: `aws-0-eu-west-2.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
  { name: 'session pooler us-east-1', config: { host: `aws-0-us-east-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
  { name: 'session pooler us-east-2', config: { host: `aws-0-us-east-2.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
  { name: 'session pooler us-west-1', config: { host: `aws-0-us-west-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
  { name: 'session pooler us-west-2', config: { host: `aws-0-us-west-2.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
  { name: 'session pooler ap-southeast-1', config: { host: `aws-0-ap-southeast-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: dbPassword, database: 'postgres', ssl: { rejectUnauthorized: false } } },
]

for (const t of targets) {
  console.log(`\n--- Trying ${t.name} ---`)
  const client = new pg.Client(t.config)
  try {
    await client.connect()
    console.log('  connected')
    console.log(`  executing ${sqlPath} (${sql.length} chars)`)
    await client.query(sql)
    console.log('  ✓ migration applied successfully')
    await client.end()
    process.exit(0)
  } catch (err) {
    console.log(`  failed: ${err.message}`)
    try { await client.end() } catch { /* ignore */ }
  }
}

console.error('\nAll connection attempts failed.')
process.exit(2)

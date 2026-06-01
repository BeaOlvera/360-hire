# Supabase projects & billing map

**Date:** 2026-05-30
**Trigger:** Invoice HEDVAE-00005 for $48.73 (Apr 30 – May 29, 2026).

## The 5 projects under the Pro org

| Project ref | What it is | Local path | Status after this session |
|---|---|---|---|
| `kaoiruwvmbjnycykwtlo` | **climate-app** | `C:\Users\bolve\climate_app` | Moved to Free org. Anon key cached in `.env.local`. Kept alive by Vercel Cron. |
| `lrkxauqllvvprwfjktap` | **dev-360-hire** (development env) | `C:\Users\bolve\dev_app` | Moved to Free org. Kept alive by Vercel Cron. |
| `soqskmmdkvbcardpvpak` | **360 Evaluate** (sibling product) | `C:\Users\bolve\360_app` | Stays on Pro. Actively used. |
| `vltvaxqbqmpslxarapzi` | **socialization-app** (Allen / TCU dissertation prototype) | `C:\Users\bolve\projects\socialization-app` | Stays on Pro by user choice (kept paying). |
| `zoyeryxisueycvmaygtk` | **360 Hire** (production) | `C:\Users\bolve\360_hire` | Stays on Pro. Actively used (this codebase). |

## Why the bill was $48.73

Pro Plan is $25/month + $10 of compute credit included. Each additional running project adds ~$10/month in Micro compute (24/7 container). The user had 5 projects running concurrently this billing cycle:

```
Compute Hours (Apr 30 – May 29):
  kaoiruwvmbjnycykwtlo (climate)        706h  $9.49
  lrkxauqllvvprwfjktap (dev)            225h  $3.02
  soqskmmdkvbcardpvpak (360 Evaluate)   710h  $9.54
  vltvaxqbqmpslxarapzi (socialization)  710h  $9.54
  zoyeryxisueycvmaygtk (360 Hire)       159h  $2.14
                              Subtotal: $33.73
                Pro credit applied:    -$10.00
                Net compute:            $23.73
                Pro Plan flat fee:      $25.00
                                       -------
                              Total:    $48.73
```

Egress, cached egress, and storage were $0 — well under Pro tier limits, which ARE shared org-wide.

## Why Pro doesn't cover all projects

Common confusion: Pro Plan's $25 covers org-wide *usage* quotas (8 GB DB, 250 GB egress, etc.) but not *compute*. Each project runs in its own dedicated PostgreSQL container 24/7 regardless of traffic. Supabase only includes $10 of compute (~one Micro project full-month). Beyond that, every additional project = ~$10/month.

## Pro plan has NO pause feature

Verified: when the user tried to pause a Pro project, Supabase told her "projects on a paid plan will always be running". The only ways to stop compute billing for a Pro project are:
1. **Delete** the project (irreversible)
2. **Transfer** the project to a Free org (reversible; project keeps data + ref + keys, just gets Free-tier limits)

## Free org constraints

- Max 2 projects per Free org
- Compute drops from Micro to Nano (slower)
- Auto-pauses after 7 days of inactivity (HTTP traffic to the project resets the timer)
- 500 MB DB, 1 GB storage caps
- No Point-in-time recovery, no Branches, no Read replicas

## Expected new bill

After moving climate + dev to Free, the next invoice should be approximately:

- $25 Pro Plan flat
- ~$0 compute for 360 Hire (low usage covered by the $10 credit)
- ~$10 compute for 360 Evaluate (24/7)
- ~$10 compute for socialization (24/7)
- **Net: ~$35-45/month** (down from $48.73 but not as dramatic as I first estimated, because socialization is being kept on Pro)

If she ever decides to also drop socialization to Free, the bill would fall to ~$25-30.

## Anon keys (public by design — committed to git)

```
DEV 360 HIRE (lrkxauqllvvprwfjktap):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya3hhdXFsbHZ2cHJ3ZmprdGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTE1NDEsImV4cCI6MjA5NDg2NzU0MX0.f6uOXolQnoRBrpfogOH3lfgDmz8QyUFn4KdMNuYo_aM

CLIMATE APP (kaoiruwvmbjnycykwtlo):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb2lydXd2bWJqbnljeWt3dGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTk3ODAsImV4cCI6MjA5MzEzNTc4MH0.iJsqyxWTN5GZkvkeokvdzzCRtwmTZJZcLZuYWKFDQYk
```

Both committed to `app/api/cron/keep-supabase-alive/route.ts`. Anon keys are JWT tokens with `role: anon` — safe to embed in client code because RLS on the database is the real protection layer. Supabase explicitly designs them to be public.

## Endpoint shape verified

- `/auth/v1/health` requires `apikey` header (will return 401 without it)
- It rejects `Authorization: Bearer` paired with an anon JWT
- Correct ping: `curl -H "apikey: <anon>" https://<ref>.supabase.co/auth/v1/health` → returns GoTrue banner JSON, HTTP 200, and forces the project's services to respond (resets the autopause counter)
- `/rest/v1/` root with anon key returns 401 ("Only service_role can be used for this endpoint") — abandoned this path

## Failed paths

1. **GitHub Actions workflow** — first attempt. Rejected by git push because the user's PAT lacks the `workflow` scope. Could have been fixed by updating the PAT, but Vercel Cron is cleaner anyway.
2. **Authorization: Bearer header** — first attempt at the ping. Supabase rejects with 401 when the anon key is passed both as `apikey` and `Authorization: Bearer`. Use only `apikey`.
3. **Auth health endpoint unauthenticated** — initial assumption that `/auth/v1/health` was unauthenticated. Verified by curl that it requires `apikey`. Without it: `{"message":"No API key found in request"}` HTTP 401.

## Open

- Climate's `SUPABASE_CLIMATE_ANON_KEY` env var on Vercel is no longer used (route reads from a hardcoded constant). User can delete it for tidiness.
- If she later decides to move socialization to Free too, she'd need a second Free org (Free orgs cap at 2 projects). She's at the cap already with climate + dev.

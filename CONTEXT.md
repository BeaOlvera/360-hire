# 360 Hire

**Last updated:** 2026-08-27
**Status:** Live on Vercel at https://360-hire.vercel.app from `main` at `6b7febb` (deployed 2026-08-27: private storage with signed URLs, signed admin session cookie, compliance pack). **Never used with a real candidate** — the database holds only test data from the May–June 2026 partner-testing rounds (6 test candidates, 12 test applications). Storage buckets emptied and set private on 2026-08-27.

## Current understanding
360 Hire is the candidate-assessment sibling of 360 Evaluate (`C:\Users\bolve\360_app`). External candidates apply for a job (or take a generic developmental evaluation), walk through a structured AI-led assessment pipeline, and the admin sees a synthesised report.

Stack: Next.js 14 App Router + TypeScript, separate Supabase project (`zoyeryxisueycvmaygtk`), Anthropic Claude (sonnet-4-6 for chat + fit scoring + comprehensive synthesis; haiku-4-5 for CV + JD extraction), OpenAI Whisper for live STT, browser SpeechSynthesis for AI voice, Supabase Storage for CV + video uploads, puppeteer-core + @sparticuz/chromium for fit-report PDF, Resend (`Zephyron Consulting <hire@zephyronconsulting.com>`). Brand monochrome. Spanish text must use full accents and ¿ ¡.

**Candidate flow**: invite email -> `/apply/[token]` -> privacy gate (EN/ES) -> CV upload (PDF auto-extracted; Skip always available) -> overview -> enabled assessments in registry order -> in-depth interview chat with voice I/O and continuous video recording (snapshot-upload every 60 s) -> /complete. Seven complementary assessments, each independently selectable per candidate: Thinking Style, Growth Orientation, Career Values, Culture Fit (OCAI), Big Five (IPIP), Reasoning (ICAR-style), Resilience. Per-invitation overrides (`assessments_override`, `competencies_override` JSONB on applications, migration 007) are honoured across apply page, chat, assessment submission and synthesis. Competency dictionary in `lib/competency_dictionary.ts`. Protected-characteristics guardrail ported to the fit report (2026-06-15). Partner testing guide at `public/guia-socio.html` / `.pdf`.

**Admin flow**: `/admin` login -> dashboard -> jobs (PDF upload or manual + competency picker + always-visible OCAI editor + per-job assessment defaults) -> per-candidate customisation invite form; or candidates -> assign to job / start generic evaluation. Application review at `/admin/applications/[id]`: stats, video player, transcript, CV, per-assessment results, scoring panel, three exports (fit HTML, comprehensive HTML, fit PDF).

**Storage and auth (changed 2026-08-26/27):** the `cv` and `video` upload routes used to call `getPublicUrl()` on public buckets, so any CV or interview recording was reachable by URL without authentication. Uploads now store the object path and the admin view mints 15-minute signed URLs through `lib/storage.ts`; both buckets are private and were emptied of the 5 test objects. The admin session cookie, cloned from 360 Evaluate, was the forgeable constant "authenticated"; it is now an HMAC-SHA256 signed, 7-day expiring token (`lib/auth.ts`, `middleware.ts` with Web Crypto). `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are identical to 360 Evaluate's by the user's choice and are set in Vercel (Production; password also Preview). Handover note in `NEW_ADMIN_PASSWORD.txt` (gitignored).

**Compliance pack (`compliance/`, 13 documents + README, created 2026-08-26):** classified as EU AI Act Annex III point 4(a) (recruitment and selection). Verified during the review: no vision API anywhere, video is never sent to a model, audio enters only as Whisper text, so Art. 5(1)(f) emotion inference is not engaged; scoring is admin-triggered and returns a recommendation (`strong_hire`/`hire`/`maybe`/`no_hire`), no code path rejects or ranks out a candidate without a human, so GDPR Art. 22 is not engaged. Both facts are written up as design controls that must survive future features. The declaration of conformity (doc 08) is drafted and marked **do not sign** until the blocking items in the README close. Video retention period and the adverse-impact position on the ICAR reasoning instrument are decisions reserved for the user.

**Vercel Cron keep-alive**: `app/api/cron/keep-supabase-alive/route.ts` pings two Free-tier Supabase projects every 5 days (anon keys hardcoded; public by design).

**HARD CONSTRAINT**: no edits to `C:\Users\bolve\360_app` from this project.

## Active questions
1. Video retention period for candidate recordings (user decision; retention policy doc 11 has a placeholder).
2. Adverse-impact position on the ICAR reasoning instrument (user writes; nobody else should).
3. Blocking items listed in `compliance/README.md` before the DoC can be signed.
4. Migration 007 status in Supabase: believed applied (partner testing ran in June), not re-verified since.
5. Supabase Storage 50 MB video cap for longer interviews.
6. No PDF endpoint for the Comprehensive report (HTML only).
7. Per-candidate competency picker is subtractive only; backend already accepts arbitrary additions.

## Decisions made (latest first)
1. 2026-08-27: password and session secret identical to 360 Evaluate's (user chose simplicity over separation).
2. 2026-08-27: buckets private, test objects deleted; signed URLs are the only read path.
3. 2026-08-26: signed-URL storage design; compliance pack authored with an honest status table rather than a complete-looking one.
4. 2026-06-15: protected-characteristics guardrail in the fit report.
5. 2026-06-01: round-2 partner feedback fixes hardened via independent code review.
6. 2026-05-30: Vercel Cron keep-alive; anon keys hardcoded.
7. 2026-05-26: per-invite customise UI always lists all 7 questionnaires with "job default" badges.
8. 2026-05-25: per-invitation override columns (migration 007); generic-evaluation email; competency dictionary; OCAI editor always visible.
9. All assessment palettes monochrome; Spanish text with full accents.

## Approaches tried and abandoned
1. Mode toggle inside 360_app. Rejected.
2. Shared Supabase with 360 Evaluate. Rejected for v1.
3. Vercel Blob for CV/video. Replaced with Supabase Storage.
4. router.refresh() for gate transitions. Replaced with window.location.reload().
5. Per-invite picker limited to job-preconfigured assessments (2026-05-26). Abandoned after "no me deja elegir".
6. GitHub Actions keep-alive (2026-05-30): PAT lacked `workflow` scope. Vercel Cron instead.
7. Public storage buckets with `getPublicUrl()` (original design): replaced 2026-08-26/27.
8. Constant-string session cookie (original design): replaced 2026-08-27.

## Next steps
1. User: log in once with the new password after the deploy; delete `NEW_ADMIN_PASSWORD.txt` once stored in a password manager.
2. Before the first real job posting: decide video retention (question 1), close the README blocking items, re-verify migration 007.
3. Optional: PDF for the Comprehensive report; additive competency picker; cache comprehensive HTML on the application row.

## Key files (most-relevant only)
- `lib/auth.ts`, `middleware.ts`, `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts` — signed session.
- `lib/storage.ts` — signed URL minting; `app/api/apply/[token]/{cv,video}/route.ts` store paths; `app/admin/applications/[id]/page.tsx` reads via signed URLs.
- `compliance/` — 01 DPIA, 02 privacy policy, 03 candidate notice, 04 instructions for use, 05 DPA, 06 sub-processors, 07 technical documentation, 08 DoC (do not sign), 09 risk management, 10 records of processing, 11 retention, 12 incident response, 13 client deployment guide, README (status table).
- `lib/prompts.ts`, `lib/score_fit.ts`, `lib/generate_report.ts`, `lib/generate_comprehensive_report.ts`, `lib/assessments/*.ts`, `lib/competency_dictionary.ts`.
- `app/admin/jobs/[id]/{page,InviteCandidate}.tsx`, `app/admin/candidates/[id]/{page,CandidateActions}.tsx`, `app/admin/jobs/new/NewJobForm.tsx`.
- `app/api/cron/keep-supabase-alive/route.ts`, `vercel.json`.
- `supabase/migrations/001..007`.
- `public/guia-socio.html` / `.pdf`.
- `.env.local` (gitignored), `NEW_ADMIN_PASSWORD.txt` (gitignored).
- CLAUDE.md, MEMORY_PROTOCOL.md, CONTEXT.md, LOG.md, notes/.

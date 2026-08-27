# 360 Hire

**Last updated:** 2026-05-30
**Status:** Live on Vercel at https://360-hire.vercel.app. Per-invitation customisation + competency dictionary + always-visible OCAI culture profile shipped. Generic-evaluation email rewritten. Vercel Cron now keeps the user's two Free-tier Supabase projects from auto-pausing. Migration 007 (application overrides) still pending on Supabase side.

## Current understanding
360 Hire is the candidate-assessment sibling of 360 Evaluate (`C:\Users\bolve\360_app`). External candidates apply for a job (or take a generic developmental evaluation), walk through a structured AI-led assessment pipeline, and the admin sees a synthesized report.

Stack: Next.js 14 App Router + TypeScript, separate Supabase project (`zoyeryxisueycvmaygtk`), Anthropic Claude (sonnet-4-6 for chat + fit scoring + comprehensive synthesis; haiku-4-5 for CV + JD text extraction), OpenAI Whisper for live STT, browser SpeechSynthesis for AI voice output, Supabase Storage for CV + video uploads, puppeteer-core + @sparticuz/chromium for fit-report PDF, Resend with verified domain zephyronconsulting.com (sender: `Zephyron Consulting <hire@zephyronconsulting.com>`). Brand monochrome. Spanish text must always use full accents and ¿ ¡.

**Candidate flow today**: invite email -> `/apply/[token]` -> privacy gate (EN/ES) -> CV upload (PDF auto-extracted; Skip button always available) -> Overview page explaining the journey -> enabled assessments in registry order -> in-depth interview chat with voice I/O AND continuous video recording (snapshot-upload every 60s so partial recordings survive tab close) -> /complete.

**Seven complementary assessments**, each independently selectable per candidate: Thinking Style, Growth Orientation, Career Values, Culture Fit (OCAI), Big Five (IPIP), Reasoning ICAR-style, Resilience. EN+ES, monochrome palette, standalone printable HTML reports.

**Per-invitation customisation**: admin can tick a "Customise for this candidate" box in either invite form (job page or candidate page) and pick exactly which of the 7 questionnaires to send. Picker always shows all 7 with "job default" badges on the ones the job had preconfigured — admin can add or remove freely. Competencies picker only shows when the job has competencies (subtractive only). Backend stores `assessments_override` + `competencies_override` JSONB on the application; apply page, chat route, assessment submission, and comprehensive synthesis all honour the override when set.

**Competency dictionary**: lib/competency_dictionary.ts holds the user's 10-competency vocabulary from the sibling 360 Evaluate codebase. NewJobForm has a "+ Pick from library" button that opens a 2-col grid; each addition carries the competency name + behaviours.

**Company-culture OCAI editor** is always rendered during job creation regardless of whether Culture Fit is enabled.

**In-depth interview**: 5-phase prompt (rapport, frame, past, present competency deep-dive via Critical Incident Technique, future + motivation), per-job admin-defined competencies with Critical / Important / Relevant weights, anti-fabrication safeguards, completion code x7y8, moderation code 5j3k. Generic mode (no job) uses a career-discovery prompt.

**Email**: hire@zephyronconsulting.com. Job invites use job-specific subject + body. Generic-evaluation invites use a generic subject ("Invitation to a professional assessment" / "Invitación a una evaluación profesional") and body explaining "we will match you to projects and opportunities" rather than naming a role.

**Admin flow**: /admin login -> /admin/dashboard -> /admin/jobs/new (PDF upload OR manual + competency library picker + always-visible culture editor + per-job assessment defaults) -> ficha del puesto with per-candidate customisation invite form. Alternative: /admin/candidates -> create candidate -> "Assign to job" (with override) OR "Start generic evaluation" (also with override picker, all 7 selectable).

**Application review** at /admin/applications/[id]: stats, video player (partial recordings flagged), full transcript, CV download with extracted text, per-assessment results card with Open report link, ScoringPanel, breadcrumb (All jobs · Job · Candidate profile). Three exports: Fit report (HTML), Comprehensive report (HTML), Fit PDF (puppeteer A4).

**Comprehensive Report**: synthesises JD + competencies (override-aware) + CV + transcript + fit-scoring + all completed complementary assessments via one Claude sonnet-4-6 call. Renders to printable HTML with exec summary + recommendation up top, per-competency interview coding, cross-signal observations, assessments at-a-glance, suggested next steps, transcript appendix.

**Partner testing guide**: public/guia-socio.html (and a generated public/guia-socio.pdf) — Castilian-Spanish step-by-step guide aimed at a non-technical co-founder. Public URL: https://360-hire.vercel.app/guia-socio.html.

**Vercel Cron keep-alive (NEW this session)**: `app/api/cron/keep-supabase-alive/route.ts` pings the user's two Free-tier Supabase projects (`kaoiruwvmbjnycykwtlo` climate, `lrkxauqllvvprwfjktap` dev-360-hire) every 5 days at 09:00 UTC via Vercel Cron (config in vercel.json). Both anon keys are hardcoded in the route — they are PUBLIC by Supabase design. The ping hits `/auth/v1/health` with the apikey header, which forces the project's services to respond and resets the autopause counter. Verified working with HTTP 200 on both targets.

**HARD CONSTRAINT**: no edits to `C:\Users\bolve\360_app` from this project. Verified clean throughout.

## Active questions
1. **Migration 007 in Supabase**: STILL pending on the user side. Without it, the apply page 404s for every candidate because the SELECT references columns that don't exist yet. The DDL is:
   ```sql
   ALTER TABLE applications
     ADD COLUMN IF NOT EXISTS assessments_override JSONB,
     ADD COLUMN IF NOT EXISTS competencies_override JSONB;
   ```
2. Live end-to-end test of the per-invite override flow still pending; partner is about to walk through it using the guia-socio.pdf.
3. The competency picker still only allows subtractive choice per candidate — no UI yet to *add* arbitrary competencies. Backend already accepts it via competencies_override.
4. Supabase Storage 50 MB video cap remains for longer interviews.
5. No PDF endpoint for the Comprehensive report yet (HTML only).
6. User may want to delete the now-unused `SUPABASE_CLIMATE_ANON_KEY` from Vercel env vars (route uses hardcoded constant instead).

## Decisions made (latest first)
1. 2026-05-30: Vercel Cron approach for keep-alive (chosen over GitHub Actions because user's PAT lacked `workflow` scope and Vercel CLI wasn't available). Cron schedule `0 9 */5 * *` in vercel.json hitting `/api/cron/keep-supabase-alive`.
2. 2026-05-30: Both anon keys hardcoded in the keep-alive route file rather than read from env vars — Supabase anon keys are public by design and RLS on the DB is the real protection.
3. 2026-05-30: User keeps socialization-app on Pro and moves only climate + dev to a Free org (Free orgs cap at 2 projects, so this fills hers).
4. 2026-05-30: Diagnosed the Supabase invoice ($48.73): Pro plan covers ONE Micro project's compute via the $10 included credit; each additional project = ~$10/month. See notes/2026-05-30-supabase-projects-and-billing.md.
5. 2026-05-26: Per-invite customise UI always lists all 7 questionnaires (with "job default" badges) regardless of how the job was configured.
6. 2026-05-26: Generated partner-facing testing guide as HTML at public/guia-socio.html + PDF via Microsoft Edge `--headless --print-to-pdf` at public/guia-socio.pdf.
7. 2026-05-25: Per-invitation override columns on applications (assessments_override JSONB, competencies_override JSONB). Migration 007.
8. 2026-05-25: Generic-evaluation email rewritten; default sender hardcoded to "Zephyron Consulting <hire@zephyronconsulting.com>".
9. 2026-05-25: Competency dictionary (lib/competency_dictionary.ts) added with the user's own 10 competencies + behaviours from 360 Evaluate.
10. 2026-05-25: OCAI culture editor always renders during job creation.
11. 2026-05-25: Breadcrumb on /admin/applications/[id] replaces the broken back-link that 404'd on generic evals.
12. Spanish UI/AI text must use full accents and ¿ ¡ (user-level feedback memory).
13. All assessment palettes monochrome (4 shades of grey).

## Approaches tried and abandoned
1. Mode toggle inside 360_app. Rejected.
2. Shared Supabase. Rejected for v1.
3. Vercel Blob for CV/video. Replaced with Supabase Storage.
4. router.refresh() for gate transitions. Replaced with window.location.reload().
5. 2026-05-26 — Per-invite picker that only listed assessments the job had preconfigured. Abandoned after user reported "no me deja elegir".
6. 2026-05-26 — Subset-of-job-assessments validation. Dropped because it blocked the broaden-the-set case.
7. 2026-05-30 — **GitHub Actions workflow for keep-alive**. Push rejected because user's PAT lacks `workflow` scope. Switched to Vercel Cron.
8. 2026-05-30 — **Pausing projects on Pro plan**. Supabase doesn't allow pausing paid projects ("projects on a paid plan will always be running"). Solution: transfer to Free org instead.
9. 2026-05-30 — **Authorization: Bearer header alongside apikey** in keep-alive ping. Supabase rejects with 401. Use only `apikey` header.
10. 2026-05-30 — **Reading climate anon key from Vercel env var** (`SUPABASE_CLIMATE_ANON_KEY`). User added it to her local climate `.env.local` instead of Vercel; rather than wait for the manual Vercel step, hardcoded the anon key directly in the route (safe — anon keys are public).

## Next steps
1. **User runs migration 007** in Supabase SQL editor (otherwise candidate apply links 404).
2. End-to-end live test of the per-invite override flow with the partner using guia-socio.pdf.
3. Optional: remove the now-unused `SUPABASE_CLIMATE_ANON_KEY` env var from Vercel.
4. Optional: UI to add arbitrary competencies (not just subtract) per candidate.
5. Optional: PDF endpoint for the Comprehensive report.
6. Optional: cache comprehensive report HTML on applications row.

## Key files (most-relevant only)
- supabase/migrations/{001..006}.sql + **007_application_overrides.sql** (pending in Supabase).
- lib/competency_dictionary.ts (10 competencies + behaviours).
- lib/supabase.ts, lib/whisper.ts, lib/audit.ts, lib/auth.ts, lib/openai.ts, lib/email.ts, lib/pdf.ts.
- lib/prompts.ts (buildCandidatePrompt 5-phase, buildGenericPrompt).
- lib/score_fit.ts, lib/generate_report.ts, lib/generate_comprehensive_report.ts.
- lib/assessments/{types, index, thinking_style, growth_orientation, career_values, culture_fit, big_five, icar_reasoning, resilience}.ts.
- app/admin/jobs/[id]/{page, InviteCandidate}.tsx — per-invite override UI.
- app/admin/candidates/[id]/{page, CandidateActions}.tsx — per-invite override UI (also for generic evals).
- app/admin/jobs/new/NewJobForm.tsx — competency library picker + always-visible OCAI editor.
- app/api/admin/jobs/[id]/applications/route.ts, app/api/admin/candidates/[id]/evaluate/route.ts — override-aware POST.
- app/apply/[token]/page.tsx, app/api/apply/[token]/{chat, assessment}/route.ts, app/api/admin/applications/[id]/comprehensive/route.ts — all SELECT the override columns and apply them.
- **app/api/cron/keep-supabase-alive/route.ts** — Vercel Cron endpoint pinging Free-tier Supabase projects every 5 days. Anon keys hardcoded (public by design).
- vercel.json — function maxDuration map + crons array.
- public/guia-socio.html, public/guia-socio.pdf — partner-facing Castilian-Spanish testing guide.
- middleware.ts, next.config.js.
- .env.local (gitignored).
- CLAUDE.md, MEMORY_PROTOCOL.md, CONTEXT.md, LOG.md, notes/.
- notes/2026-05-30-supabase-projects-and-billing.md — Supabase project ID map + billing breakdown.

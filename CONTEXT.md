# 360 Hire

**Last updated:** 2026-05-24
**Status:** Feature-complete locally through Phase 6.6 + Comprehensive Report. Build green. CV + video upload now go through Supabase Storage (no Vercel Blob token needed). Voice input wired with OpenAI Whisper. 7 admin-selectable complementary assessments + an in-depth competency-based interview + a Comprehensive synthesis report. Migrations 005 (competencies) and 006 (extra assessment codes) must be applied in Supabase before testing the latest features.

## Current understanding
360 Hire is the candidate-assessment sibling of 360 Evaluate (`C:\Users\bolve\360_app`). External candidates apply for a job (or take a generic developmental evaluation), walk through a structured AI-led assessment pipeline, and the admin sees a synthesized report.

Stack: Next.js 14 App Router + TypeScript, separate Supabase project (`zoyeryxisueycvmaygtk`), Anthropic Claude (sonnet-4-6 for chat + fit scoring + comprehensive synthesis; haiku-4-5 for CV + JD text extraction), OpenAI Whisper for live STT, browser SpeechSynthesis for AI voice output, Supabase Storage for CV + video uploads (no Vercel Blob), puppeteer-core + @sparticuz/chromium for fit-report PDF, port 3003 locally. Brand `#0F3D3E` dark teal. Assessment results in a 4-shade monochrome palette.

**Candidate flow today**: invite email -> `/apply/[token]` -> privacy gate (EN/ES) -> CV upload (PDF auto-extracted to text via Anthropic; Skip button always available) -> Overview page explaining the journey -> enabled assessments in registry order -> in-depth interview chat with voice I/O AND continuous video recording (snapshot-upload every 60s so partial recordings survive tab close) -> /complete.

**Seven complementary assessments**, each admin-selectable per job, EN+ES, monochrome palette, standalone printable HTML reports:
- Thinking Style (4 quadrants, simplified Herrmann, 12 forced-choice, 2x2 grid)
- Growth Orientation (LLAS-derived 3 subscales, 18 Likert, CC BY)
- Career Values (Schein 8 anchors, original wording, 24 Likert, bar chart)
- Culture Fit (OCAI 4 quadrants, 6 dimensions x 100-point allocation, per-job company profile, radar overlay)
- Big Five Personality (IPIP public domain, 30 Likert, 6 per factor)
- Reasoning ICAR-style (12 multiple-choice across verbal / number / letter / logic, original items, right and wrong answers)
- Resilience (6 Likert items composed in the BRS framework, freshly written)

**In-depth interview**: 5-phase prompt (rapport, frame, past, present competency deep-dive via Critical Incident Technique, future + motivation), per-job admin-defined competencies with Critical / Important / Relevant weights, anti-fabrication safeguards, completion code x7y8, moderation code 5j3k. Generic mode (no job) uses a career-discovery prompt.

**Admin flow**: /admin login (admin123) -> /admin/dashboard (jobs list) -> /admin/jobs/new with JD-file-upload (PDF -> Anthropic extracts title/description/level/language/suggested_competencies, auto-fills) + competencies editor + assessments multi-select + per-job culture profile (when Culture Fit enabled). Or /admin/candidates -> create candidate decoupled from any job -> assign to job OR start generic evaluation.

**Application review** at /admin/applications/[id]: stats, video player (partial recordings flagged), full transcript, CV download with extracted text, per-assessment results card with Open report link, ScoringPanel. Generic evals show a job-picker for Convert to job fit. Three exports: Fit report (HTML), Comprehensive report (HTML synthesizing fit + interview + assessments), Fit PDF (puppeteer A4).

**Comprehensive Report** (GET /api/admin/applications/[id]/comprehensive): single Claude sonnet-4-6 call synthesizes JD + competencies, CV, transcript, existing fit-scoring result, and all completed complementary assessments. Returns a structured ComprehensiveResult rendered to a printable HTML page with executive summary + recommendation up top, then strengths/concerns, per-competency interview coding (evidence/gaps/assessment-signals/rating), cross-signal observations, assessments at-a-glance, suggested next steps, transcript appendix.

**HARD CONSTRAINT**: no edits to `C:\Users\bolve\360_app` from this project. Verified clean throughout.

## Active questions
1. Live end-to-end test of the FULL new pipeline (consent -> CV -> overview -> 7 assessments enabled -> in-depth interview -> comprehensive report) still pending; earlier e2e tests verified the original 3 assessments + interview.
2. Supabase Storage 50 MB cap means 30-45 min videos may exceed even at 250 kbps. Acceptable for short demos; needs plan upgrade or chunked upload for production.
3. Comprehensive report cost: one sonnet-4-6 call with full transcript + all signals = ~10-20K input + ~3-5K output tokens. ~$0.15-0.30 per report. Consider caching.
4. No PDF endpoint for the Comprehensive report yet (HTML only); existing PDF pipeline could be reused.
5. Convert-to-job-fit currently mutates applications.job_id. Future enhancement: keep generic, attach scored snapshots per job in a side table.
6. The IPIP items in Big Five are public domain. ICAR-style reasoning items are original. Resilience items were freshly composed in the BRS framework's spirit.

## Decisions made (latest first)
1. 2026-05-24: Comprehensive Report endpoint synthesizes everything via one Claude call; rendered HTML with exec summary + recommendation on top, per-competency interview coding, cross-signal observations, transcript appendix.
2. 2026-05-24: Phase 6.6 (convert generic to job fit): admin picks an open job, the application's job_id is set, then score_fit runs against that JD using the existing transcript+CV.
3. 2026-05-24: Big Five (IPIP public domain), ICAR-style reasoning (original items), Resilience (BRS-framework-inspired, original items).
4. 2026-05-24: Continuous video uploads as periodic snapshots every 60s; admin can view partial recordings; recording fits in 50 MB at 250 kbps / 480x360.
5. 2026-05-24: CV + video stored in Supabase Storage (buckets cv 15 MB, video 50 MB, public); removed Vercel Blob dependency.
6. 2026-05-24: OpenAI key copied from climate_app/.env.local so Whisper transcription works.
7. 2026-05-24: Voice input gracefully degrades if OPENAI_API_KEY missing on server.
8. 2026-05-24: CV upload always skippable.
9. 2026-05-24: Apply page has force-dynamic to bypass Next 14 segment cache.
10. 2026-05-24: window.location.reload() instead of router.refresh() for gate transitions.
11. 2026-05-24: Per-job competencies (name + 1/2/3 weight) feed the deep 5-phase interview prompt.
12. 2026-05-24: Auto-fill competencies from JD extraction when admin uploads a JD PDF.
13. 2026-05-24: Spanish UI/AI text must use full accents and ¿ ¡ (feedback memory at user level).
14. 2026-05-24: All assessment palettes monochrome (4 shades of grey).
15. 2026-05-24: Overview gate explains the journey before assessments.
16. Earlier decisions through Phase 5 are in LOG.md.

## Approaches tried and abandoned
1. Mode toggle inside 360_app. Rejected.
2. Shared Supabase. Rejected for v1.
3. Monorepo. Premature.
4. Phase 4 stored only report_html. Fixed with score_data JSONB.
5. Vercel Blob for CV/video. Replaced with Supabase Storage.
6. router.refresh() for gate transitions. Replaced with window.location.reload().
7. "Single final upload at completion" for video. Replaced with periodic 60s snapshot uploads.
8. Initial close paraphrase of BRS items for Resilience. Replaced with freshly composed items in the same framework.

## Next steps
1. User runs migrations 005 (jobs.competencies) and 006 (assessment_code CHECK extension) in Supabase.
2. End-to-end live test: create a fresh job with the new assessments enabled (Big Five, ICAR, Resilience) + competencies + culture profile -> invite -> walk -> verify Comprehensive report.
3. Optional: PDF endpoint for the Comprehensive report.
4. Optional: cache comprehensive report HTML on applications row to avoid re-paying for the LLM call.
5. Optional: feed assessment scores into score_fit prompt too (currently only used in comprehensive synthesis).
6. Deploy to Vercel + verify Resend domain.

## Key files (most-relevant only)
- supabase/migrations/{001..006}.sql.
- lib/supabase.ts, lib/whisper.ts, lib/audit.ts, lib/auth.ts, lib/openai.ts, lib/email.ts, lib/pdf.ts.
- lib/prompts.ts (buildCandidatePrompt 5-phase, buildGenericPrompt).
- lib/score_fit.ts, lib/generate_report.ts (original fit report).
- lib/generate_comprehensive_report.ts (Comprehensive synthesis + HTML).
- lib/assessments/{types, index, thinking_style, growth_orientation, career_values, culture_fit, big_five, icar_reasoning, resilience}.ts.
- app/admin/{page, AdminHeader, dashboard/page, jobs/new/{page, NewJobForm}, jobs/[id]/{page, InviteCandidate}, candidates/{page, new/{page, NewCandidateForm}, [id]/{page, CandidateActions}}, applications/[id]/{page, ScoringPanel}}.tsx.
- app/apply/[token]/{page, PrivacyGate, CVUpload, Overview, Assessment, CultureFitAssessment, InterviewChat, complete/page}.tsx.
- app/api/admin/{jobs, jobs/[id]/{,applications}, jobs/extract-from-file, candidates, candidates/[id]/evaluate, applications/[id]/{score, report, report.pdf, recommendation, assessment/[code], comprehensive}}/route.ts.
- app/api/apply/[token]/{,consent, cv, cv/skip, chat, transcribe, video, assessment, overview-seen}/route.ts.
- middleware.ts, next.config.js.
- scripts/{diagnose_consent, simulate_apply_page, e2e_test, e2e_admin, reset_application, test_cv_upload, test_transcribe, ensure_storage_buckets, enable_culture_fit, run_migration}.mjs.
- .env.local (gitignored).
- CLAUDE.md, MEMORY_PROTOCOL.md, CONTEXT.md, LOG.md, notes/.

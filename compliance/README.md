# 360 Hire — Compliance Folder

**Created:** 26 August 2026
**Provider:** Zephyron Consulting
**System:** 360 Hire — AI-Assisted Candidate Assessment Platform
**Classification:** High-risk, EU AI Act Annex III point 4(a) (recruitment and selection)

---

## Why this folder exists

The compliance review of 26 August 2026 found that 360 Hire had **no compliance documentation of any kind**, despite being the most clearly high-risk system in the Zephyron estate: it assesses external candidates, extracts and processes CVs, administers personality and reasoning instruments, records candidates on video, and produces a hiring recommendation.

The document set is now written. **The system is not yet conformant** — several findings require action rather than documentation, and those are listed below.

---

## Document status

| # | Document | Reference | Status |
|---|---|---|---|
| 01 | Data Protection Impact Assessment | DPIA-ZC-HIRE-2026-001 | ✅ Written |
| 02 | Privacy policy (Zephyron's own) | PP-ZC-HIRE-2026-001 | ✅ Written — needs publishing at `/privacy` |
| 03 | Candidate privacy notice (EN + ES template) | CPN-ZC-HIRE-2026-001 | ✅ Written — needs populating per client |
| 04 | **Instructions for Use** (AI Act Art. 13) | IFU-ZC-HIRE-2026-001 | ✅ Written |
| 05 | Data Processing Agreement template | DPA-ZC-HIRE-2026-001 | ✅ Written — needs counsel review |
| 06 | Sub-processor list | SPL-ZC-HIRE-2026-001 | ✅ Written |
| 07 | **AI Act Technical Documentation** (Annex IV) | AIATD-ZC-HIRE-2026-001 | ✅ Written |
| 08 | EU Declaration of Conformity | DOC-ZC-HIRE-2026-001 | ⚠️ **Draft — do not sign.** Blockers in its §11 |
| 09 | Risk management system (Art. 9) | RMS-ZC-HIRE-2026-001 | ✅ Written |
| 10 | Records of processing activities | ROPA-ZC-HIRE-2026-001 | ✅ Written |
| 11 | Data retention policy | DRP-ZC-HIRE-2026-001 | ⚠️ Schedule recommended — **awaiting your decision, then implementation** |
| 12 | Incident response plan | IRP-ZC-HIRE-2026-001 | ✅ Written |
| 13 | Client deployment guide | CDG-ZC-HIRE-2026-001 | ✅ Written |
| 14 | Deployer obligations | — | Covered by 04 §6 and 13. No separate document; candidates are not workers, so the Art. 26(7) worker-notification duty that drives the equivalent 360 Evaluate document does not apply here. |

---

## Actions, in order

### 1. Set the `cv` and `video` Supabase buckets to PRIVATE — critical

Until this is done, **candidate CVs and full interview recordings are reachable by anyone holding the URL, without authentication.**

The code was changed on 26 August 2026 to stop issuing public URLs (`lib/storage.ts`; upload routes store the object path; the admin view mints 15-minute signed URLs). That change is forward-looking only — historic rows still hold public URLs, and those objects stay reachable while the buckets are public.

1. Supabase dashboard → Storage → `cv` → Configuration → **Public off**
2. Repeat for `video`
3. Verify the admin view still plays a recording and opens a CV — both now go through signed URLs
4. Verify the exposure is closed: take a historic `applications.cv_url` value beginning with `https://` and confirm it fails in a logged-out browser
5. **Review Supabase access logs** and record the finding — see IRP §6, INC-2026-001. Whether this is a notifiable breach turns on whether anything was actually accessed, and that question must be answered either way rather than assumed.

### 2. Decide and implement video retention — high

No retention rule exists. Recommended schedule is in doc 11; the decision is yours as it is a business judgement. Implementation needs a `retention_until` timestamp and a Vercel Cron deletion job — the deletion primitive already exists in the reset route, and a Cron pattern already exists in this project.

### 3. Document the instruments — high

Technical Documentation §4.1, six items. **Item 5, the adverse-impact position on the ICAR-style reasoning instrument, is the one that matters** — a cognitive test in a hiring pipeline is the largest legal exposure in this system, in the EU and under Illinois strict liability. This is your own field.

### 4. Fix the session cookie — high

`admin_session` is set to the constant string `"authenticated"`. It is not signed and not derived from the password, so anyone who knows the value can forge it in devtools and bypass login entirely. Rotating the password does not mitigate this. Applies to 360 Evaluate as well.

### 5. Replace the shared admin password — high

`pswds.txt` in the project root indicates a shared credential across clients.

### 6. Define the Art. 86 explanation route — high

An unsuccessful candidate has a right to an explanation of the AI system's role. No route currently exists.

---

## Design controls that must be preserved

Two properties of the current build carry significant legal weight. Both are code-level facts, not policy statements, and both would be silently lost by a plausible future feature.

| Control | Why it matters | What would break it |
|---|---|---|
| **The video is never analysed by any model** | Keeps the system outside the Art. 5(1)(f) prohibition on emotion inference — a prohibited practice, penalties to €35M or 7% of turnover | Any "presence", "communication style" or engagement score derived from the recording or from vocal characteristics |
| **No candidate is rejected, filtered or ranked out without human action** | Keeps the system outside GDPR Art. 22 sole-automated-decision territory | Auto-advance, auto-reject, threshold cut-offs, or ranked shortlists produced without an administrator acting |

Treat any change touching these as a compliance decision requiring the technical file to be revised.

---

## Related

- `C:\Users\bolve\360_app\compliance` — 360 Evaluate, classified 4(b), 15 documents
- `C:\Users\bolve\dev_app\compliance` — Develop, out-of-scope classification note
- `C:\Users\bolve\us_market\compliance_map.html` — estate-wide map across EU, Spain and US law

---

*Last updated 26 August 2026.*

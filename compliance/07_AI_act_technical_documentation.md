# EU AI Act — Technical Documentation

**Annex IV Compliance Document**

| Field | Value |
|---|---|
| Document Reference | AIATD-ZC-HIRE-2026-001 |
| Version | 1.0 |
| Date | 26 August 2026 |
| Provider | Zephyron Consulting |
| AI System Name | 360 Hire — AI-Assisted Candidate Assessment Platform |
| Risk Classification | High-Risk (Annex III, point 4(a) — recruitment and selection of natural persons) |
| Sibling System | 360 Evaluate (AIATD-ZC-2026-001), classified under Annex III point 4(b). Separate system, separate file. |

---

## 1. General Description of the AI System

### 1.1 System Name and Identification

**360 Hire** — an AI-assisted candidate assessment platform. External candidates apply for a defined role, or take a generic developmental assessment, and progress through a structured pipeline that produces a synthesised report for the hiring organisation.

Deployed at `https://360-hire.vercel.app`. Codebase at `C:\Users\bolve\360_hire`.

### 1.2 Intended Purpose

The system is intended to assist hiring organisations and their advisers in assessing candidates. Specifically it:

1. **Extracts text from a candidate's CV** for use as interview context;
2. **Administers up to seven self-report instruments** selected per role or per candidate;
3. **Conducts an AI-led structured interview** across five phases, using the Critical Incident Technique against role competencies weighted Critical / Important / Relevant;
4. **Records the session** (audio and video) for human review;
5. **Produces a fit score** against the job's competency set;
6. **Produces a comprehensive synthesis** combining job description, competencies, CV, transcript, fit scoring and assessment results, ending in a recommendation of `strong_hire`, `hire`, `maybe` or `no_hire` with a rationale.

### 1.3 Intended Users (Deployers)

- Hiring organisations and their internal recruitment functions
- Management consultants and search professionals at Zephyron Consulting and its partners

The system is **not** intended for:

- Use by individuals without recruitment or assessment training
- Any automated pipeline that acts on outputs without human review
- Sole-basis decision-making on any candidate

### 1.4 Persons Affected

- **Candidates**: external applicants assessed by the system. The primary affected group.
- **Referees and third parties** incidentally named by a candidate during the interview.

### 1.5 Classification Rationale

The system is classified as **high-risk** under **Annex III, point 4(a)**: AI systems intended to be used for the recruitment or selection of natural persons, in particular to place targeted job advertisements, to analyse and filter job applications, and **to evaluate candidates**.

The system evaluates candidates. It analyses applications (CV text extraction), administers instruments, conducts assessment interviews and produces a hiring recommendation. It is squarely within 4(a).

**It does not place job advertisements.** Targeted advertising is a separate limb of 4(a) that this system does not engage.

**Applicable timeline.** Obligations for stand-alone Annex III high-risk systems apply from **2 December 2027**, following the Digital Omnibus on AI (published in the Official Journal 24 July 2026, in force 27 July 2026), which deferred them from the original date of 2 August 2026. The prohibitions in Art. 5, the AI literacy duty in Art. 4 and the transparency obligations in Art. 50 apply already, as does the GDPR in full.

---

## 2. Prohibited Practices Analysis (Article 5)

Because this system records candidates on video and audio and administers personality instruments, an explicit prohibited-practices analysis is recorded here. **This section is in force now**, not deferred to 2027.

### 2.1 Article 5(1)(f) — Emotion inference in the workplace

Article 5(1)(f) prohibits AI systems used to infer the emotions of a natural person in the areas of workplace and education institutions, except for medical or safety reasons. An "emotion recognition system" under Art. 3(39) infers emotions or intentions **on the basis of biometric data**.

**Finding: the prohibition is not engaged. The system performs no emotion inference of any kind.**

Verified by code review on 26 August 2026:

| Check | Result |
|---|---|
| Is the video recording sent to any model? | **No.** `app/api/apply/[token]/video/route.ts` writes the recording to Supabase Storage and updates `applications.video_url`. No model call. No vision API is used anywhere in the codebase. |
| Is the audio analysed for affect, prosody or tone? | **No.** Audio is transcribed to text by OpenAI Whisper. Only the resulting text enters the assessment pipeline. |
| Is any facial, gaze, micro-expression or body-language analysis performed? | **No.** No such library, model or code path exists. |
| Does any prompt instruct a model to infer emotional state from biometric signals? | **No.** |

**Two things that resemble emotion inference on a keyword search but are not:**

1. **The interview prompt asks "How did you feel in that moment?"** (`lib/prompts.ts`, Authenticity Safeguards §1, "Sensory & Emotional Anchoring"). This asks the candidate to *self-report a past emotion in words*, as a check on whether a recounted incident is genuine. It infers nothing from biometric data. Asking a person what they felt is not an emotion recognition system.
2. **The Big Five instrument scores a "Negative Emotionality" dimension** (`lib/assessments/big_five.ts`). This is a self-report trait scale in the IPIP tradition scored from the candidate's own questionnaire answers. It measures a disposition, not a momentary emotional state, and is derived from typed responses rather than biometric data.

**Control to maintain:** the video recording must remain a human-review artefact only. Introducing any analysis of the video or of vocal characteristics — including a "presence" or "communication style" score derived from the recording — would require re-running this analysis and would risk engaging the prohibition. This is a compliance decision, not a feature decision.

### 2.2 Other Article 5 limbs

| Limb | Engaged? |
|---|---|
| 5(1)(a)–(b) subliminal or exploitative manipulation | No |
| 5(1)(c) social scoring | No. Assessment is confined to the role applied for; no general-purpose social score is produced or reused across unrelated contexts. |
| 5(1)(d) individual criminal-offence risk prediction | No |
| 5(1)(e) untargeted facial-image scraping | No |
| 5(1)(g) biometric categorisation inferring protected attributes | No. No biometric processing occurs. |
| 5(1)(h) real-time remote biometric identification | No |

---

## 3. Hardware and Software

### 3.1 Infrastructure

| Component | Specification |
|---|---|
| Application runtime | Node.js 18+, Vercel serverless functions |
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL), project `zoyeryxisueycvmaygtk` |
| File storage | Supabase Storage, buckets `cv` and `video` — **private, served via short-lived signed URLs** (`lib/storage.ts`) |
| Email | Resend, verified domain `zephyronconsulting.com`, sender `hire@zephyronconsulting.com` |
| PDF generation | puppeteer-core with @sparticuz/chromium |

### 3.2 Models

| Purpose | Model | Provider |
|---|---|---|
| Interview conversation | `claude-sonnet-4-6` | Anthropic |
| Fit scoring against competencies | `claude-sonnet-4-6` | Anthropic |
| Comprehensive report synthesis | `claude-sonnet-4-6` | Anthropic |
| CV text extraction | `claude-haiku-4-5-20251001` | Anthropic |
| Job description text extraction | `claude-haiku-4-5-20251001` | Anthropic |
| Speech-to-text | `whisper-1` | OpenAI |
| Speech output | Browser `SpeechSynthesis` API | Local to candidate device — no transfer |

No model is trained or fine-tuned by Zephyron. All are used as general-purpose models under API terms that exclude training on customer data.

---

## 4. The Assessment Instruments

Seven instruments, each independently selectable per role or per candidate.

| Instrument | Construct | Source tradition |
|---|---|---|
| Thinking Style | Cognitive preference across four quadrants | Herrmann-style whole-brain model |
| Growth Orientation | Learning agility / growth mindset | Learning agility literature |
| Career Values | Career anchors | Schein career anchors |
| Culture Fit | Organisational culture preference vs the employer's own profile | OCAI (Cameron & Quinn) |
| Big Five | Five-factor personality | IPIP public-domain item pool |
| Reasoning | Fluid reasoning | ICAR-style public item set |
| Resilience | Stress recovery and adaptation | Resilience scales |

### 4.1 Validity documentation — an open obligation

**Article 10 requires data governance appropriate to the intended purpose. Article 15 requires a declared and appropriate level of accuracy.** For instruments used in selection, that means recording what evidence supports their use for this purpose.

These instruments are **public-domain or adapted versions**, not the validated commercial originals. IPIP items approximate but are not identical to the NEO-PI-R or BFI. ICAR-style items are drawn from an open item pool. OCAI and career-anchor adaptations here are shortened.

**Status: not yet documented.** The following must be recorded before the system is relied on for selection decisions in the EU:

| # | Item | Status |
|---|---|---|
| 1 | For each instrument: exact item set used, response format, scoring algorithm, and source | ☐ |
| 2 | Evidence supporting use of the construct for personnel selection, with citations | ☐ |
| 3 | Statement of what the adapted version does and does not inherit from the validated original | ☐ |
| 4 | Reliability evidence where available (internal consistency for the item set as used) | ☐ |
| 5 | **Adverse impact considerations.** Reasoning instruments in particular have a well-documented history of subgroup differences in selection contexts. Record the position taken and the reasoning. | ☐ |
| 6 | Accessibility and reasonable adjustment: how a candidate with a disability requests an alternative | ☐ |

Item 5 is the most consequential and should not be deferred. A cognitive reasoning instrument used in selection is the single most likely source of adverse impact in this system.

---

## 5. Data Flow

```
Candidate receives invitation email (Resend)
  → /apply/[token]
  → Privacy gate: consent recorded (EN/ES) before any processing
  → CV upload (optional, Skip always available)
      → PDF: text extracted by Haiku → applications.cv_text
      → File stored in private 'cv' bucket
  → Overview page explaining the journey
  → Enabled assessments, in registry order → assessment_results
  → AI-led interview (Sonnet), 5 phases
      → Voice input: audio → Whisper → text
      → Voice output: browser-local synthesis (no transfer)
      → Continuous video, snapshot-uploaded every 60s to private 'video' bucket
  → /complete

ADMIN, separately and manually:
  → Fit scoring (Sonnet), admin-triggered
  → Comprehensive report (Sonnet), admin-triggered
  → Human review → human sets status
```

### 5.1 Human oversight — the Article 22 GDPR position

**Verified by code review on 26 August 2026:**

| Control | Evidence |
|---|---|
| Scoring never runs automatically on completion | `app/api/admin/applications/[id]/score/route.ts` is an admin route requiring an authenticated administrator |
| Scoring is refused unless the application has reached a reviewable state | Same route, status guard |
| The model produces a *recommendation*, not a decision | `lib/generate_comprehensive_report.ts` returns `strong_hire` / `hire` / `maybe` / `no_hire` plus a rationale |
| Status transitions including `rejected` are set only by an administrator | `app/api/admin/applications/[id]/recommendation/route.ts` |
| No code path rejects, filters or ranks out a candidate without human action | Confirmed across `app/api` |

**Consequence:** the system does not perform a decision based solely on automated processing within the meaning of GDPR Art. 22(1). The recommendation is an input to a human decision.

**This is a design control that must be preserved.** Any future feature that auto-advances, auto-rejects, or ranks candidates into a cut-off list without human action would change this analysis and would require an Art. 22 lawful basis, plus safeguards under Art. 22(3).

---

## 6. Known Limitations

1. **The models are general-purpose.** They are not validated selection instruments. Their outputs are structured opinions, not measurements.
2. **Competency scoring rests on interview transcripts**, which reflect candidate self-presentation and verbal fluency. Fluency and assessed competence are correlated but distinct, and the gap is not neutral across candidates with different first languages or communication styles. The system operates in English and Spanish; candidates assessed in a second language are at a systematic disadvantage that the system does not correct for.
3. **CV extraction may fail or mis-extract**, particularly for non-PDF or unusually formatted documents. The Skip path exists and must remain available.
4. **No subgroup performance data exists yet.** Nothing has been measured about differential outcomes. See §4.1 item 5.
5. **Video capture is best-effort.** Supabase free-tier file limits mean long sessions may fail to upload; the candidate still completes. A missing recording must never be read as a candidate failure.
6. **Anti-fabrication safeguards are heuristic.** The authenticity probes in `lib/prompts.ts` raise the cost of fabricated answers; they do not detect deception, and no output should be characterised as a deception judgement.

---

## 7. Cybersecurity

| Control | Status |
|---|---|
| Candidate files in private buckets, short-lived signed URLs | Implemented 26 August 2026 (`lib/storage.ts`). **Requires the `cv` and `video` buckets to be set to private in the Supabase dashboard.** |
| Service-role database access confined to server code | Implemented |
| Token-scoped candidate access | Implemented |
| Audit logging of admin views of transcripts and recordings | Implemented (`lib/audit.ts`) |
| Admin authentication | Single shared password. **Inadequate for multi-client use — see open items.** |
| Row-level security policies | Not implemented; access control is enforced in application code |

---

## 8. Open Items

| # | Item | Severity |
|---|---|---|
| 1 | **Set the `cv` and `video` Supabase buckets to private.** The code now issues signed URLs, but until the buckets are private the historic public URLs remain reachable. | **Critical** |
| 2 | Rotate or invalidate historic public object URLs already issued | **Critical** |
| 3 | Complete the instrument validity documentation in §4.1, especially item 5 | High |
| 4 | Replace the single shared admin password with per-account authentication | High |
| 5 | Complete the remaining GDPR documents in this folder | High |
| 6 | Define the candidate-facing explanation route (AI Act Art. 86) | High |
| 7 | Confirm video retention period and implement automatic deletion | High |
| 8 | Register provider and system in the EU database (Art. 49) before 2 December 2027 | Medium, dated |
| 9 | Confirm the privacy gate discloses AI use in plain language in both EN and ES (Art. 50, in force) | High |

---

## Change Log

| Date | Change | Version |
|---|---|---|
| 26 August 2026 | Initial publication. Created following the compliance review of 26 August 2026, which found that 360 Hire had no compliance documentation despite being the most clearly high-risk system in the Zephyron estate. | 1.0 |

---

*End of document.*

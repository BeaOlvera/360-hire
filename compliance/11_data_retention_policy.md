# Data Retention Policy

**360 Hire — AI-Assisted Candidate Assessment Platform**

| Field | Value |
|---|---|
| Document Reference | DRP-ZC-HIRE-2026-001 |
| Version | 1.0 (**recommended schedule — awaiting deployer confirmation**) |
| Date | 26 August 2026 |
| Provider | Zephyron Consulting |
| Legal basis | GDPR Art. 5(1)(e) storage limitation; AI Act Art. 12 record-keeping |

---

## 1. The current position

**There is presently no retention rule and no deletion mechanism.** Candidate CVs, interview transcripts, audio, video recordings and assessment results are retained indefinitely from the moment they are created.

This is not sustainable. Art. 5(1)(e) requires personal data to be kept in a form permitting identification **no longer than is necessary** for the purposes of processing. A video recording of a candidate who was rejected eight months ago, held for no articulated purpose, has no defence.

This document sets out a recommended schedule. **It requires a decision from the deployer, who is the controller.** Once confirmed, deletion must be implemented rather than left as policy.

---

## 2. Recommended schedule

The competing pressures are real and pull in opposite directions: minimisation says delete quickly; the ability to defend a discrimination claim says keep the evidence. The schedule below resolves that by keeping the *assessment record* longer than the *raw media*.

| Data | Successful candidate | Unsuccessful candidate | Rationale |
|---|---|---|---|
| **Video recording** | 6 months from decision | **3 months from decision** | The most intrusive item and the least reusable. Its only purpose is human review during the decision. Once the decision is made it is a liability, not an asset. |
| **Audio** | Not separately retained | Not separately retained | Audio exists transiently for transcription. Confirm no copy persists. |
| Interview transcript | 24 months | **12 months** | The evidentiary record of what was actually said. This is what defends a challenged decision, and it is far less intrusive than video. |
| CV and extracted text | Duration of employment + statutory period | **12 months** | Employment history. Retain only as long as the recruitment record justifies. |
| Assessment item responses | 24 months | 12 months | Needed to explain a score if challenged. |
| Derived scores and fit report | 24 months | 12 months | The output that informed the decision. |
| Recommendation and rationale | 24 months | 12 months | Same. |
| Audit log entries | 24 months | 24 months | AI Act Art. 12 and Art. 26(6) minimum of six months; 24 aligns with discrimination limitation periods. |
| Identity and contact data | Duration of relationship | 12 months, or until objection | |

**Why 12 months as the general floor for unsuccessful candidates:** it covers the ordinary limitation period for bringing a discrimination claim in most Member States. Deployers should confirm the period in their own jurisdiction — in Spain, the ordinary period for a discrimination claim differs from the 20 working days for dismissal, and counsel should confirm.

**Why video is shorter than everything else:** it is the only item that captures the candidate's face. Nothing in a fair-process defence requires it that the transcript does not provide better.

---

## 3. Overrides

Retention is extended, and deletion suspended, where:

| Trigger | Effect |
|---|---|
| A complaint, claim or legal proceeding is live or reasonably anticipated | Suspend deletion for the affected candidate until resolved plus the appeal period |
| A regulatory investigation is under way (AESIA, AEPD, market surveillance, or a US state agency) | Suspend deletion for the affected scope |
| **California-based candidates or employees** | FEHA ADS regulations require retention of ADS inputs, outputs and settings for **four years**. This overrides the schedule above and is longer than any other rule here. |
| Colorado, from 1 January 2027 | ADMTA requires relevant records for at least three years |
| The candidate has requested erasure | Delete promptly unless an override above applies; record the reason if refused |

**Note the tension:** the California four-year rule and the minimisation principle point in opposite directions. Where a deployer assesses California-based candidates, the four-year rule governs for that population and the reason must be documented. Do not apply four years globally as a convenience — that converts a US compliance duty into an EU minimisation failure.

---

## 4. Talent pool retention

The "generic evaluation" path assesses candidates without a specific role, expressly so that they can be matched to future opportunities. That is a different purpose with a different retention logic.

| Requirement | Position |
|---|---|
| Basis | Retention beyond the immediate assessment requires the candidate to have been told, clearly, that their profile will be kept for future matching, and for how long |
| Maximum | 24 months, then delete or re-contact |
| Re-contact | At 24 months, ask whether the candidate wishes to remain in the pool. Silence means delete. |
| Right to object | Must be honoured immediately and be genuinely easy to exercise |
| Video | **Should not be retained in a talent pool at all.** Delete on the schedule in §2 regardless of pool membership. |

---

## 5. Implementation

Policy that is not implemented is not a control. The following must exist:

| # | Requirement | Status |
|---|---|---|
| 1 | A `retention_until` or equivalent timestamp on `applications`, set when the decision is recorded | ☐ Not implemented |
| 2 | A scheduled job (Vercel Cron) that deletes expired media from the `cv` and `video` buckets | ☐ Not implemented |
| 3 | The same job nulls the corresponding DB columns | ☐ Not implemented |
| 4 | Legal-hold flag that suspends deletion for a given application | ☐ Not implemented |
| 5 | Deletion events written to the audit log | ☐ Not implemented |
| 6 | A jurisdiction field so the California four-year override can be applied per candidate | ☐ Not implemented |

The existing reset route (`/api/admin/applications/[id]/reset`) already deletes storage objects and clears columns, so the deletion primitive exists. What is missing is the scheduler and the retention timestamp.

**Backlog note:** a Vercel Cron route already exists in this project (`/api/cron/keep-supabase-alive`), so the pattern and configuration are established.

---

## 6. Decision required

| Question | Recommendation | Deployer decision |
|---|---|---|
| Video retention, unsuccessful candidates | 3 months | |
| Video retention, successful candidates | 6 months | |
| Transcript retention, unsuccessful | 12 months | |
| Talent pool maximum | 24 months with re-contact | |
| Jurisdiction handling for California | Per-candidate override | |
| Who authorises a legal hold | Named person | |

---

## Change Log

| Date | Change | Version |
|---|---|---|
| 26 August 2026 | Initial publication. Created following the compliance review of 26 August 2026, which found no retention rule of any kind for candidate recordings. | 1.0 |

---

*End of document.*

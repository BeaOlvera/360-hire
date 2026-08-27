# Client Deployment Guide

**360 Hire — from signed contract to first candidate**

| Field | Value |
|---|---|
| Document Reference | CDG-ZC-HIRE-2026-001 |
| Version | 1.0 |
| Date | 26 August 2026 |
| Provider | Zephyron Consulting |
| Audience | Zephyron engagement leads and the client's project owner |

---

## 1. How to use this

Work through the phases in order. **Phase 0 must be complete before a single candidate is invited** — every item in it is either a legal precondition or a live security control.

The AI Act high-risk obligations do not bite until 2 December 2027, but the GDPR, the Art. 5 prohibitions and the Art. 50 transparency duty apply now. Nothing in this guide can wait for 2027.

---

## Phase 0 — Preconditions

### 0.1 Provider-side (Zephyron)

| # | Item | Owner | Done |
|---|---|---|---|
| 1 | `cv` and `video` Supabase buckets set to **private** | Provider | ☐ |
| 2 | Historic public object URLs verified dead | Provider | ☐ |
| 3 | Retention schedule agreed and deletion implemented (DRP) | Provider + client | ☐ |
| 4 | Admin credentials issued per person, not shared | Provider | ☐ |
| 5 | Instrument validity documentation complete (Tech Doc §4.1) | Provider | ☐ |
| 6 | Declaration of conformity signature blockers cleared | Provider | ☐ |

**Items 1, 2 and 4 are hard blockers.** Do not onboard a client while candidate files are publicly reachable or while credentials are shared.

### 0.2 Client-side

| # | Item | Owner | Done |
|---|---|---|---|
| 7 | Data Processing Agreement signed | Both | ☐ |
| 8 | Sub-processor list reviewed and accepted | Client | ☐ |
| 9 | DPIA completed or adopted (GDPR Art. 35) | Client | ☐ |
| 10 | FRIA completed where applicable (AI Act Art. 27) | Client | ☐ |
| 11 | Candidate privacy notice populated and published | Client | ☐ |
| 12 | Named human overseer assigned, with authority to override | Client | ☐ |
| 13 | Overseer has read Instructions for Use §§3, 4, 5 | Client | ☐ |
| 14 | Art. 86 explanation route defined and staffed | Client | ☐ |
| 15 | Retention periods chosen | Client | ☐ |
| 16 | **Non-EU candidates: local law reviewed** — see §5 | Both | ☐ |

---

## Phase 1 — Configuration

| Step | Guidance |
|---|---|
| Create the job | Upload the job description or enter manually. Competencies weighted Critical / Important / Relevant must reflect the actual role and be fixed **before** any candidate is assessed. |
| Choose instruments | **The fewest the role justifies.** Every instrument enabled is personal data you must be able to defend. The per-candidate picker exists to reduce the default set. |
| The reasoning instrument | Off unless the role genuinely requires it. Record the justification. This is the highest adverse-impact risk in the system. |
| Video | Decide deliberately. The transcript carries the assessment evidence; the recording mainly adds visibility of the candidate's appearance. Ask whether you need it for this role. |
| Culture profile | Complete the employer's OCAI profile if Culture Fit is enabled. |
| Language | Both EN and ES must be offered to the candidate. Do not default to the employer's language. |

---

## Phase 2 — Pilot

Run **two or three candidates** before opening the pipeline.

| Check | What good looks like |
|---|---|
| Privacy gate | Appears before any data is collected; video disclosed above the fold; reads as information, not as a consent tick |
| Art. 50 disclosure | The candidate is told at the start of the interview that they are talking to an AI |
| Interview quality | Probes the competencies you actually set; reaches the depth you need |
| Transcript vs report | Read both. Every claim in the report should be traceable to something the candidate said. **If it is not, stop and tell the provider.** |
| Recording | Uploads and plays through a signed URL; expires after 15 minutes |
| Spanish path | Full accents and inverted punctuation intact throughout |
| Override | The overseer can reach a different conclusion and record it |

---

## Phase 3 — Live

| Practice | Why |
|---|---|
| Review the transcript before the recommendation | Forms your own view first; the core defence against automation bias (Art. 14(4)(b)) |
| Track the override rate | A rate near zero across many candidates means oversight has become nominal |
| Record the reason for every decision | This is what defends the decision later, not the system's output |
| Never auto-advance or auto-reject | Would change the legal classification (GDPR Art. 22). No configuration option does this; do not build one around it. |
| Watch for scope creep | Assessment for one role must not be reused for another without fresh basis and notice |

---

## Phase 4 — Ongoing

| Frequency | Activity |
|---|---|
| Each cycle | Confirm retention deletion ran; confirm instrument selection still matches the role |
| Quarterly | Review override rates and any candidate complaints |
| Annually | Review the DPIA and FRIA; re-read the Instructions for Use; confirm the sub-processor list is current |
| On change | Provider notifies before changing models, instruments, scoring, oversight design or sub-processors |

---

## 5. Candidates outside the EU

The AI Act and GDPR follow the processing, but they are not the only rules. Where candidates are assessed in the United States, these apply **now**:

| Rule | In force | Effect |
|---|---|---|
| **Illinois HB 3773** | 1 Jan 2026 | Notice required when AI is used in recruitment or hiring. **Strict liability for discriminatory effect — intent is no defence.** Zip codes may not be used as a proxy for protected class. |
| **California FEHA ADS regulations** | 1 Oct 2025 | Unlawful to use a discriminatory automated decision system. **Four-year retention of ADS inputs, outputs and settings.** Anti-bias testing is expressly weighed in any claim. |
| **NYC Local Law 144** | 5 Jul 2023 | **Annual independent bias audit, published publicly**, plus ten business days' notice — where the candidate **resides in NYC**, regardless of office location. |
| **Colorado ADMTA** | 1 Jan 2027 | Notice, structured adverse-action and human-review process, three-year records |

These bind the **employer**, not the vendor. But NYC LL144 in particular requires a published bias audit *before* the tool is used on a covered candidate — which means it must be planned into the engagement, not discovered afterwards.

**Ask early: where do the candidates live?** For a Spanish or LatAm group hiring into the US, this question changes the engagement shape.

---

## 6. What the client receives

| Document | Reference |
|---|---|
| Instructions for Use | IFU-ZC-HIRE-2026-001 |
| Technical Documentation | AIATD-ZC-HIRE-2026-001 |
| DPIA | DPIA-ZC-HIRE-2026-001 |
| Candidate privacy notice template (EN/ES) | CPN-ZC-HIRE-2026-001 |
| Sub-processor list | SPL-ZC-HIRE-2026-001 |
| Data retention policy | DRP-ZC-HIRE-2026-001 |
| Incident response plan | IRP-ZC-HIRE-2026-001 |
| Data Processing Agreement | DPA-ZC-HIRE-2026-001 |
| Declaration of conformity | DOC-ZC-HIRE-2026-001 — **not yet signed** |

---

## Change Log

| Date | Change | Version |
|---|---|---|
| 26 August 2026 | Initial publication. | 1.0 |

---

*End of document.*

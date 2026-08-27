# Records of Processing Activities

**360 Hire — processor record pursuant to GDPR Art. 30(2)**

| Field | Value |
|---|---|
| Document Reference | ROPA-ZC-HIRE-2026-001 |
| Version | 1.0 |
| Date | 26 August 2026 |
| Processor | Zephyron Consulting |
| Contact | bolvera.arias8@gmail.com |

This is the **processor's** record. Each controller maintains its own record under Art. 30(1).

---

## 1. Processor and controllers

| Field | Value |
|---|---|
| Processor | Zephyron Consulting |
| Controllers | Each client hiring organisation, listed in the controller register maintained alongside signed DPAs |
| Sub-processors | See SPL-ZC-HIRE-2026-001 |
| DPO | Not appointed. **Assess whether Art. 37(1)(b) is triggered** — regular and systematic monitoring of data subjects on a large scale — as the client base grows. |

---

## 2. Processing activities

### PA-1 — Candidate invitation and access

| Field | Value |
|---|---|
| Purpose | Deliver assessment invitations and authenticate candidate access |
| Categories of data subject | Candidates |
| Categories of data | Name, email address, access token, invitation metadata |
| Recipients | Resend (email), Supabase (storage), Vercel (hosting) |
| Transfers | US; DPF + SCCs |
| Retention | Per DRP-ZC-HIRE-2026-001 |
| Security | Token-scoped access; tokens unguessable; TLS in transit |

### PA-2 — CV collection and text extraction

| Field | Value |
|---|---|
| Purpose | Provide the interview with role-relevant background |
| Data subjects | Candidates; third parties named in the CV (referees, former colleagues) |
| Categories of data | Full CV document and extracted text: employment history, education, contact details, and any further content the candidate's CV happens to contain |
| **Special category risk** | **Yes** — CVs routinely carry photographs, dates of birth, nationality; occasionally health or disability disclosures. Not solicited. See DPIA §2.3. |
| Recipients | Anthropic (extraction), Supabase Storage (`cv` bucket), Vercel |
| Transfers | US; DPF + SCCs |
| Retention | Per DRP |
| Security | Private bucket + 15-minute signed URLs (`lib/storage.ts`). **Bucket privacy setting outstanding.** |

### PA-3 — Assessment instrument administration

| Field | Value |
|---|---|
| Purpose | Structured measurement of personality, reasoning, values, culture fit, resilience, thinking style and growth orientation |
| Data subjects | Candidates |
| Categories of data | Item-level responses; derived dimension scores |
| Recipients | Supabase, Vercel |
| Transfers | US; DPF + SCCs |
| Retention | Per DRP |
| Note | This is **profiling** within Art. 4(4) — evaluation of personal aspects to analyse or predict performance at work. |

### PA-4 — AI-led interview

| Field | Value |
|---|---|
| Purpose | Gather structured competency evidence via Critical Incident Technique |
| Data subjects | Candidates; third parties the candidate names when narrating incidents |
| Categories of data | Full conversational transcript; audio input |
| **Special category risk** | **Yes, incidental.** A candidate narrating a critical incident may disclose health, family circumstances, union activity or religion. Prompts do not probe protected characteristics. |
| Recipients | Anthropic (conversation), OpenAI (speech-to-text), Supabase, Vercel |
| Transfers | US; DPF + SCCs |
| Retention | Per DRP |

### PA-5 — Video and audio recording

| Field | Value |
|---|---|
| Purpose | Enable human review of the interview |
| Data subjects | Candidates |
| Categories of data | Continuous webcam video and audio; snapshot-uploaded every 60 seconds |
| **Note on biometrics** | **Not processed as biometric data.** No facial recognition, biometric categorisation or emotion inference. The recording is never sent to any model. Verified by code review — see Technical Documentation §2. |
| Recipients | Supabase Storage (`video` bucket), Vercel |
| Transfers | US; DPF + SCCs |
| Retention | Per DRP — **shortest period in the schedule** |
| Security | Private bucket + 15-minute signed URLs. **Bucket privacy setting outstanding.** Admin views audit-logged. |

### PA-6 — Fit scoring and report synthesis

| Field | Value |
|---|---|
| Purpose | Produce an assessment and recommendation for a human decision-maker |
| Data subjects | Candidates |
| Categories of data | All of the above, combined; output fit score, competency coding, recommendation, rationale |
| Recipients | Anthropic, Supabase, Vercel |
| Transfers | US; DPF + SCCs |
| Retention | Per DRP |
| **Art. 22** | **Not solely automated.** Admin-triggered; human sets outcome; no automated rejection path. See Technical Documentation §5.1. |

### PA-7 — Audit logging

| Field | Value |
|---|---|
| Purpose | AI Act Art. 12 record-keeping; security monitoring; accountability |
| Data subjects | Candidates; administrators |
| Categories of data | Event type, actor type, resource identifiers, timestamps; admin views of transcripts and recordings |
| Recipients | Supabase, Vercel |
| Retention | Minimum 6 months (Art. 26(6)); recommended 24 months |

---

## 3. Technical and organisational measures (Art. 32)

| Measure | Status |
|---|---|
| TLS in transit | ✅ |
| Encryption at rest (Supabase managed) | ✅ |
| Private object storage with short-lived signed URLs | ⚠️ Code implemented; **bucket setting outstanding** |
| Service-role DB credentials confined to server-side code | ✅ |
| Token-scoped candidate access | ✅ |
| Audit logging of sensitive access | ✅ |
| Admin authentication | ⚠️ **Single shared password. Inadequate for multi-client use.** |
| Row-level security policies | ❌ Access control enforced in application code only |
| Automated retention deletion | ❌ Not implemented |
| Documented incident response | ✅ IRP-ZC-HIRE-2026-001 |
| Backup and recovery | ✅ Supabase point-in-time recovery |
| Penetration testing | ❌ Not performed |

---

## 4. Open items

| # | Item | Priority |
|---|---|---|
| 1 | Set `cv` and `video` buckets to private | Critical |
| 2 | Implement retention deletion | High |
| 3 | Replace shared admin password with per-account authentication | High |
| 4 | Assess whether Art. 37(1)(b) requires a DPO | Medium |
| 5 | Consider row-level security in addition to application-layer checks | Medium |
| 6 | Maintain the controller register alongside signed DPAs | Medium |

---

## Change Log

| Date | Change | Version |
|---|---|---|
| 26 August 2026 | Initial publication. | 1.0 |

---

*End of document.*

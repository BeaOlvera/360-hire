# Sub-Processor List

**360 Hire — AI-Assisted Candidate Assessment Platform**

| Field | Value |
|---|---|
| Document Reference | SPL-ZC-HIRE-2026-001 |
| Version | 1.0 |
| Date | 26 August 2026 |
| Processor | Zephyron Consulting |
| Basis | GDPR Art. 28(2) |

Controllers are notified at least **14 days** before any new sub-processor begins processing personal data, and may object within that period.

---

## 1. Anthropic, PBC

| Field | Details |
|---|---|
| Address | 548 Market Street, PMB 90375, San Francisco, CA 94104, USA |
| Purpose | (a) Conducts the AI-led candidate interview. (b) Extracts text from uploaded CVs. (c) Extracts text from uploaded job descriptions. (d) Produces fit scoring against competencies. (e) Produces the comprehensive report synthesis and recommendation. |
| Data processed | Interview messages in both directions; **full CV content as a base64 document**; job description content; interview transcripts; assessment results; candidate name and role context in prompts |
| Location | United States |
| Transfer mechanism | EU-US Data Privacy Framework; SCCs (Modules 2 and 3) |
| DPA | Yes — Anthropic Data Processing Addendum |
| Retention by sub-processor | No retention of prompt/completion data beyond the request lifecycle. No training on customer data. |
| Models | `claude-sonnet-4-6` (interview, scoring, synthesis); `claude-haiku-4-5-20251001` (CV and JD extraction) |
| Note | CV extraction sends the **entire document**, which may contain a photograph, date of birth, nationality or health disclosures the system never requested. See DPIA §2.3. |

---

## 2. OpenAI, L.L.C.

| Field | Details |
|---|---|
| Address | 1960 Bryant Street, San Francisco, CA 94110, USA |
| Purpose | Speech-to-text. Transcribes candidate voice input during the interview. |
| Data processed | Audio recordings of the candidate's speech, and the resulting transcripts. Audio carries the candidate's voice and whatever they choose to disclose. |
| Location | United States |
| Transfer mechanism | EU-US Data Privacy Framework; SCCs (Module 3) |
| DPA | Yes — OpenAI Data Processing Addendum |
| Retention by sub-processor | API inputs and outputs not used for model training. Retention per the OpenAI API data usage policy in force. |
| Model | `whisper-1` |
| Note | Speech **output** uses the browser's local `SpeechSynthesis` API and involves no transfer to any third party. Only the input path reaches OpenAI. |

---

## 3. Supabase, Inc.

| Field | Details |
|---|---|
| Address | 970 Toa Payoh North #07-04, Singapore 318992 (US operations) |
| Purpose | Hosted PostgreSQL database and object storage. |
| Data processed | All platform data: candidate identity, applications, assessment item responses and scores, interview transcripts, fit scores, reports, audit logs, access tokens. **Object storage holds uploaded CVs (`cv` bucket) and continuous video recordings (`video` bucket).** |
| Location | United States (AWS), region per project `zoyeryxisueycvmaygtk` |
| Transfer mechanism | EU-US Data Privacy Framework; SCCs (Module 3) |
| DPA | Yes — Supabase Data Processing Agreement |
| Retention by sub-processor | Until deleted by the processor; point-in-time recovery backups per Supabase policy |
| **Open item** | **The `cv` and `video` buckets must be set to private.** Until then, historic public object URLs remain reachable without authentication. See DPIA risk R2. |

---

## 4. Vercel, Inc.

| Field | Details |
|---|---|
| Address | 340 S Lemon Ave #4133, Walnut, CA 91789, USA |
| Purpose | Application hosting; serverless execution of API routes; scheduled jobs (Vercel Cron). |
| Data processed | All HTTP request and response payloads: identity data, interview messages, uploaded files in transit, report content during generation, IP addresses and request metadata in logs |
| Location | United States and global edge network |
| Transfer mechanism | EU-US Data Privacy Framework; SCCs (Module 3) |
| DPA | Yes — Vercel Data Processing Addendum |
| Retention by sub-processor | Stateless functions; server logs typically 1–3 days |

---

## 5. Resend, Inc.

| Field | Details |
|---|---|
| Address | San Francisco, CA, USA |
| Purpose | Transactional email. Sends assessment invitations to candidates. |
| Data processed | Recipient email address and name, invitation content, access link containing a unique token |
| Location | United States |
| Transfer mechanism | EU-US Data Privacy Framework; SCCs (Module 3) |
| DPA | Yes — Resend Data Processing Agreement |
| Retention by sub-processor | Delivery metadata typically 30 days; content not stored beyond delivery |
| Note | Sending domain `zephyronconsulting.com`, sender `hire@zephyronconsulting.com` |

---

## 6. Not sub-processors

For completeness, the following process no personal data on the processor's behalf:

| Component | Why not |
|---|---|
| Browser `SpeechSynthesis` (AI voice output) | Executes locally on the candidate's device; no transfer |
| puppeteer-core / @sparticuz/chromium (PDF generation) | Executes within Vercel functions; no separate entity |

---

## 7. Transfer risk note

**Every sub-processor is US-established.** This means candidate personal data — including CV content, interview transcripts, voice recordings and video — leaves the EEA in the ordinary course of processing.

Deployers should be aware that this is a structural property of the system, not an incidental one, and should reflect it in their own transfer impact assessment where their risk appetite requires one.

---

## 8. Change notification process

1. Controllers with an active DPA are notified at least 14 days before a new sub-processor begins processing.
2. Notification is by email to the controller's designated contact.
3. It states the sub-processor's name, purpose, data processed, location and transfer mechanism.
4. Controllers may object within 14 days; objections are handled per the DPA.

---

## Change Log

| Date | Change | Version |
|---|---|---|
| 26 August 2026 | Initial publication. | 1.0 |

---

*End of document.*

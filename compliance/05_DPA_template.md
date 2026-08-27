# Data Processing Agreement

**Template — 360 Hire**

| Field | Value |
|---|---|
| Document Reference | DPA-ZC-HIRE-2026-001 |
| Version | 1.0 |
| Date | 26 August 2026 |
| Basis | GDPR Art. 28(3) |

> **Not legal advice.** This template covers the Art. 28(3) mandatory content. It should be reviewed by counsel before signature, and it does not replace the client's own contracting standards.

---

## Parties

| Role | Party |
|---|---|
| **Controller** | [CLIENT ORGANISATION], [ADDRESS], [REGISTRATION NUMBER] |
| **Processor** | Zephyron Consulting, [ADDRESS] |
| Effective date | [DATE] |

---

## 1. Subject matter, duration, nature and purpose

**Subject matter.** Processing of candidate personal data through the 360 Hire platform for the purpose of assessing candidates for roles with the Controller.

**Duration.** For the term of the services agreement, plus the retention periods in Annex 2.

**Nature and purpose.** Collection of candidate responses; administration of assessment instruments; AI-led interview; audio and video recording; automated analysis producing a fit score and a recommendation for the Controller's human decision-maker.

**Types of personal data and categories of data subject.** See Annex 1.

---

## 2. Processor obligations (Art. 28(3))

The Processor shall:

**(a) Documented instructions.** Process personal data only on the Controller's documented instructions, including as to international transfers, unless required otherwise by Union or Member State law — in which case the Processor informs the Controller before processing, unless that law prohibits it. This Agreement and the Instructions for Use (IFU-ZC-HIRE-2026-001) constitute the Controller's initial documented instructions.

**(b) Confidentiality.** Ensure persons authorised to process the data are bound by confidentiality.

**(c) Security.** Implement the measures required by Art. 32, as set out in Annex 3.

**(d) Sub-processors.** Engage sub-processors only under Art. 28(2) and (4), per clause 3.

**(e) Data subject rights.** Assist the Controller by appropriate technical and organisational measures in responding to requests under Chapter III, including access, rectification, erasure, restriction, objection and — where relevant — the AI Act Art. 86 right to an explanation.

**(f) Assistance.** Assist the Controller in complying with Arts. 32 to 36, taking account of the nature of processing and the information available.

**(g) Deletion or return.** At the Controller's choice, delete or return all personal data at the end of the services, and delete existing copies, unless retention is required by law.

**(h) Audit.** Make available all information necessary to demonstrate compliance with Art. 28, and allow for and contribute to audits, including inspections, conducted by the Controller or an auditor it mandates.

**(i) Notification of unlawful instructions.** Immediately inform the Controller if, in its opinion, an instruction infringes the GDPR or other data protection law.

---

## 3. Sub-processors

3.1 The Controller grants **general written authorisation** for the sub-processors listed in Annex 4 (SPL-ZC-HIRE-2026-001).

3.2 The Processor shall inform the Controller of any intended addition or replacement **at least 14 days in advance**, giving the Controller the opportunity to object.

3.3 Where the Controller objects on reasonable data-protection grounds, the parties shall discuss in good faith. If no resolution is reached, the Controller may terminate the affected services without penalty.

3.4 The Processor shall impose on each sub-processor the same data protection obligations as in this Agreement, and remains fully liable to the Controller for the sub-processor's performance.

---

## 4. International transfers

4.1 All current sub-processors are established in the **United States**. Candidate personal data — including CV content, interview transcripts, voice recordings and video — is transferred outside the EEA in the ordinary course of processing.

4.2 Transfers rely on the **EU-US Data Privacy Framework** where the recipient is certified, and on **Standard Contractual Clauses** (Module 3, processor to sub-processor) in all cases.

4.3 The Processor shall inform the Controller without undue delay if it becomes aware that a transfer mechanism is invalidated or that a sub-processor can no longer comply.

---

## 5. Personal data breaches

5.1 The Processor shall notify the Controller **without undue delay, and in any event within 24 hours**, of becoming aware of a personal data breach.

5.2 The notification shall describe the nature of the breach, the categories and approximate number of data subjects and records concerned, the likely consequences, and the measures taken or proposed.

5.3 The Processor shall not notify a supervisory authority or data subjects on the Controller's behalf unless expressly instructed.

5.4 The 24-hour period exists so that the Controller's own 72-hour obligation under Art. 33(1) is preserved.

---

## 6. AI Act allocation

6.1 The Processor is the **provider** of a high-risk AI system within Art. 3(3) of Regulation (EU) 2024/1689, classified under Annex III point 4(a).

6.2 The Controller is the **deployer** within Art. 3(4) and carries the deployer obligations, including those in Arts. 26, 27, 50 and 86.

6.3 The Processor shall supply the Instructions for Use and shall notify the Controller before any change to the models, instruments, scoring approach, human-oversight design or sub-processors.

6.4 **The Controller shall not use the system in a manner that produces a decision based solely on automated processing.** The Controller shall not connect the system's output to any process that acts without human intervention.

6.5 The Processor shall report serious incidents to the market surveillance authority under Art. 73 and shall inform the Controller.

---

## 7. Liability and term

As per the underlying services agreement. Clauses 2(g), 5 and 6.5 survive termination.

---

## Annex 1 — Data

**Categories of data subject:** candidates; third parties named by a candidate in a CV or interview (referees, former colleagues, managers).

**Types of personal data:**

| Category | Detail |
|---|---|
| Identity | Name, email address |
| CV content | Employment history, education, contact details, and any further content the candidate's CV contains |
| Assessment responses | Item-level answers and derived scores |
| Interview transcript | Full conversational text |
| Audio | Candidate voice during interview |
| Video | Continuous webcam recording of the candidate |
| Assessment output | Fit score, competency coding, recommendation, rationale |
| Technical | Tokens, timestamps, audit log entries, IP and request metadata |

**Special category data:** not requested. May arrive incidentally via CV, transcript or the visual content of the recording. The Processor does not use such data in assessment. No Art. 9 basis is claimed.

---

## Annex 2 — Retention

Per DRP-ZC-HIRE-2026-001, as agreed with the Controller:

| Data | Successful | Unsuccessful | Agreed |
|---|---|---|---|
| Video recording | 6 months | 3 months | |
| Interview transcript | 24 months | 12 months | |
| CV and extracted text | Employment + statutory | 12 months | |
| Assessment responses and output | 24 months | 12 months | |
| Audit logs | 24 months | 24 months | |

**Override:** where candidates are based in California, FEHA regulations require four-year retention of ADS inputs, outputs and settings for that population.

---

## Annex 3 — Technical and organisational measures

| Measure | Status |
|---|---|
| TLS in transit; encryption at rest | Implemented |
| Private object storage, short-lived signed URLs | Implemented in code; bucket configuration pending |
| Service-role credentials confined to server-side code | Implemented |
| Token-scoped candidate access | Implemented |
| Audit logging of access to transcripts and recordings | Implemented |
| Per-person admin authentication | **Outstanding** |
| Automated retention deletion | **Outstanding** |
| Row-level security policies | Not implemented; enforced in application code |
| Documented incident response | IRP-ZC-HIRE-2026-001 |

The Processor discloses the outstanding items above so that the Controller can assess them. They are tracked in RMS-ZC-HIRE-2026-001.

---

## Annex 4 — Approved sub-processors

Anthropic PBC · OpenAI L.L.C. · Supabase Inc. · Vercel Inc. · Resend Inc.

Full detail in SPL-ZC-HIRE-2026-001.

---

## Signatures

| | Controller | Processor |
|---|---|---|
| Name | | |
| Title | | |
| Date | | |
| Signature | | |

---

*End of document.*

# Data Protection Impact Assessment (DPIA)

**360 Hire — AI-Assisted Candidate Assessment Platform**

| Field | Value |
|---|---|
| Document Reference | DPIA-ZC-HIRE-2026-001 |
| Version | 1.0 |
| Date | 26 August 2026 |
| Controller | [CLIENT ORGANISATION] (the hiring organisation) |
| Processor | Zephyron Consulting |
| Contact | bolvera.arias8@gmail.com |
| Next Review | 26 August 2027, or on any material change to processing |

---

## 1. Why a DPIA is required

A DPIA is mandatory under **GDPR Art. 35**. This processing meets several of the triggering criteria simultaneously:

- **Systematic and extensive evaluation of personal aspects** (Art. 35(3)(a)) — personality, reasoning, values, resilience and competency assessment of candidates, producing a profile used in a hiring decision;
- **Evaluation or scoring**, including profiling and predicting aspects concerning work performance and personal preferences;
- **Innovative use of technology** — large language models conducting assessment interviews;
- **Data processed at scale** relative to the vulnerability of the group;
- **Data concerning vulnerable data subjects.** Job candidates are in an asymmetric relationship with the prospective employer. Their ability to refuse processing is constrained by their interest in the role, which materially weakens consent as a lawful basis.

---

## 2. Description of the processing

### 2.1 Nature

External candidates receive an invitation link, pass a privacy gate, optionally upload a CV, complete a selection of self-report instruments, and take part in an AI-led competency interview with voice and continuous video recording. An administrator later triggers fit scoring and a synthesised report ending in a hiring recommendation.

### 2.2 Scope — categories of personal data

| Category | Data | Source |
|---|---|---|
| Identity | Name, email address | Client / candidate |
| CV content | Employment history, education, contact details, and whatever else the candidate's CV contains — potentially including nationality, date of birth, photograph, marital status and health information, none of which the system requests | Candidate upload |
| Assessment responses | Item-level answers to up to seven instruments | Candidate |
| Derived scores | Personality, reasoning, values, culture-fit, resilience and thinking-style scores | System |
| Interview transcript | Full conversational text, including whatever the candidate volunteers about employers, colleagues and personal circumstances | Candidate |
| **Audio recording** | Voice during the interview | Candidate device |
| **Video recording** | Continuous webcam capture of the candidate's face throughout the session | Candidate device |
| Assessment output | Fit score, competency coding, recommendation (`strong_hire` / `hire` / `maybe` / `no_hire`), rationale | System |
| Technical | Access tokens, timestamps, audit log entries, IP and request metadata | System |

### 2.3 Special category data (Art. 9)

The system **does not request** special category data. It nevertheless carries real risk of receiving it:

| Route | Risk | Control |
|---|---|---|
| CV upload | CVs routinely contain photographs, dates of birth, nationality, and sometimes disability or health disclosures | Not solicited; candidates are told the CV step is optional and Skip is always available |
| Interview transcript | A candidate may disclose health, religion, union membership or family circumstances when narrating a critical incident | Prompt does not probe protected characteristics; assessors are instructed to disregard |
| Video recording | Reveals apparent ethnicity, apparent age, apparent disability, religious dress | **This is unavoidable while video is captured. See §5, risk R4.** |

**Important:** the video is *not* processed as biometric data. No facial recognition, biometric categorisation or emotion inference occurs (verified by code review — see Technical Documentation §2). The recording is a human-review artefact. It nonetheless makes protected characteristics visible to human reviewers in a way a written application would not, which is a fairness risk rather than an Art. 9 processing question.

### 2.4 Context

Candidates are external applicants with no prior relationship with the controller. They are assessed in English or Spanish. Some will be assessed in a second language.

### 2.5 Purposes

Assessment of candidate suitability for a defined role, or general professional assessment where no role is attached (the "generic evaluation" path).

---

## 3. Lawful basis

### 3.1 The basis, and why it is not consent

| Element | Position |
|---|---|
| **Controller's basis (Art. 6)** | **Legitimate interests, Art. 6(1)(f)** — the controller's interest in assessing candidates for a role the candidate has applied for. Alternatively Art. 6(1)(b), steps taken at the request of the data subject prior to entering a contract. |
| **Why not consent** | Consent must be freely given. A candidate who declines assessment forfeits consideration for the role. That is not a free choice, and consent obtained under it would be unreliable as a basis. |
| **What the privacy gate does** | It provides **transparency and information**, not a consent basis. It must be worded accordingly and must not imply that refusal is costless. |
| **Special category data (Art. 9)** | No Art. 9 basis is claimed. Special category data is not sought. Where it arrives incidentally it must not be used in assessment. |

### 3.2 Legitimate interests assessment

| Test | Assessment |
|---|---|
| **Purpose** | Assessing candidate suitability is a legitimate business purpose. |
| **Necessity** | Assessment is necessary. The *extent* of assessment is the question: seven instruments plus a recorded interview is substantial for a single role. Deployers should enable only the instruments the role actually justifies. The per-candidate customisation feature exists precisely to allow this and should be used to reduce, not to expand. |
| **Balance** | Candidates reasonably expect assessment when applying. They do not necessarily expect continuous video recording, personality profiling, or a cognitive test. Those must be disclosed clearly and in advance, before the candidate begins. |
| **Conclusion** | Legitimate interests is available, conditional on the transparency measures in §6 and on proportionate instrument selection. |

---

## 4. Necessity and proportionality

| Principle | Assessment |
|---|---|
| Purpose limitation | Assessment data must not be reused for any purpose other than the role applied for, without a fresh basis. The "generic evaluation" path needs its own explicit framing, since the candidate is not applying for a defined role. |
| Data minimisation | **Weakest area.** The default should be the fewest instruments the role needs. Continuous video for the whole session is the least minimised element in the system. |
| Accuracy | Model outputs are structured opinions, not measurements. Candidates must be able to correct factual errors. |
| Storage limitation | **No retention rule currently exists. See §5, risk R1, and doc 11.** |
| Integrity and confidentiality | See §5, risk R2. |
| Accountability | This document and the Annex IV technical file. |

---

## 5. Risks and controls

Scored as Likelihood × Severity. Residual risk is after controls.

### R1 — Indefinite retention of candidate recordings and CVs

| Field | Value |
|---|---|
| Risk | Video, audio, CV and transcript retained with no defined period or deletion mechanism, contrary to Art. 5(1)(e) |
| Affected | All candidates, including unsuccessful ones |
| Likelihood | **High** — it is the current state |
| Severity | Medium-High |
| **Inherent** | **High** |
| Controls | A retention schedule must be defined and implemented. Recommended: **6 months** from decision for unsuccessful candidates, unless the deployer has a documented reason to keep longer (e.g. a live discrimination claim); recording and transcript deleted at that point regardless of outcome. |
| **Residual** | Low once implemented. **Currently unmitigated.** |
| Owner | Provider (implementation) + deployer (period) |

### R2 — Unauthorised access to CVs and recordings

| Field | Value |
|---|---|
| Risk | Candidate files reachable without authentication |
| Likelihood | Was **High** |
| Severity | **High** — a candidate's face, voice and full employment history |
| **Inherent** | **Critical** |
| Controls | Upload routes changed 26 Aug 2026 to store object paths rather than public URLs; admin view mints 15-minute signed URLs (`lib/storage.ts`). **Buckets must be set to private in Supabase; until then historic public URLs remain reachable.** |
| **Residual** | Low once buckets are private. **Currently partial.** |
| Owner | Provider |

### R3 — Discriminatory outcome from the assessment instruments

| Field | Value |
|---|---|
| Risk | Instruments, particularly the ICAR-style reasoning test, produce systematically different outcomes by protected characteristic |
| Likelihood | Medium-High — cognitive tests used in selection have a well-documented history of subgroup differences |
| Severity | High — exclusion from employment |
| **Inherent** | **High** |
| Controls | Human review of every recommendation; no automated rejection; instruments individually selectable so a role need not use the reasoning test. **The validity and adverse-impact documentation required by Technical Documentation §4.1 is not yet written.** |
| **Residual** | Medium. Reduces once §4.1 is complete and instrument selection is justified per role. |
| Owner | Provider (documentation) + deployer (selection) |

### R4 — Video makes protected characteristics visible to reviewers

| Field | Value |
|---|---|
| Risk | Apparent ethnicity, age, disability and religious dress are visible in the recording, enabling conscious or unconscious bias in human review that a written application would not permit |
| Likelihood | Medium |
| Severity | High |
| **Inherent** | **High** |
| Controls | No automated processing of video. Recommended additions: make video **optional** with a documented alternative; review the transcript before the recording; record who viewed each recording (audit logging already implemented); consider whether video is necessary at all for a given role. |
| **Residual** | Medium. **This risk cannot be eliminated while video capture is default-on.** The honest control is to question whether the recording is needed. |
| Owner | Provider (design) + deployer (policy) |

### R5 — Language disadvantage

| Field | Value |
|---|---|
| Risk | Candidates assessed in a second language are disadvantaged by an instrument that rewards verbal fluency; fluency and competence are correlated but distinct |
| Likelihood | High where multilingual populations are assessed |
| Severity | Medium |
| **Inherent** | **High** |
| Controls | EN and ES both fully supported; candidate should be able to choose. Reviewers should be instructed that fluency is not competence. Not currently a documented instruction. |
| **Residual** | Medium |
| Owner | Provider + deployer |

### R6 — Special category data arriving incidentally

| Field | Value |
|---|---|
| Risk | Health, religion, union membership disclosed in a CV or transcript without an Art. 9 basis |
| Likelihood | Medium-High |
| Severity | Medium |
| **Inherent** | Medium-High |
| Controls | Not solicited; prompts do not probe protected characteristics; CV step optional. Needed: a documented instruction that incidental special category data is disregarded in assessment and not transcribed into reports. |
| **Residual** | Medium |
| Owner | Provider |

### R7 — Model error or fabrication in the synthesis

| Field | Value |
|---|---|
| Risk | The report attributes to a candidate something they did not say, or mischaracterises an incident |
| Likelihood | Medium |
| Severity | Medium-High |
| **Inherent** | High |
| Controls | Full transcript appended to the comprehensive report so every claim can be checked against source. Anti-fabrication probes in the interview. Human review before any decision. Candidate right to rectification. |
| **Residual** | Low-Medium |
| Owner | Provider |

### R8 — Candidate cannot obtain an explanation

| Field | Value |
|---|---|
| Risk | An unsuccessful candidate cannot find out what role the system played |
| Likelihood | High — no route currently defined |
| Severity | Medium |
| **Inherent** | High |
| Controls | **AI Act Art. 86 gives affected persons a right to an explanation.** A named route must be defined and staffed. Not yet done. |
| **Residual** | Low once defined. **Currently unmitigated.** |
| Owner | Deployer, supported by provider |

---

## 6. Data subject rights

| Right | How it is met |
|---|---|
| Information (Arts. 13–14) | Privacy gate before any processing, EN and ES. Must disclose: AI-led interview, video recording, which instruments, retention, and the decision process. |
| Access (Art. 15) | On request to the controller. Provider supports extraction of transcript, assessment results and report. |
| Rectification (Art. 16) | Factual corrections to CV-derived or transcript content. Note: an *opinion* generated by the system cannot be "corrected", but the candidate's disagreement should be recorded alongside it. |
| Erasure (Art. 17) | On request, subject to the controller's retention obligations. Reset route exists (`/api/admin/applications/[id]/reset`) and deletes stored files. |
| Restriction / objection (Arts. 18, 21) | **Because the basis is legitimate interests, candidates have a right to object.** A route for this must exist and must not be purely nominal. |
| Portability (Art. 20) | Limited application; basis is legitimate interests rather than consent or contract. |
| Not subject to solely automated decisions (Art. 22) | **Not engaged.** Verified by code review: scoring is admin-triggered, the model returns a recommendation, no path rejects or ranks out a candidate without human action. See Technical Documentation §5.1. |

---

## 7. International transfers

All sub-processors are US-established. Transfers rely on the EU-US Data Privacy Framework and Standard Contractual Clauses. See doc 06.

Note: audio is transferred to OpenAI for transcription and CV content to Anthropic for extraction. Both carry candidate personal data outside the EEA.

---

## 8. Conclusion

Processing may proceed **conditional on** the following, in order:

| # | Condition | Status |
|---|---|---|
| 1 | `cv` and `video` buckets set to private (R2) | ☐ **Outstanding — blocking** |
| 2 | Retention schedule defined and implemented (R1) | ☐ **Outstanding — blocking** |
| 3 | Art. 86 explanation route defined (R8) | ☐ Outstanding |
| 4 | Instrument validity and adverse-impact documentation (R3) | ☐ Outstanding |
| 5 | Privacy notice reviewed against §6 | ☐ Outstanding |
| 6 | Instruction that incidental special category data is disregarded (R6) | ☐ Outstanding |
| 7 | Reviewer instruction that fluency is not competence (R5) | ☐ Outstanding |

Conditions 1 and 2 are **blocking**: processing of new candidates should not continue at scale until both are closed.

**Residual risk after all conditions are met: Medium**, driven by R3 and R4, both of which are inherent to assessment-by-AI-with-video rather than fixable by documentation. R4 in particular should prompt a genuine reconsideration of whether continuous video is necessary.

### Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Processor (Zephyron Consulting) | | | |
| Controller representative | | | |
| DPO (if appointed) | | | |

Where residual risk remains high and cannot be mitigated, **Art. 36 requires prior consultation with the supervisory authority** (in Spain, the AEPD). On the assessment above, prior consultation is not indicated provided conditions 1–7 are met.

---

## Change Log

| Date | Change | Version |
|---|---|---|
| 26 August 2026 | Initial publication. | 1.0 |

---

*End of document.*

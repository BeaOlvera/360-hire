# Risk Management System

**EU AI Act Article 9 Compliance — 360 Hire**

| Field | Value |
|---|---|
| Document Reference | RMS-ZC-HIRE-2026-001 |
| Version | 1.0 |
| Date | 26 August 2026 |
| Provider | Zephyron Consulting |
| AI System | 360 Hire — AI-Assisted Candidate Assessment Platform |
| Classification | High-risk, Annex III point 4(a) |
| Next Review | 26 February 2027 (6-monthly while open items remain) |

---

## 1. Scope

Article 9 requires a risk management system established, implemented, documented and maintained as a **continuous iterative process** across the entire lifecycle, requiring regular systematic review and updating.

This document is that system for 360 Hire. It is deliberately shorter on process boilerplate and longer on the specific risks this system actually carries.

---

## 2. Process

| Stage | Method |
|---|---|
| Identification | Code review; DPIA; incident and complaint review; deployer feedback; candidate feedback; monitoring of the regulatory environment |
| Analysis | Likelihood × severity, assessed for the intended purpose **and for reasonably foreseeable misuse** (Art. 9(2)(b)) |
| Evaluation | Against the residual-risk criterion in Art. 9(5): residual risk must be judged acceptable, and risks must be eliminated or reduced as far as technically feasible |
| Treatment | Eliminate by design → mitigate by control → provide information to deployers → accept and monitor, in that order of preference (Art. 9(5)) |
| Review | 6-monthly while open items remain, annually thereafter, and on any material change |

**Order of preference matters.** Art. 9(5) does not permit a provider to substitute a warning in the instructions for use where a design change was feasible. Where this document treats a risk by information rather than design, it says why.

---

## 3. Risk register

### RH-1 — Adverse impact from the reasoning instrument

| Field | Value |
|---|---|
| Description | The ICAR-style reasoning instrument produces systematically different outcomes across protected groups, excluding candidates on a basis unrelated to job performance |
| Stage | Assessment administration and scoring |
| Likelihood | Medium-High |
| Severity | High |
| **Inherent** | **High** |
| Treatment | (a) **Design:** the instrument is individually selectable and off by default for roles that do not justify it. (b) **Information:** deployers are told that a cognitive instrument must be justified against the role. (c) **Outstanding:** validity and adverse-impact documentation per Technical Documentation §4.1 item 5. |
| **Residual** | **Medium — unacceptable until (c) is complete** |
| Note | Cognitive ability tests have among the strongest documented subgroup differences of any selection instrument. Including one in a hiring pipeline without a documented job-relatedness justification is the single largest legal exposure in this system, in both the EU and the US (Illinois HB 3773 imposes strict liability for discriminatory effect). |

### RH-2 — Verbal fluency confounded with competence

| Field | Value |
|---|---|
| Description | Competency scoring rests on interview transcripts. Fluency, vocabulary and narrative confidence raise scores independently of underlying competence, disadvantaging second-language candidates and some neurodivergent candidates |
| Likelihood | High |
| Severity | Medium |
| **Inherent** | **High** |
| Treatment | (a) **Design:** full EN and ES support with candidate language choice. (b) **Information:** reviewer instruction that fluency is not competence — **not yet written**. (c) Considered and rejected: automated fluency correction, which would require inferring language proficiency and create a worse problem. |
| **Residual** | Medium |

### RH-3 — Model fabrication or mischaracterisation

| Field | Value |
|---|---|
| Description | The synthesis attributes to a candidate something they did not say, or mischaracterises an incident, and a human reviewer relies on it |
| Likelihood | Medium |
| Severity | Medium-High |
| **Inherent** | High |
| Treatment | **Design:** the full transcript is appended to the comprehensive report, so every claim is checkable against source. Anti-fabrication probes in the interview prompt. Structured output constrains the model to defined fields. |
| **Residual** | Low-Medium |
| Note | Appending the transcript is a genuine design control, not a warning. It makes verification possible for any reviewer who chooses to check. |

### RH-4 — Automated decision-making creeping in

| Field | Value |
|---|---|
| Description | A future feature auto-advances, auto-rejects or ranks candidates without human action, bringing the system within GDPR Art. 22 without anyone noticing |
| Likelihood | Medium — this is a natural product direction |
| Severity | High |
| **Inherent** | High |
| Treatment | **Design:** verified as at 26 Aug 2026 that no such path exists — scoring is admin-triggered, status transitions are admin-only, the model returns a recommendation. **Governance:** recorded as a design control in the Technical Documentation and folder README, so any change touching it is recognised as a compliance decision. |
| **Residual** | Low, conditional on the governance control holding |

### RH-5 — Emotion inference creeping in

| Field | Value |
|---|---|
| Description | A future feature derives a "presence", "communication style" or engagement score from the video or from vocal characteristics, engaging the Art. 5(1)(f) prohibition |
| Likelihood | Low-Medium |
| Severity | **Critical** — a prohibited practice, not a compliance gap. Penalties up to €35M or 7% of turnover. |
| **Inherent** | High |
| Treatment | **Design:** no vision API exists in the codebase; audio enters only as Whisper text. **Governance:** recorded as a control that must survive future features. |
| **Residual** | Low, conditional on the governance control holding |

### RH-6 — Unauthorised access to candidate media

| Field | Value |
|---|---|
| Description | CVs and recordings reachable without authentication |
| Likelihood | Was High |
| Severity | High |
| **Inherent** | **Critical** |
| Treatment | **Design:** private object paths and short-lived signed URLs implemented 26 Aug 2026. **Outstanding:** buckets must be set to private in Supabase; historic public URLs remain live until then. |
| **Residual** | **Critical until the buckets are switched.** Low thereafter. |

### RH-7 — Indefinite retention

| Field | Value |
|---|---|
| Description | No retention rule or deletion mechanism exists |
| Likelihood | High (current state) |
| Severity | Medium-High |
| **Inherent** | High |
| Treatment | Schedule drafted (doc 11); implementation outstanding |
| **Residual** | **High until implemented** |

### RH-8 — Video exposes protected characteristics to reviewers

| Field | Value |
|---|---|
| Description | Apparent ethnicity, age, disability and religious dress are visible to human reviewers in a way a written application would not permit, enabling bias |
| Likelihood | Medium |
| Severity | High |
| **Inherent** | High |
| Treatment | No automated processing of video; audit logging of who viewed each recording. **Considered:** making video optional with a documented alternative, and requiring transcript review before recording review. Neither implemented. |
| **Residual** | **Medium — and this one deserves a design answer rather than a control.** Art. 9(5) prefers elimination where technically feasible, and making video optional is entirely feasible. The question the provider must answer is whether continuous video is necessary at all. |

### RH-9 — Misuse: assessment reused outside its purpose

| Field | Value |
|---|---|
| Description | A deployer reuses a candidate's assessment for an unrelated role, shares it with a third party, or uses the generic-evaluation profile as a general employability score |
| Stage | Reasonably foreseeable misuse (Art. 9(2)(b)) |
| Likelihood | Medium |
| Severity | Medium-High |
| **Inherent** | High |
| Treatment | Information: purpose limitation in the instructions for use and the client contract. Note that reuse as a general-purpose score across unrelated contexts could approach the Art. 5(1)(c) social-scoring prohibition. |
| **Residual** | Medium |

### RH-10 — Candidate cannot obtain an explanation

| Field | Value |
|---|---|
| Description | No route exists for an affected person to exercise the Art. 86 right to an explanation |
| Likelihood | High |
| Severity | Medium |
| **Inherent** | High |
| Treatment | Route to be defined and staffed by the deployer, supported by provider-supplied material |
| **Residual** | Low once defined. **Currently unmitigated.** |

---

## 4. Aggregate position

| Residual level | Risks |
|---|---|
| **Critical** | RH-6 (until buckets are private) |
| **High** | RH-7 (until retention is implemented) |
| **Medium** | RH-1, RH-2, RH-8, RH-9 |
| **Low–Medium** | RH-3 |
| **Low** | RH-4, RH-5, RH-10 (conditional) |

**Under Art. 9(5), residual risk is not currently acceptable.** RH-6 and RH-7 must be closed, and RH-1 must have its documentation completed, before the system can properly be declared conformant. This is why the declaration of conformity is marked do-not-sign.

---

## 5. Testing (Art. 9(6)–(8))

Article 9 requires testing against prior-defined metrics and probabilistic thresholds appropriate to the intended purpose.

**Status: not yet performed.** No performance metric has been defined or measured for this system. This is a genuine gap, not a documentation gap.

Minimum programme before the December 2027 deadline:

| # | Test | Purpose |
|---|---|---|
| 1 | Inter-rater agreement between the model's competency coding and trained human coders on a sample of transcripts | Establishes whether the scoring is reproducible at all |
| 2 | Test-retest stability of the fit score on re-run of the same transcript | Establishes whether the output is stable |
| 3 | Resolution analysis: distribution of fit scores, and whether the differences relied on exceed measurement error | Art. 15 accuracy — a system acting on differences inside its own error band is discriminating on noise |
| 4 | Subgroup analysis where demographic data can lawfully be obtained | RH-1, RH-2 |
| 5 | Adversarial testing: fabricated CVs, coached answers, non-native phrasing | Robustness |

Test 3 is the one most often skipped and most often decisive.

**Constraint to record:** subgroup analysis (test 4) requires processing special category data and needs its own Art. 9 GDPR basis. Where it cannot lawfully be run, record that fact and the reason. An explicit reasoned decision is defensible; silence is not.

---

## 6. Post-market monitoring (Art. 72)

| Element | Arrangement |
|---|---|
| Data collected | Deployer feedback, candidate complaints, audit logs, model output anomalies, override rates |
| Review frequency | 6-monthly while open items remain |
| Serious incident reporting (Art. 73) | To the market surveillance authority within the applicable deadline; in Spain, AESIA unless a sectoral authority has competence |
| Trigger for RMS revision | Any serious incident, any material feature change, any change to the design controls in RH-4 or RH-5 |

---

## 7. Review record

| Date | Reviewer | Changes | Next review |
|---|---|---|---|
| 26 Aug 2026 | — | Initial establishment | 26 Feb 2027 |

---

*End of document.*

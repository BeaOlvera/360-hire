# EU Declaration of Conformity

**Pursuant to Article 47 of Regulation (EU) 2024/1689 (EU AI Act)**

| Field | Value |
|---|---|
| Document Reference | DOC-ZC-HIRE-2026-001 |
| Version | 1.0 (**DRAFT — not to be signed until the open items in §11 are closed**) |
| Date | 26 August 2026 |

---

## 1. AI System Identification

| Field | Value |
|---|---|
| **AI System Name** | 360 Hire — AI-Assisted Candidate Assessment Platform |
| **Version** | 1.0 |
| **System Description** | AI-assisted assessment of external candidates. Extracts CV text, administers up to seven self-report instruments, conducts an AI-led competency interview, records the session for human review, produces a fit score and a synthesised recommendation for a human decision-maker. |
| **Unique Identification** | AIATD-ZC-HIRE-2026-001 |

---

## 2. Provider Identification

| Field | Value |
|---|---|
| **Provider Name** | Zephyron Consulting |
| **Contact Email** | bolvera.arias8@gmail.com |
| **Role** | Provider of a high-risk AI system within the meaning of Art. 3(3) |

---

## 3. Purpose of This Declaration

This declaration is issued under the sole responsibility of Zephyron Consulting. When signed, it will certify that the high-risk AI system identified above is in conformity with the requirements of **Chapter III, Section 2 of Regulation (EU) 2024/1689**.

**It is presently a draft.** It must not be signed, supplied to a client, or relied on while the open items in §11 remain outstanding.

---

## 4. Classification

The system is classified as **high-risk** pursuant to **Article 6(2)** in conjunction with **Annex III, point 4(a)**: AI systems intended to be used for the recruitment or selection of natural persons, in particular to place targeted job advertisements, to analyse and filter job applications, and to evaluate candidates.

The system analyses applications and evaluates candidates. It does not place targeted job advertisements.

The sibling system **360 Evaluate** evaluates incumbent employees and is classified under point 4(b). It is covered by a separate declaration (DOC-ZC-2026-001).

---

## 5. Conformity Assessment Procedure

Conformity assessment is carried out through **internal control** in accordance with **Annex VI** and **Article 43(1)**. No notified body is involved, as this is permitted for high-risk systems listed in Annex III.

---

## 6. Prohibited Practices

The provider declares that the system does not engage any practice prohibited by **Article 5**. In particular, the system performs **no inference of emotions from biometric data** and therefore does not engage the prohibition in Art. 5(1)(f).

The full analysis, including the code-level verification on which this statement rests, is at §2 of the Technical Documentation (AIATD-ZC-HIRE-2026-001). This declaration is conditional on the control recorded there being maintained: the video recording remains a human-review artefact and is not analysed by any model.

---

## 7. Applicable Requirements

| Article | Requirement | Status |
|---|---|---|
| Art. 9 | Risk management system | ☐ RMS-ZC-HIRE-2026-001 to be completed |
| Art. 10 | Data and data governance | ☐ Instrument validity documentation outstanding — see Technical Documentation §4.1 |
| Art. 11 | Technical documentation (Annex IV) | ☑ AIATD-ZC-HIRE-2026-001 v1.0 |
| Art. 12 | Record-keeping and logging | ☑ Audit logging implemented (`lib/audit.ts`); retention period to be confirmed |
| Art. 13 | Transparency and instructions for use | ☐ Instructions for use to be drafted |
| Art. 14 | Human oversight | ☑ Verified by code review — no automated decision path; see Technical Documentation §5.1 |
| Art. 15 | Accuracy, robustness, cybersecurity | ☐ Partial. Private storage implemented 26 Aug 2026; accuracy not yet characterised; admin authentication inadequate |
| Art. 17 | Quality management system | ☐ To be documented |

---

## 8. Registration in the EU Database (Article 49)

| Field | Status |
|---|---|
| Provider registered in EU database | ☐ Not yet completed |
| System registered in EU database | ☐ Not yet completed |
| Registration reference | _to be recorded on completion_ |

Registration under Art. 49(1), carrying the information in Annex VIII Section A, must be completed before the system is placed on the market and in any event before **2 December 2027**. Registration is a provider obligation and cannot be delegated to deployers.

---

## 9. Standards Applied

No harmonised standard is currently cited in the Official Journal for the AI Act. EN ISO/IEC 42001:2026 was adopted in Europe on 18 March 2026 but is **not** a harmonised standard and confers **no presumption of conformity**. The AI Act-specific standardisation work (prEN 18286) remains in development.

Conformity is therefore demonstrated directly against the requirements of the Regulation, and the provider retains the full evidentiary burden.

---

## 10. Regulatory Timeline

| Requirement | Applies from | Status |
|---|---|---|
| Prohibited practices (Art. 5) | 2 February 2025 | In force — see §6 |
| AI literacy (Art. 4) | 2 August 2025 | In force |
| Transparency (Art. 50) | 2 August 2026 | In force |
| High-risk regime, Annex III | **2 December 2027** | Deferred by the Digital Omnibus |

---

## 11. Open Items Blocking Signature

This declaration **cannot be signed** until:

1. The `cv` and `video` Supabase buckets are set to private and historic public URLs are invalidated;
2. The instrument validity documentation at Technical Documentation §4.1 is complete, including the adverse-impact position on the reasoning instrument;
3. The risk management system (Art. 9) is documented;
4. Instructions for use (Art. 13) are drafted and supplied to deployers;
5. Admin authentication is adequate for the deployment context;
6. The Art. 86 explanation route for candidates is defined;
7. Registration under Art. 49 is complete.

---

## 12. Declaration

**Signed on behalf of Zephyron Consulting:**

I, the undersigned, hereby declare that the above-mentioned AI system is in conformity with the applicable requirements laid down in Chapter III, Section 2 of Regulation (EU) 2024/1689.

| Field | Value |
|---|---|
| Name | _________________________ |
| Title | _________________________ |
| Date | _________________________ |
| Place | _________________________ |
| Signature | _________________________ |

> **Do not sign while §11 remains outstanding.** A signed declaration of conformity is a legal representation by the provider.

---

*This declaration is issued in accordance with Article 47 of Regulation (EU) 2024/1689, under the sole responsibility of the provider.*

*End of document.*

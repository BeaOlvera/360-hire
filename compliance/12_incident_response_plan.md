# Incident Response Plan

**360 Hire — AI-Assisted Candidate Assessment Platform**

| Field | Value |
|---|---|
| Document Reference | IRP-ZC-HIRE-2026-001 |
| Version | 1.0 |
| Date | 26 August 2026 |
| Provider / Processor | Zephyron Consulting |
| Basis | GDPR Arts. 33–34; AI Act Arts. 73, 26(5) |

---

## 1. Two regimes, two clocks

Incidents here can trigger **two separate reporting duties with different deadlines and different recipients**. Confusing them is the most common failure mode.

| | GDPR personal data breach | AI Act serious incident |
|---|---|---|
| Trigger | Breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to personal data | Malfunction leading to death or serious harm to health, serious and irreversible disruption of critical infrastructure, infringement of fundamental rights obligations, or serious harm to property or environment |
| Who reports | **Controller** to supervisory authority. Processor notifies controller. | **Provider** to market surveillance authority |
| Deadline | **72 hours** from the controller becoming aware | **15 days** generally; **2 days** for widespread infringement or critical infrastructure; **10 days** in case of death |
| Authority | AEPD (Spain) or relevant DPA | AESIA (Spain) unless a sectoral authority has competence |
| Data subject notice | Where high risk to rights and freedoms (Art. 34) | Per authority direction |

**Zephyron is the processor under GDPR and the provider under the AI Act.** That means: for a data breach we notify the client without undue delay and they notify the regulator; for a serious incident we notify the regulator ourselves.

---

## 2. Severity classification

| Level | Definition | Examples specific to this system |
|---|---|---|
| **P1 Critical** | Confirmed unauthorised access to candidate personal data, or a live prohibited-practice exposure | Candidate CVs or video recordings reachable without authentication; admin session compromised; a feature found to be inferring emotion from video |
| **P2 High** | Significant risk of harm; systemic assessment failure | Reports attributing statements to the wrong candidate; assessment output demonstrably discriminatory; retention failure across a whole client |
| **P3 Medium** | Contained failure affecting individuals | A single report with a fabricated claim; one candidate's file exposed to another; failed deletion request |
| **P4 Low** | No personal data or fundamental rights impact | Recording upload failure; email delivery failure; transient model error |

---

## 3. Response procedure

### Step 1 — Contain (immediately)

| Incident type | First action |
|---|---|
| Storage exposure | Set the affected bucket to private; revoke signed URLs; if necessary move objects to a new path so existing URLs are dead |
| Credential compromise | Rotate `ADMIN_PASSWORD` in Vercel and redeploy; rotate the Supabase service-role key; invalidate active sessions |
| Assessment integrity failure | Suspend scoring and report generation; notify affected deployers **before** they act on any affected output |
| Prohibited-practice exposure | Disable the feature immediately. This is not a bug to schedule. |

### Step 2 — Assess (within 12 hours)

Record: what happened, when, how discovered, which data categories, how many data subjects, which controllers affected, whether data left the system, and whether harm is likely.

### Step 3 — Notify

| Recipient | When | What |
|---|---|---|
| Affected controllers | **Without undue delay** — target within 24 hours of becoming aware, so the controller's own 72-hour clock is preserved | Nature of the breach, categories and approximate numbers, likely consequences, measures taken |
| Market surveillance authority | Per AI Act Art. 73 deadlines above, for serious incidents | As directed |
| Data subjects | Where the controller determines high risk (Art. 34) | Controller-led; provider supplies the facts |

**The processor's notification duty (Art. 33(2)) has no fixed deadline but "without undue delay" means hours, not days** — because the controller's 72 hours is running.

### Step 4 — Remediate and record

Fix the root cause. Update the risk management system (RMS-ZC-HIRE-2026-001) if the incident reveals a risk not in the register. Record everything in the incident log below, whether or not it was notifiable — Art. 33(5) requires documentation of **all** breaches.

---

## 4. Known standing exposures

Recorded here because an incident response plan that ignores the exposures already known is theatre.

| # | Exposure | Status | Would be |
|---|---|---|---|
| 1 | `cv` and `video` buckets public; historic object URLs reachable without authentication | **Open** | P1 if accessed |
| 2 | No retention deletion; data held indefinitely | **Open** | P2 |
| 3 | Session cookie is an unsigned constant (`admin_session=authenticated`), forgeable by anyone who knows the value | **Open** | P1 if exploited |
| 4 | Single shared admin password across all clients | **Open** | P1 if leaked |

Exposure 3 deserves emphasis: because the cookie value is a fixed string rather than a signed token, knowing the password is not required to obtain admin access. Rotating the password does not mitigate it.

---

## 5. Contacts

| Role | Contact |
|---|---|
| Incident lead | Zephyron Consulting — bolvera.arias8@gmail.com |
| Supabase support | Via project dashboard |
| Vercel support | Via project dashboard |
| Anthropic | Per API terms |
| OpenAI | Per API terms |
| AEPD (Spain) | www.aepd.es |
| AESIA (Spain) | Agencia Española de Supervisión de la Inteligencia Artificial, A Coruña |

---

## 6. Incident log

| Date | Ref | Severity | Summary | Controllers notified | Authority notified | Closed |
|---|---|---|---|---|---|---|
| 26 Aug 2026 | INC-2026-001 | P1 (self-identified, no known access) | Compliance review found `cv` and `video` buckets served candidate files via public URLs. Code changed the same day to private paths and short-lived signed URLs. **Bucket privacy setting still to be applied; no evidence of unauthorised access, and none sought.** | ☐ Pending assessment | ☐ Assess whether notifiable | ☐ Open |

**On INC-2026-001:** whether this requires notification depends on whether personal data was actually accessed by an unauthorised party. Object paths are UUID-based and therefore not guessable, which materially lowers the likelihood, but "not guessable" is not the same as "not exposed". Supabase access logs should be reviewed before concluding it was not notifiable, and that review should be recorded either way.

---

## 7. Review

Reviewed annually and after every P1 or P2 incident.

| Date | Reviewer | Changes |
|---|---|---|
| 26 Aug 2026 | — | Initial publication |

---

*End of document.*

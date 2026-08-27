# Candidate Privacy Notice

**360 Hire — template for the privacy gate and for the invitation email**

| Field | Value |
|---|---|
| Document Reference | CPN-ZC-HIRE-2026-001 |
| Version | 1.0 |
| Date | 26 August 2026 |
| Basis | GDPR Arts. 13–14; AI Act Arts. 26(11), 50, 86 |
| Audience | Candidates. This text is shown **before** any processing begins. |

---

## Drafting notes for the deployer (delete before publishing)

1. **The controller is the hiring organisation**, not Zephyron Consulting. Fill in the bracketed fields.
2. **Do not word this as a consent request.** The basis is legitimate interests, because a candidate who declines forfeits the role and so cannot consent freely. Wording it as consent creates a basis that will not hold if challenged, and implies a choice that does not exist.
3. **Disclose the video recording prominently**, before the candidate starts. Burying it is the single most likely cause of a complaint.
4. Only list the instruments actually enabled for this candidate.
5. Spanish text uses full accents and inverted punctuation. Do not strip them.

---

## English

> ### Before you begin
>
> [ORGANISATION] uses an AI-assisted assessment platform, 360 Hire, provided by Zephyron Consulting, to help us assess candidates. Please read this before you start.
>
> **You are talking to an AI.** The interview is conducted by an AI assistant, not a person. A human reviews the results afterwards.
>
> **What happens in this session**
>
> - You may upload your CV. This is optional — you can skip it.
> - You will complete [NUMBER] short questionnaires: [LIST ENABLED INSTRUMENTS].
> - You will have a conversational interview with the AI assistant, lasting roughly [DURATION].
> - **The session is recorded on video and audio throughout.** The recording is used only for human review of your interview. It is not analysed by any software, and no system draws conclusions from your face, your voice or your expressions.
>
> **What we do with it**
>
> Your responses, transcript, CV and recording are analysed to produce an assessment of your fit for [ROLE]. The system produces a recommendation. **It does not make the decision.** A member of our team reviews everything before any decision is taken, and can disagree with the system.
>
> **Why we are allowed to do this**
>
> We rely on our legitimate interests in assessing candidates for roles they have applied for (Article 6(1)(f) UK/EU GDPR). You have the right to object to this — see below.
>
> **How long we keep it**
>
> - Video recording: [PERIOD] after a decision is made
> - Transcript, assessment results and CV: [PERIOD]
> - We delete earlier if you ask us to, unless we are required to keep it.
>
> **Who else sees it**
>
> Your data is processed by Zephyron Consulting on our behalf, and by their technology providers: Anthropic (analysis), OpenAI (converting your speech to text), Supabase (storage), Vercel (hosting) and Resend (email). These are established in the United States; transfers are covered by the EU-US Data Privacy Framework and Standard Contractual Clauses.
>
> **Your rights**
>
> You can ask us for a copy of your data, ask us to correct it, ask us to delete it, or **object to this processing**. You can also ask us to explain the role the AI system played in a decision that affects you. Contact [CONTACT] and we will respond within one month. You may also complain to [SUPERVISORY AUTHORITY — in Spain, the Agencia Española de Protección de Datos].
>
> **Please do not share more than you need to.** The interview does not ask about your health, religion, politics, union membership, sexual orientation or ethnic origin, and none of these are relevant to our assessment. If you mention something of this kind, it will be disregarded.
>
> **Questions before you start?** Contact [CONTACT].

---

## Español

> ### Antes de empezar
>
> [ORGANIZACIÓN] utiliza una plataforma de evaluación asistida por inteligencia artificial, 360 Hire, proporcionada por Zephyron Consulting, para ayudarnos a valorar candidaturas. Por favor, lee esto antes de comenzar.
>
> **Estás hablando con una IA.** La entrevista la realiza un asistente de inteligencia artificial, no una persona. Una persona revisa después los resultados.
>
> **Qué ocurre en esta sesión**
>
> - Puedes subir tu CV. Es opcional: puedes omitir este paso.
> - Completarás [NÚMERO] cuestionarios breves: [LISTA DE INSTRUMENTOS ACTIVADOS].
> - Mantendrás una entrevista conversacional con el asistente de IA, de aproximadamente [DURACIÓN].
> - **La sesión se graba en vídeo y audio de principio a fin.** La grabación se utiliza únicamente para que una persona pueda revisar tu entrevista. No la analiza ningún programa, y ningún sistema extrae conclusiones de tu cara, tu voz ni tus expresiones.
>
> **Qué hacemos con ello**
>
> Tus respuestas, la transcripción, tu CV y la grabación se analizan para elaborar una valoración de tu encaje en [PUESTO]. El sistema genera una recomendación. **No toma la decisión.** Una persona de nuestro equipo revisa todo antes de adoptar cualquier decisión, y puede discrepar del sistema.
>
> **Por qué podemos hacerlo**
>
> Nos basamos en nuestro interés legítimo en valorar a las personas candidatas a los puestos a los que se han presentado (artículo 6.1.f del RGPD). Tienes derecho a oponerte: ver más abajo.
>
> **Cuánto tiempo lo conservamos**
>
> - Grabación de vídeo: [PERIODO] desde que se adopta una decisión
> - Transcripción, resultados de la evaluación y CV: [PERIODO]
> - Lo eliminamos antes si nos lo pides, salvo que estemos obligados a conservarlo.
>
> **Quién más lo ve**
>
> Tus datos son tratados por Zephyron Consulting por cuenta nuestra, y por sus proveedores tecnológicos: Anthropic (análisis), OpenAI (conversión de voz a texto), Supabase (almacenamiento), Vercel (alojamiento) y Resend (correo electrónico). Están establecidos en Estados Unidos; las transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. y en cláusulas contractuales tipo.
>
> **Tus derechos**
>
> Puedes solicitar una copia de tus datos, pedir que los rectifiquemos, pedir que los suprimamos u **oponerte a este tratamiento**. También puedes pedirnos que te expliquemos el papel que el sistema de IA ha tenido en una decisión que te afecte. Escribe a [CONTACTO] y responderemos en el plazo de un mes. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos.
>
> **Por favor, no compartas más información de la necesaria.** La entrevista no pregunta por tu salud, religión, ideología, afiliación sindical, orientación sexual ni origen étnico, y nada de eso es relevante para nuestra valoración. Si mencionas algo de este tipo, no se tendrá en cuenta.
>
> **¿Dudas antes de empezar?** Escribe a [CONTACTO].

---

## Implementation checklist

| # | Requirement | Status |
|---|---|---|
| 1 | Shown before any data is collected, not after the CV upload | ☐ Verify against `app/apply/[token]/PrivacyGate.tsx` |
| 2 | Video disclosure appears above the fold, not in small print | ☐ |
| 3 | Wording is informational, not a consent tick | ☐ |
| 4 | Both language versions available and selectable by the candidate | ☐ |
| 5 | Spanish accents and inverted punctuation intact | ☐ |
| 6 | Instrument list matches what is actually enabled for that candidate | ☐ |
| 7 | Retention periods filled in from DRP-ZC-HIRE-2026-001 | ☐ |
| 8 | Contact address is monitored and answers within one month | ☐ |
| 9 | Art. 50 disclosure ("you are talking to an AI") also appears at the start of the interview itself | ☐ |

---

*End of document.*

import { Resend } from 'resend'

/**
 * Email-safe wordmark. Inline SVG is blocked by Gmail / Outlook / iOS Mail,
 * so we render the wordmark as a tiny HTML table that all email clients support:
 * two text cells separated by a thin vertical rule. System fonts only, no @font-face.
 */
function emailLogoHtml(): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 22px 0;">
    <tr>
      <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-weight:800;font-size:24px;line-height:24px;color:#0A0A0A;letter-spacing:-0.6px;padding:0;">Zephyron</td>
      <td style="padding:0 10px;"><div style="width:1px;height:22px;background:#AEABA3;line-height:22px;font-size:0;">&nbsp;</div></td>
      <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-weight:400;font-size:24px;line-height:24px;color:#6B6B6B;letter-spacing:-0.2px;padding:0;">Hire</td>
    </tr>
  </table>`
}

export async function sendCandidateInvite(
  to: string,
  candidateName: string,
  jobTitle: string,
  companyName: string | null,
  token: string,
  appUrl: string,
  language: 'en' | 'es' = 'en',
  isGeneric: boolean = false,
): Promise<void> {
  const applyUrl = `${appUrl}/apply/${token}`

  const subject = isGeneric
    ? (language === 'es'
        ? `Invitación a una evaluación profesional`
        : `Invitation to a professional assessment`)
    : (language === 'es'
        ? `Tu entrevista para el puesto de ${jobTitle}`
        : `Your interview for the ${jobTitle} role`)

  const body = isGeneric
    ? (language === 'es' ? bodyGenericEs(candidateName, applyUrl) : bodyGenericEn(candidateName, applyUrl))
    : (language === 'es' ? bodyJobEs(candidateName, jobTitle, companyName, applyUrl) : bodyJobEn(candidateName, jobTitle, companyName, applyUrl))

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL || 'Zephyron Consulting <hire@zephyronconsulting.com>'

  await resend.emails.send({ from, to, subject, html: body })
}

function bodyJobEn(name: string, jobTitle: string, company: string | null, url: string) {
  const company_line = company ? ` at ${company}` : ''
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0A0A0A;">
    ${emailLogoHtml()}
    <p>Hello ${name},</p>
    <p>Thank you for your interest in the <strong>${jobTitle}</strong> role${company_line}. As part of the selection process, we'd like you to complete a short conversational interview with our AI interviewer.</p>
    <p>The interview takes about 30 to 45 minutes. You can speak or type your answers, the choice is yours. The session is recorded so the hiring team can review it later, and your responses are used only for this assessment.</p>
    <p>Before you begin, you'll be asked to upload your CV and review the privacy notice.</p>
    <p style="margin: 28px 0;">
      <a href="${url}" style="background: #0A0A0A; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Start your interview</a>
    </p>
    <p style="font-size: 12px; color: #6B6B6B;">If the button does not work, copy this link into your browser: <br/><a href="${url}">${url}</a></p>
    <p style="font-size: 11px; color: #AEABA3; margin-top: 32px;">This link is unique to you. Please do not share it.</p>
  </div>`
}

function bodyJobEs(name: string, jobTitle: string, company: string | null, url: string) {
  const company_line = company ? ` en ${company}` : ''
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0A0A0A;">
    ${emailLogoHtml()}
    <p>Hola ${name},</p>
    <p>Gracias por tu interés en el puesto de <strong>${jobTitle}</strong>${company_line}. Como parte del proceso de selección, nos gustaría que completaras una entrevista conversacional con nuestra entrevistadora de IA.</p>
    <p>La entrevista dura aproximadamente entre 30 y 45 minutos. Puedes responder hablando o escribiendo, tú eliges. La sesión se graba para que el equipo de selección pueda revisarla más tarde, y tus respuestas se usan únicamente para esta evaluación.</p>
    <p>Antes de comenzar, te pediremos que subas tu CV y revises el aviso de privacidad.</p>
    <p style="margin: 28px 0;">
      <a href="${url}" style="background: #0A0A0A; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Iniciar entrevista</a>
    </p>
    <p style="font-size: 12px; color: #6B6B6B;">Si el botón no funciona, copia este enlace en tu navegador: <br/><a href="${url}">${url}</a></p>
    <p style="font-size: 11px; color: #AEABA3; margin-top: 32px;">Este enlace es único para ti. Por favor no lo compartas.</p>
  </div>`
}

function bodyGenericEn(name: string, url: string) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0A0A0A;">
    ${emailLogoHtml()}
    <p>Hello ${name},</p>
    <p>You have been invited to complete a <strong>professional assessment</strong>. This is not tied to a specific role; rather, it is a structured way for us to learn about your strengths, working style and motivations so we can match you to projects and opportunities where you would do your best work.</p>
    <p>The assessment includes a short set of questionnaires followed by a conversational interview with our AI interviewer, about 30 to 45 minutes in total. You can speak or type your answers, the choice is yours.</p>
    <p>Before you begin, you'll be asked to upload your CV and review the privacy notice.</p>
    <p style="margin: 28px 0;">
      <a href="${url}" style="background: #0A0A0A; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Start the assessment</a>
    </p>
    <p style="font-size: 12px; color: #6B6B6B;">If the button does not work, copy this link into your browser: <br/><a href="${url}">${url}</a></p>
    <p style="font-size: 11px; color: #AEABA3; margin-top: 32px;">This link is unique to you. Please do not share it.</p>
  </div>`
}

function bodyGenericEs(name: string, url: string) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0A0A0A;">
    ${emailLogoHtml()}
    <p>Hola ${name},</p>
    <p>Te invitamos a completar una <strong>evaluación profesional</strong>. No está vinculada a un puesto concreto; es una forma estructurada de conocer tus fortalezas, tu estilo de trabajo y tus motivaciones, para poder proponerte proyectos y oportunidades donde puedas dar lo mejor de ti.</p>
    <p>La evaluación incluye una serie breve de cuestionarios seguida de una entrevista conversacional con nuestra entrevistadora de IA, en total unos 30 a 45 minutos. Puedes responder hablando o escribiendo, tú eliges.</p>
    <p>Antes de comenzar, te pediremos que subas tu CV y revises el aviso de privacidad.</p>
    <p style="margin: 28px 0;">
      <a href="${url}" style="background: #0A0A0A; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Empezar la evaluación</a>
    </p>
    <p style="font-size: 12px; color: #6B6B6B;">Si el botón no funciona, copia este enlace en tu navegador: <br/><a href="${url}">${url}</a></p>
    <p style="font-size: 11px; color: #AEABA3; margin-top: 32px;">Este enlace es único para ti. Por favor no lo compartas.</p>
  </div>`
}

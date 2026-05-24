import { Resend } from 'resend'

export async function sendCandidateInvite(
  to: string,
  candidateName: string,
  jobTitle: string,
  companyName: string | null,
  token: string,
  appUrl: string,
  language: 'en' | 'es' = 'en',
): Promise<void> {
  const applyUrl = `${appUrl}/apply/${token}`

  const subject = language === 'es'
    ? `Tu entrevista para el puesto de ${jobTitle}`
    : `Your interview for the ${jobTitle} role`

  const body = language === 'es' ? bodyEs(candidateName, jobTitle, companyName, applyUrl) : bodyEn(candidateName, jobTitle, companyName, applyUrl)

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  await resend.emails.send({
    from,
    to,
    subject,
    html: body,
  })
}

function bodyEn(name: string, jobTitle: string, company: string | null, url: string) {
  const company_line = company ? ` at ${company}` : ''
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0A0A0A;">
    <p>Hello ${name},</p>
    <p>Thank you for your interest in the <strong>${jobTitle}</strong> role${company_line}. As part of the selection process, we'd like you to complete a short conversational interview with our AI interviewer.</p>
    <p>The interview takes about 30 to 45 minutes. You can speak or type your answers, the choice is yours. The session is recorded so the hiring team can review it later, and your responses are used only for this assessment.</p>
    <p>Before you begin, you'll be asked to upload your CV and review the privacy notice.</p>
    <p style="margin: 28px 0;">
      <a href="${url}" style="background: #0F3D3E; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Start your interview</a>
    </p>
    <p style="font-size: 12px; color: #6B6B6B;">If the button does not work, copy this link into your browser: <br/><a href="${url}">${url}</a></p>
    <p style="font-size: 11px; color: #AEABA3; margin-top: 32px;">This link is unique to you. Please do not share it.</p>
  </div>`
}

function bodyEs(name: string, jobTitle: string, company: string | null, url: string) {
  const company_line = company ? ` en ${company}` : ''
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0A0A0A;">
    <p>Hola ${name},</p>
    <p>Gracias por tu interés en el puesto de <strong>${jobTitle}</strong>${company_line}. Como parte del proceso de selección, nos gustaría que completaras una entrevista conversacional con nuestra entrevistadora de IA.</p>
    <p>La entrevista dura aproximadamente entre 30 y 45 minutos. Puedes responder hablando o escribiendo, tú eliges. La sesión se graba para que el equipo de selección pueda revisarla más tarde, y tus respuestas se usan únicamente para esta evaluación.</p>
    <p>Antes de comenzar, te pediremos que subas tu CV y revises el aviso de privacidad.</p>
    <p style="margin: 28px 0;">
      <a href="${url}" style="background: #0F3D3E; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600;">Iniciar entrevista</a>
    </p>
    <p style="font-size: 12px; color: #6B6B6B;">Si el botón no funciona, copia este enlace en tu navegador: <br/><a href="${url}">${url}</a></p>
    <p style="font-size: 11px; color: #AEABA3; margin-top: 32px;">Este enlace es único para ti. Por favor no lo compartas.</p>
  </div>`
}

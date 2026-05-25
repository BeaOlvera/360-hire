import { supabaseAdmin } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import InterviewChat from './InterviewChat'
import PrivacyGate from './PrivacyGate'
import CVUpload from './CVUpload'
import Assessment from './Assessment'
import CultureFitAssessment from './CultureFitAssessment'
import Overview from './Overview'
import { getAssessment, ASSESSMENT_CODES, type AssessmentCode, ASSESSMENTS } from '@/lib/assessments'

// Always render server-side from the latest data; never reuse a cached segment.
// Critical for the gate flow (consent -> CV -> assessments -> interview).
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function getContext(token: string) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, status, cv_url, completed_at, assessments_override, competencies_override,
      jobs ( title, language, assessments ),
      candidates ( first_name, surname1, surname2, preferred_language )
    `)
    .eq('token', token)
    .single()

  if (error || !app) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any

  const { data: consents } = await supabaseAdmin
    .from('privacy_consents')
    .select('id, consent_type')
    .eq('application_id', app.id)
    .eq('accepted', true)
  const consent = (consents ?? []).find((c) => c.consent_type === 'interview_processing') ?? null
  const overviewSeen = (consents ?? []).some((c) => c.consent_type === 'overview_seen')

  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('role, content, created_at')
    .eq('application_id', app.id)
    .order('created_at', { ascending: true })

  const { data: doneAssessments } = await supabaseAdmin
    .from('assessment_responses')
    .select('assessment_code')
    .eq('application_id', app.id)

  const completedCodes: string[] = (doneAssessments ?? []).map((d) => d.assessment_code)
  const isGeneric = !job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overrideAssessments: string[] | null = Array.isArray((app as any).assessments_override) ? (app as any).assessments_override : null
  // Priority: per-application override -> job's enabled list -> generic default (when no job)
  const enabledCodes: string[] = overrideAssessments
    ? overrideAssessments.filter((c: string) => ASSESSMENT_CODES.includes(c as AssessmentCode))
    : isGeneric
      ? (['thinking_style', 'growth_orientation', 'career_values'] as string[])
      : (Array.isArray(job?.assessments) ? job.assessments.filter((c: string) => ASSESSMENT_CODES.includes(c as AssessmentCode)) : [])
  const nextAssessment = enabledCodes.find((c) => !completedCodes.includes(c)) ?? null

  const candidateFirstName = candidate?.first_name ?? 'Candidate'
  const candidateFullName = [candidate?.first_name, candidate?.surname1, candidate?.surname2].filter(Boolean).join(' ') || candidateFirstName
  const language: 'en' | 'es' = (candidate?.preferred_language ?? job?.language ?? 'en') === 'es' ? 'es' : 'en'

  return {
    applicationId: app.id,
    status: app.status as string,
    completedAt: app.completed_at,
    hasConsent: !!consent,
    hasCv: !!app.cv_url,
    overviewSeen,
    enabledCodes,
    nextAssessment,
    isGeneric,
    jobTitle: isGeneric ? (language === 'es' ? 'evaluación general' : 'general evaluation') : (job?.title ?? 'the role'),
    candidateFirstName,
    candidateFullName,
    language,
    existingMessages: (messages ?? []).map((m) => ({
      role: m.role as 'assistant' | 'user',
      content: m.content,
    })),
  }
}

export default async function ApplyPage({ params }: { params: { token: string } }) {
  const ctx = await getContext(params.token)
  if (!ctx) notFound()

  if (ctx.status === 'completed') {
    redirect(`/apply/${params.token}/complete`)
  }

  if (!ctx.hasConsent) {
    return (
      <PrivacyGate
        token={params.token}
        candidateFirstName={ctx.candidateFirstName}
        jobTitle={ctx.jobTitle}
        language={ctx.language}
      />
    )
  }

  if (!ctx.hasCv) {
    return (
      <CVUpload
        token={params.token}
        candidateFirstName={ctx.candidateFirstName}
        jobTitle={ctx.jobTitle}
        language={ctx.language}
        canSkip={true}
      />
    )
  }

  // Overview gate: explain the journey BEFORE jumping into assessments / interview.
  if (!ctx.overviewSeen) {
    const steps = ctx.enabledCodes.map((c) => {
      const def = ASSESSMENTS[c as AssessmentCode]
      return { code: c, name: def?.name[ctx.language] ?? c, minutes: def?.estimatedMinutes ?? 5 }
    })
    return (
      <Overview
        token={params.token}
        candidateFirstName={ctx.candidateFirstName}
        jobTitle={ctx.jobTitle}
        isGeneric={ctx.isGeneric}
        language={ctx.language}
        steps={steps}
        hasCvStep={false}
      />
    )
  }

  if (ctx.nextAssessment) {
    const def = getAssessment(ctx.nextAssessment)
    if (def) {
      // Culture Fit has a custom 100-point allocator UI
      if (def.code === 'culture_fit') {
        return (
          <CultureFitAssessment
            token={params.token}
            language={ctx.language}
            estimatedMinutes={def.estimatedMinutes}
          />
        )
      }
      return (
        <Assessment
          token={params.token}
          code={def.code}
          name={def.name[ctx.language]}
          description={def.description[ctx.language]}
          intro={def.intro[ctx.language]}
          estimatedMinutes={def.estimatedMinutes}
          questions={def.questions}
          language={ctx.language}
        />
      )
    }
  }

  return (
    <InterviewChat
      token={params.token}
      candidateFirstName={ctx.candidateFirstName}
      candidateFullName={ctx.candidateFullName}
      jobTitle={ctx.jobTitle}
      language={ctx.language}
      existingMessages={ctx.existingMessages}
      voiceTranscriptionAvailable={!!process.env.OPENAI_API_KEY}
    />
  )
}

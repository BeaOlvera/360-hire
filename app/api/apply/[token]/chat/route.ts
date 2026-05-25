import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAIResponse } from '@/lib/openai'
import { buildCandidatePrompt, buildGenericPrompt, COMPLETION_CODE, MODERATION_CODE } from '@/lib/prompts'
import { logAudit } from '@/lib/audit'

export const maxDuration = 60

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id, status, cv_text, competencies_override,
      jobs ( title, description, org_level, language, competencies ),
      candidates ( first_name, preferred_language )
    `)
    .eq('token', params.token)
    .single()

  if (error || !app) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (app.status === 'completed') return NextResponse.json({ error: 'Interview already completed' }, { status: 400 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const { userMessage } = body // null/undefined means "get the first question"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = app.jobs as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = app.candidates as any
  const candidateFirstName = candidate?.first_name ?? 'Candidate'
  const language: 'en' | 'es' = (candidate?.preferred_language ?? job?.language ?? 'en') === 'es' ? 'es' : 'en'

  const { data: existing } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('application_id', app.id)
    .order('created_at', { ascending: true })

  const history: Array<{ role: 'assistant' | 'user'; content: string }> =
    (existing ?? []).map((m) => ({ role: m.role as 'assistant' | 'user', content: m.content }))

  // Save user's message first (skip when opening)
  if (userMessage !== null && userMessage !== undefined) {
    const { error: insErr } = await supabaseAdmin.from('messages').insert({
      application_id: app.id,
      role: 'user',
      content: userMessage,
    })
    if (insErr) return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    history.push({ role: 'user', content: userMessage })

    if (app.status === 'pending') {
      await supabaseAdmin
        .from('applications')
        .update({ status: 'in_progress', started_at: new Date().toISOString() })
        .eq('id', app.id)
      logAudit({ action: 'interview.started', actorType: 'candidate', resourceType: 'application', resourceId: app.id })
    }
  }

  // If opening request and history already ends with assistant, return that
  if ((userMessage === null || userMessage === undefined) && history.length > 0 && history[history.length - 1].role === 'assistant') {
    return NextResponse.json({ reply: history[history.length - 1].content, completed: false })
  }

  const isGeneric = !job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competenciesOverride = Array.isArray((app as any).competencies_override) ? (app as any).competencies_override : null
  const competencies = competenciesOverride ?? (Array.isArray(job?.competencies) ? job.competencies : [])
  const systemPrompt = isGeneric
    ? buildGenericPrompt({ candidateFirstName, cvText: app.cv_text ?? null, language })
    : buildCandidatePrompt({
        jobTitle: job?.title ?? 'the role',
        jobDescription: job?.description ?? '',
        orgLevel: job?.org_level ?? null,
        candidateFirstName,
        cvText: app.cv_text ?? null,
        language,
        competencies,
      })

  let aiResponse: string
  try {
    aiResponse = await getAIResponse(history, systemPrompt, 700)
  } catch (err) {
    console.error('Claude API error:', err)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }

  if (aiResponse.includes(MODERATION_CODE)) {
    return NextResponse.json({
      reply: language === 'es'
        ? 'Gracias por tu tiempo. Necesitamos dar por terminada la entrevista aquí.'
        : 'Thank you for your time. We need to end the interview here.',
      completed: false,
      moderated: true,
    })
  }

  const isComplete = aiResponse.includes(COMPLETION_CODE)
  const cleanResponse = aiResponse.replace(COMPLETION_CODE, '').trim()
  const closingMessage = language === 'es'
    ? 'Muchas gracias por tu tiempo y tus reflexiones. Con esto concluye nuestra entrevista.'
    : 'Thank you so much for your time and thoughtful responses. This concludes our interview.'
  const replyToSave = cleanResponse.length > 0 ? cleanResponse : closingMessage

  await supabaseAdmin.from('messages').insert({
    application_id: app.id,
    role: 'assistant',
    content: replyToSave,
  })

  if (isComplete) {
    await supabaseAdmin
      .from('applications')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', app.id)
    logAudit({ action: 'interview.completed', actorType: 'candidate', resourceType: 'application', resourceId: app.id })
  }

  return NextResponse.json({ reply: replyToSave, completed: isComplete })
}

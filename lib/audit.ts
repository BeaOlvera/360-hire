/**
 * Audit logging for GDPR + EU AI Act compliance.
 * Logs sensitive actions: data access, AI calls, score changes, report views, etc.
 */

import { supabaseAdmin } from './supabase'

export type AuditAction =
  // Data access
  | 'report.viewed'
  | 'report.generated'
  | 'transcript.viewed'
  | 'video.viewed'
  | 'candidate.data_exported'
  | 'candidate.data_deleted'
  // AI interactions
  | 'ai.fit_scoring'
  | 'ai.cv_parsing'
  | 'ai.jd_extraction'
  | 'ai.comprehensive_report'
  | 'ai.report_generation'
  | 'ai.interview_chat'
  | 'ai.transcription'
  | 'ai.translation'
  // Admin
  | 'job.created'
  | 'job.updated'
  | 'job.archived'
  | 'application.invited'
  | 'application.reviewed'
  | 'application.recommendation_set'
  | 'application.reset'
  // Candidate-facing
  | 'application.accessed'
  | 'interview.started'
  | 'interview.completed'
  | 'cv.uploaded'
  | 'video.uploaded'
  | 'assessment.completed'
  // Privacy
  | 'consent.accepted'
  | 'consent.withdrawn'
  | 'data_request.access'
  | 'data_request.erasure'
  | 'data_request.rectification'

export async function logAudit(params: {
  action: AuditAction
  actorType: 'admin' | 'system' | 'candidate'
  actorId?: string
  resourceType: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
}): Promise<void> {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      actor_type: params.actorType,
      actor_id: params.actorId ?? null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ?? null,
      details: params.details ?? null,
      ip_address: params.ipAddress ?? null,
    })
  } catch (err) {
    console.error('Audit log failed:', err)
  }
}

export async function logAI(params: {
  applicationId?: string
  actionType: string
  model: string
  promptLength: number
  responseLength: number
  tokensUsed?: number
  durationMs?: number
  details?: Record<string, any>
}): Promise<void> {
  try {
    await supabaseAdmin.from('ai_logs').insert({
      application_id: params.applicationId ?? null,
      action_type: params.actionType,
      model: params.model,
      prompt_length: params.promptLength,
      response_length: params.responseLength,
      tokens_used: params.tokensUsed ?? null,
      duration_ms: params.durationMs ?? null,
      details: params.details ?? null,
    })
  } catch (err) {
    console.error('AI log failed:', err)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const allowed = ['title', 'description', 'org_level', 'language', 'hiring_manager', 'status']
  const update: Record<string, any> = {}
  for (const k of allowed) {
    if (body[k] !== undefined) update[k] = body[k]
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No updatable fields' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('jobs').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({ action: 'job.updated', actorType: 'admin', resourceType: 'job', resourceId: params.id, details: update })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const unauth = checkAdminAuth(request)
  if (unauth) return unauth

  const { error } = await supabaseAdmin.from('jobs').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({ action: 'job.archived', actorType: 'admin', resourceType: 'job', resourceId: params.id })
  return NextResponse.json({ ok: true })
}

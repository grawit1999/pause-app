import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { comment } = await req.json() as { comment?: string }

  const { data: request, error: fetchError } = await supabase
    .from('leave_requests')
    .select('*, employee:profiles!employee_id(*)')
    .eq('id', id)
    .single()

  if (fetchError || !request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (request.status !== 'pending') return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })

  const { data: approverProfile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single()

  const isApprover = approverProfile?.role === 'hr' || approverProfile?.role === 'admin' ||
    (approverProfile?.role === 'approver' && request.employee?.approver_id === user.id)

  if (!isApprover) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: updated, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      approver_id: user.id,
      approver_comment: comment ?? '',
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, employee:profiles!employee_id(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ request: updated })
}

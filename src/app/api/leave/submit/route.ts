import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeLeaveRequest } from '@/lib/claude'
import { LeaveType } from '@/types'
import { differenceInBusinessDays, parseISO, addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { leave_type, start_date, end_date, reason } = body as {
    leave_type: LeaveType
    start_date: string
    end_date: string
    reason: string
  }

  if (!leave_type || !start_date || !end_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Calculate days (including start and end, weekdays only)
  const days = differenceInBusinessDays(
    addDays(parseISO(end_date), 1),
    parseISO(start_date)
  )
  if (days <= 0) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
  }

  // Load employee profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Load quotas
  const year = new Date().getFullYear()
  const { data: quotas } = await supabase
    .from('leave_quotas')
    .select('*')
    .eq('employee_id', user.id)
    .eq('year', year)

  // Load recent history (6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const { data: history } = await supabase
    .from('leave_requests')
    .select('leave_type, days, status, start_date')
    .eq('employee_id', user.id)
    .gte('start_date', sixMonthsAgo.toISOString().split('T')[0])
    .order('start_date', { ascending: false })
    .limit(10)

  // AI analysis
  let aiResult = null
  try {
    aiResult = await analyzeLeaveRequest({
      employeeName: profile.full_name,
      department: profile.department,
      leaveType: leave_type,
      startDate: start_date,
      endDate: end_date,
      days,
      reason: reason || '',
      quotas: quotas ?? [],
      recentHistory: history ?? [],
    })
  } catch (e) {
    console.error('AI analysis failed:', e)
  }

  // Insert leave request
  const { data: request, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: user.id,
      leave_type,
      start_date,
      end_date,
      days,
      reason: reason || '',
      approver_id: profile.approver_id,
      ai_score: aiResult?.score ?? null,
      ai_recommendation: aiResult?.recommendation ?? null,
      ai_summary: aiResult?.summary ?? null,
      ai_flags: aiResult?.flags ?? [],
    })
    .select('*, employee:profiles!employee_id(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update used quota
  if (aiResult?.recommendation !== 'ปฏิเสธ') {
    await supabase.rpc('create_default_quotas', { p_employee_id: user.id, p_year: year })
    await supabase
      .from('leave_quotas')
      .update({ used_days: supabase.rpc('used_days') })
  }

  return NextResponse.json({ request, ai: aiResult })
}

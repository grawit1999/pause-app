import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LeaveType } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!caller || !['hr', 'admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { employee_id, leave_type, year, total_days } = await req.json() as {
    employee_id: string
    leave_type: LeaveType
    year: number
    total_days: number
  }

  if (!employee_id || !leave_type || !year || total_days == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: quota, error } = await supabase
    .from('leave_quotas')
    .upsert({ employee_id, leave_type, year, total_days }, { onConflict: 'employee_id,year,leave_type' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ quota })
}

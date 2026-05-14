import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = new Date().getFullYear()
  const targetId = req.nextUrl.searchParams.get('employee_id') ?? user.id

  // Ensure defaults exist
  await supabase.rpc('create_default_quotas', { p_employee_id: targetId, p_year: year })

  const { data, error } = await supabase
    .from('leave_quotas')
    .select('*')
    .eq('employee_id', targetId)
    .eq('year', year)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ quotas: data })
}

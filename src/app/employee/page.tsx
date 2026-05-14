import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmployeeClient } from './EmployeeClient'

export default async function EmployeePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const year = new Date().getFullYear()

  const [{ data: profile }, { data: quotas }, { data: requests }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('leave_quotas').select('*').eq('employee_id', user.id).eq('year', year),
    supabase.from('leave_requests').select('*').eq('employee_id', user.id)
      .order('submitted_at', { ascending: false }).limit(5),
  ])

  if (!profile) redirect('/login')

  return <EmployeeClient profile={profile} quotas={quotas ?? []} recentRequests={requests ?? []} />
}

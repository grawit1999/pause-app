import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HRClient } from './HRClient'

export default async function HRPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['hr', 'admin'].includes(profile.role)) redirect('/employee')

  const year = new Date().getFullYear()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [{ data: requests }, { data: employees }] = await Promise.all([
    supabase
      .from('leave_requests')
      .select('*, employee:profiles!employee_id(*)')
      .gte('submitted_at', thirtyDaysAgo.toISOString())
      .order('submitted_at', { ascending: false })
      .limit(100),
    supabase
      .from('profiles')
      .select('*, quotas:leave_quotas(*)'),
  ])

  return <HRClient profile={profile} requests={requests ?? []} employees={employees ?? []} year={year} />
}

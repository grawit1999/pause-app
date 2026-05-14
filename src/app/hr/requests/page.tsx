import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HRRequestsClient } from './HRRequestsClient'

export default async function HRRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['hr', 'admin'].includes(profile.role)) redirect('/employee')

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*, employee:profiles!employee_id(*), approver:profiles!approver_id(*)')
    .order('submitted_at', { ascending: false })
    .limit(500)

  return <HRRequestsClient profile={profile} requests={requests ?? []} />
}

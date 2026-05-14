import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApproverHistoryClient } from './ApproverHistoryClient'

export default async function ApproverHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['approver', 'hr', 'admin'].includes(profile.role)) redirect('/employee')

  let query = supabase
    .from('leave_requests')
    .select('*, employee:profiles!employee_id(*)')
    .order('submitted_at', { ascending: false })
    .limit(200)

  if (profile.role === 'approver') {
    const { data: team } = await supabase.from('profiles').select('id').eq('approver_id', user.id)
    const teamIds = team?.map(t => t.id) ?? []
    if (teamIds.length === 0) {
      return <ApproverHistoryClient profile={profile} requests={[]} />
    }
    query = query.in('employee_id', teamIds)
  }

  const { data: requests } = await query

  return <ApproverHistoryClient profile={profile} requests={requests ?? []} />
}

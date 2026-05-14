import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApproverClient } from './ApproverClient'

export default async function ApproverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['approver', 'hr', 'admin'].includes(profile.role)) redirect('/employee')

  // All requests for employees whose approver is this user (or all if hr/admin)
  let query = supabase
    .from('leave_requests')
    .select('*, employee:profiles!employee_id(*)')
    .order('submitted_at', { ascending: false })

  if (profile.role === 'approver') {
    const { data: team } = await supabase.from('profiles').select('id').eq('approver_id', user.id)
    const teamIds = team?.map(t => t.id) ?? []
    if (teamIds.length === 0) {
      return <ApproverClient profile={profile} requests={[]} />
    }
    query = query.in('employee_id', teamIds)
  }

  const { data: requests } = await query.limit(50)

  return <ApproverClient profile={profile} requests={requests ?? []} />
}

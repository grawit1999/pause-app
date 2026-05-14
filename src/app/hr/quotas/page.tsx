import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HRQuotasClient } from './HRQuotasClient'

export default async function HRQuotasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['hr', 'admin'].includes(profile.role)) redirect('/employee')

  const year = new Date().getFullYear()

  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['employee', 'approver'])
    .order('department')
    .order('full_name')

  const { data: quotas } = await supabase
    .from('leave_quotas')
    .select('*')
    .eq('year', year)

  return <HRQuotasClient profile={profile} employees={employees ?? []} quotas={quotas ?? []} year={year} />
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Only works in development
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const SEED_USERS = [
    {
      email: 'employee@pause.dev',
      password: 'pause1234',
      profile: {
        full_name: 'นิรันดร์ สมบูรณ์',
        initial: 'น',
        avatar_tone: 'amber',
        role: 'employee',
        department: 'Engineering',
      },
    },
    {
      email: 'approver@pause.dev',
      password: 'pause1234',
      profile: {
        full_name: 'ปอนด์ กิตติ',
        initial: 'ป',
        avatar_tone: 'sky',
        role: 'approver',
        department: 'Engineering',
      },
    },
    {
      email: 'hr@pause.dev',
      password: 'pause1234',
      profile: {
        full_name: 'มะลิ วงศ์ทอง',
        initial: 'ม',
        avatar_tone: 'lilac',
        role: 'hr',
        department: 'HR',
      },
    },
  ]

  const results = []

  // Create users + profiles
  for (const u of SEED_USERS) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (authError && !authError.message.includes('already been registered')) {
      results.push({ email: u.email, error: authError.message })
      continue
    }

    const userId = authData?.user?.id
    if (!userId) {
      // User already exists — find their ID
      const { data: existing } = await supabase.auth.admin.listUsers()
      const found = existing?.users?.find(usr => usr.email === u.email)
      if (!found) { results.push({ email: u.email, error: 'User not found' }); continue }

      await supabase.from('profiles').upsert({ id: found.id, ...u.profile }, { onConflict: 'id' })
      results.push({ email: u.email, status: 'already exists' })
      continue
    }

    // Insert profile
    const { error: profileError } = await supabase.from('profiles').upsert(
      { id: userId, ...u.profile },
      { onConflict: 'id' }
    )

    results.push({ email: u.email, status: profileError ? `profile error: ${profileError.message}` : 'created' })
  }

  // Set employee's approver
  const { data: emp } = await supabase.from('profiles').select('id').eq('email_domain', 'pause.dev').limit(1)
  const { data: approverRow } = await supabase.from('profiles').select('id').eq('role', 'approver').single()
  const { data: employeeRow } = await supabase.from('profiles').select('id').eq('role', 'employee').single()

  if (approverRow && employeeRow) {
    await supabase.from('profiles').update({ approver_id: approverRow.id }).eq('id', employeeRow.id)
  }

  // Seed quotas for employee
  if (employeeRow) {
    const year = new Date().getFullYear()
    await supabase.rpc('create_default_quotas', { p_employee_id: employeeRow.id, p_year: year })
  }

  return NextResponse.json({ results })
}

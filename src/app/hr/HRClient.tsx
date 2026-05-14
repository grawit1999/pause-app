'use client'
import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { AppShell } from '@/components/AppShell'
import { Avatar, Card, Chip, LeaveTypeBadge, QuotaBar, StatusChip } from '@/components/ui'
import { T } from '@/lib/tokens'
import { LeaveQuota, LeaveRequest, LeaveRequestWithEmployee, Profile } from '@/types'

interface EmployeeWithQuotas extends Profile {
  quotas: LeaveQuota[]
}

export function HRClient({ profile, requests, employees, year }: {
  profile: Profile
  requests: LeaveRequestWithEmployee[]
  employees: EmployeeWithQuotas[]
  year: number
}) {
  const [tab, setTab] = useState<'overview' | 'requests' | 'quotas'>('overview')

  const pending = requests.filter(r => r.status === 'pending')
  const approved30d = requests.filter(r => r.status === 'approved')
  const totalDays30d = approved30d.reduce((s, r) => s + Number(r.days), 0)

  const byType = ['ลาพักร้อน', 'ลากิจ', 'ลาป่วย'].map(type => ({
    type,
    count: requests.filter(r => r.leave_type === type).length,
    days: requests.filter(r => r.leave_type === type).reduce((s, r) => s + Number(r.days), 0),
  }))

  return (
    <AppShell profile={profile}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>ภาพรวม HR</div>
            <div style={{ fontSize: 13, color: T.inkFaint }}>30 วันที่ผ่านมา</div>
          </div>
          <div style={{ flex: 1 }} />
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, background: T.paper, border: `1px solid ${T.hairline}`, borderRadius: 10, padding: 3 }}>
            {(['overview', 'requests', 'quotas'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
                border: 'none', background: tab === t ? T.brand : 'transparent',
                color: tab === t ? '#fff' : T.inkSoft,
                cursor: 'pointer', transition: 'all .12s',
              }}>{{ overview: 'ภาพรวม', requests: 'คำขอ', quotas: 'โควต้า' }[t]}</button>
            ))}
          </div>
        </div>

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <KpiCard label="รอดำเนินการ" value={pending.length} sub="คำขอ" accent={pending.length > 0 ? T.warn : T.good} />
              <KpiCard label="อนุมัติแล้ว (30d)" value={approved30d.length} sub="คำขอ" accent={T.good} />
              <KpiCard label="วันลารวม (30d)" value={totalDays30d} sub="วัน" accent={T.brand} />
              <KpiCard label="พนักงาน" value={employees.length} sub="คน" accent={T.inkSoft} />
            </div>

            {/* By type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {byType.map(({ type, count, days }) => (
                <Card key={type} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <LeaveTypeBadge type={type} />
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{count} <span style={{ fontSize: 13, fontWeight: 400, color: T.inkFaint }}>คำขอ</span></div>
                  <div style={{ fontSize: 13, color: T.inkFaint }}>{days} วันรวม</div>
                </Card>
              ))}
            </div>

            {/* Pending list */}
            {pending.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  รอดำเนินการ
                  <Chip kind="warn">{pending.length}</Chip>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pending.map(req => <RequestRow key={req.id} req={req} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Requests tab ── */}
        {tab === 'requests' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requests.map(req => <RequestRow key={req.id} req={req} showStatus />)}
            </div>
          </div>
        )}

        {/* ── Quotas tab ── */}
        {tab === 'quotas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {employees.filter(e => e.role === 'employee').map(emp => {
              const qByType = Object.fromEntries(
                (emp.quotas ?? [])
                  .filter(q => q.year === year)
                  .map(q => [q.leave_type, q])
              )
              return (
                <Card key={emp.id} style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Avatar initial={emp.initial} tone={emp.avatar_tone} size={32} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{emp.full_name}</div>
                      <div style={{ fontSize: 12, color: T.inkFaint }}>{emp.department}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {['ลาพักร้อน', 'ลากิจ', 'ลาป่วย'].map(type => {
                      const q = qByType[type]
                      return (
                        <QuotaBar key={type} label={type} used={q?.used_days ?? 0} total={q?.total_days ?? 0} />
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: number; sub: string; accent: string }) {
  return (
    <Card style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: T.inkFaint }}>{sub}</div>
    </Card>
  )
}

function RequestRow({ req, showStatus = false }: { req: LeaveRequestWithEmployee; showStatus?: boolean }) {
  return (
    <Card style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar initial={req.employee?.initial ?? '?'} tone={req.employee?.avatar_tone ?? 'brand'} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{req.employee?.full_name}</div>
        <div style={{ fontSize: 12, color: T.inkFaint }}>{req.employee?.department}</div>
      </div>
      <LeaveTypeBadge type={req.leave_type} />
      <div style={{ fontSize: 13, color: T.inkSoft, minWidth: 90 }}>
        {req.start_date}{req.start_date !== req.end_date && ` – ${req.end_date}`}
      </div>
      <div style={{ fontSize: 13, minWidth: 48 }}>{req.days} วัน</div>
      {showStatus
        ? <StatusChip status={req.status} />
        : <div style={{ fontSize: 12, color: T.inkFaint }}>{format(parseISO(req.submitted_at), 'd MMM', { locale: th })}</div>
      }
      {req.ai_score !== null && (
        <div style={{ fontSize: 12, color: req.ai_recommendation === 'อนุมัติ' ? T.good : req.ai_recommendation === 'ปฏิเสธ' ? T.bad : T.warn, fontWeight: 600, minWidth: 36 }}>
          {req.ai_score}
        </div>
      )}
    </Card>
  )
}

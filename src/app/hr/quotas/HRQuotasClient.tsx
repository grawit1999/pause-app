'use client'
import React, { useState, useMemo } from 'react'
import { AppShell } from '@/components/AppShell'
import { Avatar, Card, Chip, Toast } from '@/components/ui'
import { T } from '@/lib/tokens'
import { LeaveQuota, LeaveType, Profile } from '@/types'

const LEAVE_TYPES: LeaveType[] = ['ลาพักร้อน', 'ลากิจ', 'ลาป่วย']
const DEFAULT_TOTAL: Record<LeaveType, number> = { 'ลาพักร้อน': 10, 'ลากิจ': 3, 'ลาป่วย': 30 }

export function HRQuotasClient({ profile, employees, quotas: initialQuotas, year }: {
  profile: Profile
  employees: Profile[]
  quotas: LeaveQuota[]
  year: number
}) {
  const [quotas, setQuotas] = useState(initialQuotas)
  const [search, setSearch] = useState('')
  const [editCell, setEditCell] = useState<{ employeeId: string; leaveType: LeaveType } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'good' | 'bad' } | null>(null)

  const showToast = (msg: string, type: 'good' | 'bad' = 'good') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return employees
    const q = search.toLowerCase()
    return employees.filter(e =>
      e.full_name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
    )
  }, [employees, search])

  const quotaMap = useMemo(() => {
    const map: Record<string, Record<LeaveType, LeaveQuota | undefined>> = {}
    for (const emp of employees) {
      map[emp.id] = { 'ลาพักร้อน': undefined, 'ลากิจ': undefined, 'ลาป่วย': undefined }
    }
    for (const q of quotas) {
      if (map[q.employee_id]) map[q.employee_id][q.leave_type as LeaveType] = q
    }
    return map
  }, [employees, quotas])

  // Group by department
  const grouped = useMemo(() => {
    const map: Record<string, Profile[]> = {}
    for (const emp of filtered) {
      const dept = emp.department || 'ไม่ระบุแผนก'
      if (!map[dept]) map[dept] = []
      map[dept].push(emp)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const startEdit = (employeeId: string, leaveType: LeaveType) => {
    const q = quotaMap[employeeId]?.[leaveType]
    setEditCell({ employeeId, leaveType })
    setEditValue(String(q?.total_days ?? DEFAULT_TOTAL[leaveType]))
  }

  const saveEdit = async () => {
    if (!editCell) return
    const newTotal = parseInt(editValue)
    if (isNaN(newTotal) || newTotal < 0) { showToast('ตัวเลขไม่ถูกต้อง', 'bad'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/quota/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: editCell.employeeId, leave_type: editCell.leaveType, year, total_days: newTotal }),
      })
      if (!res.ok) throw new Error('บันทึกไม่สำเร็จ')
      const { quota } = await res.json()
      setQuotas(prev => {
        const existing = prev.find(q => q.employee_id === editCell.employeeId && q.leave_type === editCell.leaveType)
        if (existing) return prev.map(q => q.id === existing.id ? quota : q)
        return [...prev, quota]
      })
      showToast('บันทึกแล้ว')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'bad')
    } finally {
      setSaving(false)
      setEditCell(null)
    }
  }

  const cancelEdit = () => setEditCell(null)

  const typeColor: Record<LeaveType, string> = { 'ลาพักร้อน': T.brandDeep, 'ลากิจ': T.warn, 'ลาป่วย': T.bad }

  return (
    <AppShell profile={profile}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>จัดการโควต้าการลา</div>
            <div style={{ fontSize: 13, color: T.inkFaint }}>ปี {year} · คลิกตัวเลขเพื่อแก้ไข</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${T.hairline}`, borderRadius: 8, padding: '7px 12px', background: T.surface, width: 220 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke={T.inkFaint} strokeWidth="1.4"/>
              <path d="M9.5 9.5L12 12" stroke={T.inkFaint} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ, แผนก…"
              style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1, background: 'transparent', color: T.ink }} />
            {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.inkFaint, padding: 0, fontSize: 14 }}>✕</button>}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.inkFaint }}>
          <span>ตัวเลข = <strong style={{ color: T.ink }}>ใช้ไป / โควต้ารวม</strong></span>
          <span>แถบสี = สัดส่วนที่ใช้ไป (🟢 &lt;70% · 🟡 70–89% · 🔴 ≥90%)</span>
          <span>คลิกที่โควต้ารวมเพื่อแก้ไข</span>
        </div>

        {/* Table header */}
        <Card style={{ overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', padding: '10px 18px', borderBottom: `1px solid ${T.hairline}`, background: T.surface2, gap: 12 }}>
            <div style={{ fontSize: 11, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>พนักงาน</div>
            {LEAVE_TYPES.map(t => (
              <div key={t} style={{ fontSize: 11, fontWeight: 600, color: typeColor[t], textAlign: 'center' }}>{t}</div>
            ))}
          </div>

          {/* Rows by department */}
          {grouped.map(([dept, emps]) => (
            <div key={dept}>
              {/* Department label */}
              <div style={{ padding: '7px 18px', fontSize: 11, fontWeight: 600, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', background: T.paper2, borderBottom: `1px solid ${T.hairlineSoft}` }}>
                {dept} · {emps.length} คน
              </div>

              {emps.map((emp, i) => (
                <div key={emp.id} style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', padding: '12px 18px', gap: 12, alignItems: 'center', borderBottom: i < emps.length - 1 ? `1px solid ${T.hairlineSoft}` : 'none' }}>
                  {/* Employee */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initial={emp.initial} tone={emp.avatar_tone} size={30} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.full_name}</div>
                      <Chip kind={emp.role === 'approver' ? 'brand' : 'default'} style={{ fontSize: 10, marginTop: 2 }}>
                        {emp.role === 'approver' ? 'หัวหน้า' : 'พนักงาน'}
                      </Chip>
                    </div>
                  </div>

                  {/* Quota cells */}
                  {LEAVE_TYPES.map(type => {
                    const q = quotaMap[emp.id]?.[type]
                    const used = q?.used_days ?? 0
                    const total = q?.total_days ?? DEFAULT_TOTAL[type]
                    const pct = total > 0 ? (used / total) * 100 : 0
                    const barColor = pct >= 90 ? T.bad : pct >= 70 ? T.warn : T.good
                    const isEditing = editCell?.employeeId === emp.id && editCell?.leaveType === type

                    return (
                      <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="number" value={editValue} autoFocus
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                              style={{ width: 56, padding: '4px 6px', fontSize: 13, border: `1px solid ${T.brand}`, borderRadius: 6, fontFamily: 'inherit', textAlign: 'center', outline: 'none' }}
                            />
                            <button onClick={saveEdit} disabled={saving} style={{ padding: '4px 7px', borderRadius: 6, border: 'none', background: T.brand, color: '#fff', fontSize: 12, cursor: 'pointer' }}>✓</button>
                            <button onClick={cancelEdit} style={{ padding: '4px 7px', borderRadius: 6, border: `1px solid ${T.hairline}`, background: T.surface, fontSize: 12, cursor: 'pointer' }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                            <span style={{ color: T.inkSoft }}>{used}</span>
                            <span style={{ color: T.inkFaint }}>/</span>
                            <button
                              onClick={() => startEdit(emp.id, type)}
                              title="คลิกเพื่อแก้ไข"
                              style={{ fontWeight: 600, color: T.ink, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, padding: '1px 4px', borderRadius: 4, transition: 'background .1s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = T.brandTint)}
                              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >{total}</button>
                            <span style={{ fontSize: 11, color: T.inkFaint }}>วัน</span>
                          </div>
                        )}

                        {/* Progress bar */}
                        <div style={{ width: '80%', height: 4, background: T.hairline, borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 99, transition: 'width 0.3s' }} />
                        </div>

                        {/* Remaining */}
                        <div style={{ fontSize: 11, color: pct >= 90 ? T.bad : T.inkFaint }}>
                          เหลือ {Math.max(total - used, 0)} วัน
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: T.inkFaint, fontSize: 13 }}>ไม่พบพนักงาน</div>
          )}
        </Card>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </AppShell>
  )
}

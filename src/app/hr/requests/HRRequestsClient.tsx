'use client'
import React, { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { AppShell } from '@/components/AppShell'
import { Avatar, Card, Chip, LeaveTypeBadge, ScoreBar, StatusChip, Btn, Toast } from '@/components/ui'
import { T } from '@/lib/tokens'
import { LeaveRequestWithEmployee, LeaveStatus, LeaveType, Profile } from '@/types'

type SortKey = 'submitted_at' | 'days' | 'ai_score'

const leaveTypes: LeaveType[] = ['ลาพักร้อน', 'ลากิจ', 'ลาป่วย']
const statuses: LeaveStatus[] = ['pending', 'approved', 'rejected', 'cancelled']
const statusLabel: Record<LeaveStatus, string> = {
  pending: 'รอ', approved: 'อนุมัติ', rejected: 'ปฏิเสธ', cancelled: 'ยกเลิก',
}

interface FullRequest extends LeaveRequestWithEmployee {
  approver?: Profile
}

export function HRRequestsClient({ profile, requests: initial }: {
  profile: Profile
  requests: FullRequest[]
}) {
  const [requests, setRequests] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<LeaveType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('submitted_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<FullRequest | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'good' | 'bad' | 'ai' } | null>(null)

  const showToast = (msg: string, type: 'good' | 'bad' | 'ai' = 'good') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    let list = [...requests]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.employee?.full_name.toLowerCase().includes(q) ||
        r.employee?.department.toLowerCase().includes(q) ||
        r.ref_no.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q)
      )
    }
    if (filterType !== 'all') list = list.filter(r => r.leave_type === filterType)
    if (filterStatus !== 'all') list = list.filter(r => r.status === filterStatus)
    list.sort((a, b) => {
      let va: number, vb: number
      if (sortKey === 'submitted_at') { va = new Date(a.submitted_at).getTime(); vb = new Date(b.submitted_at).getTime() }
      else if (sortKey === 'days') { va = a.days; vb = b.days }
      else { va = a.ai_score ?? 0; vb = b.ai_score ?? 0 }
      return sortAsc ? va - vb : vb - va
    })
    return list
  }, [requests, search, filterType, filterStatus, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(p => !p)
    else { setSortKey(key); setSortAsc(false) }
  }

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selected) return
    setLoading(action)
    try {
      const res = await fetch(`/api/leave/${selected.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const updated: FullRequest = { ...selected, ...data.request }
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
      setSelected(updated)
      setComment('')
      showToast(action === 'approve' ? 'อนุมัติคำขอแล้ว ✓' : 'ปฏิเสธคำขอแล้ว', action === 'approve' ? 'good' : 'bad')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', 'bad')
    } finally {
      setLoading(null)
    }
  }

  const stats = useMemo(() => ({
    total: requests.length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    pending: requests.filter(r => r.status === 'pending').length,
    totalDays: requests.filter(r => r.status === 'approved').reduce((s, r) => s + Number(r.days), 0),
  }), [requests])

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span style={{ fontSize: 10, color: sortKey === k ? T.brand : T.inkFaint, marginLeft: 3 }}>
      {sortKey === k ? (sortAsc ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <AppShell profile={profile}>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* Left */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.hairline}`, background: T.paper, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>คำขอลาทั้งหมด</div>
              <Chip kind="outline">{filtered.length} รายการ</Chip>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${T.hairline}`, borderRadius: 8, padding: '7px 12px', background: T.surface, width: 240 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke={T.inkFaint} strokeWidth="1.4"/>
                  <path d="M9.5 9.5L12 12" stroke={T.inkFaint} strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ, แผนก, เหตุผล…"
                  style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1, background: 'transparent', color: T.ink }} />
                {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.inkFaint, padding: 0, fontSize: 14, lineHeight: 1 }}>✕</button>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', ...statuses] as (LeaveStatus | 'all')[]).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: filterStatus === s ? 600 : 400,
                    border: `1px solid ${filterStatus === s ? T.brand : T.hairline}`,
                    background: filterStatus === s ? T.brandTint : T.surface,
                    color: filterStatus === s ? T.brandDeep : T.inkSoft,
                    cursor: 'pointer', transition: 'all .12s',
                  }}>
                    {s === 'all' ? 'ทุกสถานะ' : statusLabel[s]}
                    {s !== 'all' && <span style={{ marginLeft: 4, color: T.inkFaint }}>({requests.filter(r => r.status === s).length})</span>}
                  </button>
                ))}
              </div>
              <div style={{ width: 1, background: T.hairline }} />
              <div style={{ display: 'flex', gap: 4 }}>
                {(['all', ...leaveTypes] as (LeaveType | 'all')[]).map(t => (
                  <button key={t} onClick={() => setFilterType(t)} style={{
                    padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: filterType === t ? 600 : 400,
                    border: `1px solid ${filterType === t ? T.brand : T.hairline}`,
                    background: filterType === t ? T.brandTint : T.surface,
                    color: filterType === t ? T.brandDeep : T.inkSoft,
                    cursor: 'pointer', transition: 'all .12s',
                  }}>{t === 'all' ? 'ทุกประเภท' : t}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 80px 80px 1fr 72px', padding: '8px 20px', fontSize: 11, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.hairline}`, background: T.paper, gap: 12 }}>
            <span>พนักงาน</span>
            <span>ประเภท / วันที่</span>
            <button onClick={() => toggleSort('days')} style={thBtnStyle}>จำนวน <SortIcon k="days" /></button>
            <button onClick={() => toggleSort('ai_score')} style={thBtnStyle}>AI <SortIcon k="ai_score" /></button>
            <span>สถานะ</span>
            <span>หัวหน้า</span>
            <button onClick={() => toggleSort('submitted_at')} style={thBtnStyle}>ยื่นเมื่อ <SortIcon k="submitted_at" /></button>
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: T.inkFaint, fontSize: 13 }}>ไม่พบรายการ</div>
            )}
            {filtered.map(req => (
              <div key={req.id} onClick={() => setSelected(selected?.id === req.id ? null : req)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.4fr 1fr 80px 80px 1fr 72px',
                  padding: '11px 20px', gap: 12, alignItems: 'center',
                  borderBottom: `1px solid ${T.hairlineSoft}`,
                  background: selected?.id === req.id ? T.brandTint : 'transparent',
                  cursor: 'pointer', transition: 'background .1s', fontSize: 13,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avatar initial={req.employee?.initial ?? '?'} tone={req.employee?.avatar_tone ?? 'brand'} size={28} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.employee?.full_name}</div>
                    <div style={{ fontSize: 11, color: T.inkFaint }}>{req.employee?.department}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <LeaveTypeBadge type={req.leave_type} />
                  <span style={{ fontSize: 11, color: T.inkFaint }}>{req.start_date}{req.start_date !== req.end_date ? ` – ${req.end_date}` : ''}</span>
                </div>
                <span style={{ fontWeight: 500 }}>{req.days} วัน</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: req.ai_score == null ? T.inkFaint : req.ai_score >= 80 ? T.good : req.ai_score >= 50 ? T.warn : T.bad }}>
                  {req.ai_score ?? '—'}
                </span>
                <StatusChip status={req.status} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.inkSoft }}>
                  {req.approver ? (
                    <>
                      <Avatar initial={req.approver.initial} tone={req.approver.avatar_tone} size={20} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.approver.full_name}</span>
                    </>
                  ) : <span style={{ color: T.inkFaint }}>—</span>}
                </div>
                <span style={{ color: T.inkFaint, fontSize: 12 }}>{format(parseISO(req.submitted_at), 'd MMM', { locale: th })}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 20px', borderTop: `1px solid ${T.hairline}`, background: T.paper, display: 'flex', gap: 24, fontSize: 12, color: T.inkFaint }}>
            <span>ทั้งหมด <strong style={{ color: T.ink }}>{stats.total}</strong></span>
            <span>อนุมัติ <strong style={{ color: T.good }}>{stats.approved}</strong></span>
            <span>ปฏิเสธ <strong style={{ color: T.bad }}>{stats.rejected}</strong></span>
            <span>รอ <strong style={{ color: T.warn }}>{stats.pending}</strong></span>
            <span style={{ marginLeft: 'auto' }}>วันลารวม <strong style={{ color: T.ink }}>{stats.totalDays} วัน</strong></span>
          </div>
        </div>

        {/* Right — detail */}
        {selected && (
          <div style={{ width: 340, borderLeft: `1px solid ${T.hairline}`, background: T.paper, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.15s ease-out', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>รายละเอียด</div>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.inkFaint, fontSize: 16, padding: 4 }}>✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initial={selected.employee?.initial ?? '?'} tone={selected.employee?.avatar_tone ?? 'brand'} size={40} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.employee?.full_name}</div>
                <div style={{ fontSize: 12, color: T.inkFaint }}>{selected.employee?.department}</div>
              </div>
            </div>

            <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <DetailRow label="Ref">{selected.ref_no}</DetailRow>
              <DetailRow label="ประเภท"><LeaveTypeBadge type={selected.leave_type} /></DetailRow>
              <DetailRow label="วันที่">{selected.start_date}{selected.start_date !== selected.end_date ? ` – ${selected.end_date}` : ''}</DetailRow>
              <DetailRow label="จำนวน">{selected.days} วัน</DetailRow>
              {selected.reason && <DetailRow label="เหตุผล">{selected.reason}</DetailRow>}
              <DetailRow label="ยื่นเมื่อ">{format(parseISO(selected.submitted_at), 'd MMM yyyy HH:mm', { locale: th })}</DetailRow>
              <DetailRow label="สถานะ"><StatusChip status={selected.status} /></DetailRow>
              {selected.approver && <DetailRow label="หัวหน้า">{selected.approver.full_name}</DetailRow>}
            </Card>

            {selected.ai_score !== null && (
              <Card style={{ padding: 14, background: T.accentTint, border: `1px solid ${T.accentSoft}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8a5a1f' }}>✦ AI วิเคราะห์</div>
                {selected.ai_summary && <div style={{ fontSize: 13 }}>{selected.ai_summary}</div>}
                <ScoreBar score={selected.ai_score} />
                {selected.ai_recommendation && <Chip kind="ai">แนะนำ: {selected.ai_recommendation}</Chip>}
              </Card>
            )}

            {selected.status === 'pending' && (
              <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>ดำเนินการ (HR)</div>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="ความเห็น (ไม่บังคับ)…" rows={2}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: `1px solid ${T.hairline}`, borderRadius: 8, background: T.surface, fontFamily: 'inherit', outline: 'none', resize: 'none' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="primary" size="sm" onClick={() => handleAction('approve')} disabled={loading !== null} style={{ flex: 1, justifyContent: 'center' }}>
                    ✓ อนุมัติ
                  </Btn>
                  <Btn variant="danger" size="sm" onClick={() => handleAction('reject')} disabled={loading !== null} style={{ flex: 1, justifyContent: 'center' }}>
                    ✕ ปฏิเสธ
                  </Btn>
                </div>
              </Card>
            )}

            {selected.approved_at && (
              <Card style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{selected.status === 'approved' ? '✓ อนุมัติแล้ว' : '✕ ปฏิเสธแล้ว'}</div>
                <div style={{ fontSize: 12, color: T.inkFaint }}>{format(parseISO(selected.approved_at), 'd MMM yyyy HH:mm', { locale: th })}</div>
                {selected.approver_comment && <div style={{ fontSize: 13, color: T.inkSoft }}>{selected.approver_comment}</div>}
              </Card>
            )}
          </div>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </AppShell>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ color: T.inkFaint, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{children}</span>
    </div>
  )
}

const thBtnStyle: React.CSSProperties = {
  border: 'none', background: 'none', cursor: 'pointer', padding: 0,
  fontSize: 11, color: 'inherit', fontFamily: 'inherit',
  textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left',
}

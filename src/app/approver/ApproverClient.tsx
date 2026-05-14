'use client'
import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { AppShell } from '@/components/AppShell'
import { Avatar, Btn, Card, AICard, Chip, LeaveTypeBadge, ScoreBar, StatusChip, Toast, Spinner } from '@/components/ui'
import { T } from '@/lib/tokens'
import { LeaveRequest, LeaveRequestWithEmployee, Profile } from '@/types'

type Filter = 'pending' | 'approved' | 'rejected' | 'all'

export function ApproverClient({ profile, requests: initial }: {
  profile: Profile
  requests: LeaveRequestWithEmployee[]
}) {
  const [requests, setRequests] = useState(initial)
  const [selected, setSelected] = useState<LeaveRequestWithEmployee | null>(null)
  const [filter, setFilter] = useState<Filter>('pending')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'good' | 'bad' | 'ai' } | null>(null)

  const showToast = (msg: string, type: 'good' | 'bad' | 'ai' = 'good') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

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
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')

      const updated = data.request as LeaveRequestWithEmployee
      updated.employee = selected.employee

      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
      setSelected(updated)
      setComment('')
      showToast(action === 'approve' ? 'อนุมัติคำขอแล้ว ✓' : 'ปฏิเสธคำขอแล้ว', action === 'approve' ? 'good' : 'bad')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      showToast(msg, 'bad')
    } finally {
      setLoading(null)
    }
  }

  const recColor = { 'อนุมัติ': T.good, 'ปฏิเสธ': T.bad, 'ตรวจสอบเพิ่มเติม': T.warn } as const

  return (
    <AppShell profile={profile} pendingCount={pendingCount}>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* Left: request list */}
        <div style={{
          width: 340, flexShrink: 0, borderRight: `1px solid ${T.hairline}`,
          display: 'flex', flexDirection: 'column', background: T.paper, overflow: 'hidden',
        }}>
          {/* Filter tabs */}
          <div style={{
            display: 'flex', gap: 2, padding: '12px 12px 0',
            borderBottom: `1px solid ${T.hairline}`, paddingBottom: 12,
          }}>
            {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map(f => {
              const labels = { pending: `รอ (${pendingCount})`, approved: 'อนุมัติ', rejected: 'ปฏิเสธ', all: 'ทั้งหมด' }
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  flex: 1, padding: '6px 4px', fontSize: 12, fontWeight: filter === f ? 600 : 400,
                  border: 'none', background: filter === f ? T.brandTint : 'transparent',
                  color: filter === f ? T.brandDeep : T.inkSoft,
                  borderRadius: 7, cursor: 'pointer', transition: 'all .12s',
                }}>{labels[f]}</button>
              )
            })}
          </div>

          {/* Request list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: T.inkFaint, fontSize: 13 }}>
                ไม่มีคำขอ
              </div>
            )}
            {filtered.map(req => (
              <div
                key={req.id}
                onClick={() => { setSelected(req); setComment('') }}
                style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  marginBottom: 4, transition: 'all .12s',
                  background: selected?.id === req.id ? T.brandTint : 'transparent',
                  border: `1px solid ${selected?.id === req.id ? T.brandSoft : 'transparent'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Avatar initial={req.employee?.initial ?? '?'} tone={req.employee?.avatar_tone ?? 'brand'} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.employee?.full_name}
                    </div>
                    <div style={{ fontSize: 11, color: T.inkFaint }}>{req.employee?.department}</div>
                  </div>
                  <StatusChip status={req.status} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <LeaveTypeBadge type={req.leave_type} />
                  <span style={{ color: T.inkFaint }}>{req.days} วัน</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ color: T.inkFaint }}>
                    {format(parseISO(req.submitted_at), 'd MMM', { locale: th })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: detail panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.inkFaint, gap: 8 }}>
              <div style={{ fontSize: 32 }}>📋</div>
              <div style={{ fontSize: 14 }}>เลือกคำขอเพื่อดูรายละเอียด</div>
            </div>
          ) : (
            <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <Avatar initial={selected.employee?.initial ?? '?'} tone={selected.employee?.avatar_tone ?? 'brand'} size={48} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{selected.employee?.full_name}</div>
                  <div style={{ fontSize: 13, color: T.inkFaint }}>{selected.employee?.department}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <StatusChip status={selected.status} />
                  <span style={{ fontSize: 12, color: T.inkFaint }}>{selected.ref_no}</span>
                </div>
              </div>

              {/* Details */}
              <Card style={{ padding: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 14 }}>
                  <InfoRow label="ประเภทการลา"><LeaveTypeBadge type={selected.leave_type} /></InfoRow>
                  <InfoRow label="จำนวน">{selected.days} วัน</InfoRow>
                  <InfoRow label="วันที่เริ่ม">{selected.start_date}</InfoRow>
                  <InfoRow label="วันที่สิ้นสุด">{selected.end_date}</InfoRow>
                  {selected.reason && (
                    <div style={{ gridColumn: '1/-1' }}>
                      <InfoRow label="เหตุผล">{selected.reason}</InfoRow>
                    </div>
                  )}
                  <InfoRow label="ยื่นเมื่อ">
                    {format(parseISO(selected.submitted_at), 'd MMM yyyy HH:mm', { locale: th })}
                  </InfoRow>
                </div>
              </Card>

              {/* AI panel */}
              {selected.ai_score !== null && (
                <AICard style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#8a5a1f' }}>✦ AI วิเคราะห์</span>
                    {selected.ai_recommendation && (
                      <Chip kind="ai" style={{ fontSize: 12 }}>
                        แนะนำ: {selected.ai_recommendation}
                      </Chip>
                    )}
                  </div>
                  {selected.ai_summary && (
                    <div style={{ fontSize: 14 }}>{selected.ai_summary}</div>
                  )}
                  <div>
                    <div style={{ fontSize: 12, color: T.inkFaint, marginBottom: 6 }}>ความมั่นใจ</div>
                    <ScoreBar score={selected.ai_score} />
                  </div>
                  {selected.ai_flags && selected.ai_flags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selected.ai_flags.map(f => (
                        <Chip key={f} kind="warn" style={{ fontSize: 11 }}>{f}</Chip>
                      ))}
                    </div>
                  )}
                </AICard>
              )}

              {/* Action: approve / reject */}
              {selected.status === 'pending' && (
                <Card style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>ดำเนินการ</div>
                  <div>
                    <label style={{ fontSize: 13, color: T.inkSoft, display: 'block', marginBottom: 6 }}>
                      ความเห็น <span style={{ color: T.inkFaint }}>(ไม่บังคับ)</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="ระบุเหตุผลหรือเงื่อนไขเพิ่มเติม…"
                      rows={3}
                      style={{
                        width: '100%', padding: '8px 12px', fontSize: 14,
                        border: `1px solid ${T.hairline}`, borderRadius: 8,
                        background: T.surface, color: T.ink, fontFamily: 'inherit',
                        outline: 'none', resize: 'vertical', lineHeight: 1.5,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Btn
                      variant="primary" size="lg"
                      onClick={() => handleAction('approve')}
                      disabled={loading !== null}
                      style={{ flex: 1 }}
                    >
                      {loading === 'approve' ? <Spinner size={14} /> : '✓'} อนุมัติ
                    </Btn>
                    <Btn
                      variant="danger" size="lg"
                      onClick={() => handleAction('reject')}
                      disabled={loading !== null}
                      style={{ flex: 1 }}
                    >
                      {loading === 'reject' ? <Spinner size={14} /> : '✕'} ปฏิเสธ
                    </Btn>
                  </div>
                </Card>
              )}

              {/* Already decided */}
              {selected.status !== 'pending' && selected.approved_at && (
                <Card style={{ padding: 14, fontSize: 13, color: T.inkSoft }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {selected.status === 'approved' ? '✓ อนุมัติแล้ว' : '✕ ปฏิเสธแล้ว'} · {format(parseISO(selected.approved_at), 'd MMM yyyy', { locale: th })}
                  </div>
                  {selected.approver_comment && <div>{selected.approver_comment}</div>}
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </AppShell>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{children}</div>
    </div>
  )
}

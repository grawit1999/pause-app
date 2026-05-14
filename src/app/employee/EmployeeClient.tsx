'use client'
import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { AppShell } from '@/components/AppShell'
import { Avatar, Btn, Card, AICard, Chip, LeaveTypeBadge, QuotaBar, ScoreBar, StatusChip, Toast, Spinner } from '@/components/ui'
import { T } from '@/lib/tokens'
import { LeaveQuota, LeaveRequest, LeaveType, Profile } from '@/types'

const leaveTypes: LeaveType[] = ['ลาพักร้อน', 'ลากิจ', 'ลาป่วย']

type Step = 'idle' | 'form' | 'submitting' | 'result'

interface SubmitResult {
  request: LeaveRequest
  ai: { score: number; recommendation: string; summary: string; reasoning: string; flags: string[] } | null
}

export function EmployeeClient({ profile, quotas, recentRequests }: {
  profile: Profile
  quotas: LeaveQuota[]
  recentRequests: LeaveRequest[]
}) {
  const [step, setStep] = useState<Step>('idle')
  const [leaveType, setLeaveType] = useState<LeaveType>('ลาพักร้อน')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'good' | 'bad' | 'ai' } | null>(null)
  const [requests, setRequests] = useState(recentRequests)

  const showToast = (msg: string, type: 'good' | 'bad' | 'ai' = 'good') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    setStep('submitting')
    try {
      const res = await fetch('/api/leave/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave_type: leaveType, start_date: startDate, end_date: endDate, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')
      setResult(data)
      setRequests(prev => [data.request, ...prev].slice(0, 5))
      setStep('result')
      showToast('ส่งคำขอลาแล้ว — หัวหน้าจะได้รับแจ้งทันที ✦', 'ai')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
      showToast(msg, 'bad')
      setStep('form')
    }
  }

  const resetForm = () => {
    setStep('idle')
    setLeaveType('ลาพักร้อน')
    setStartDate('')
    setEndDate('')
    setReason('')
    setResult(null)
  }

  const quotaByType = Object.fromEntries(quotas.map(q => [q.leave_type, q]))

  return (
    <AppShell profile={profile}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar initial={profile.initial} tone={profile.avatar_tone} size={48} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>สวัสดี, {profile.full_name.split(' ')[0]} 👋</div>
            <div style={{ fontSize: 13, color: T.inkFaint }}>{profile.department}</div>
          </div>
        </div>

        {/* Quota cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {leaveTypes.map(type => {
            const q = quotaByType[type]
            const used = q?.used_days ?? 0
            const total = q?.total_days ?? 0
            const remaining = total - used
            const pct = total > 0 ? Math.round((used / total) * 100) : 0
            const color = pct >= 90 ? T.bad : pct >= 70 ? T.warn : T.good
            return (
              <Card key={type} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <LeaveTypeBadge type={type} />
                <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{remaining}</div>
                <div style={{ fontSize: 12, color: T.inkFaint }}>เหลือจาก {total} วัน</div>
                <QuotaBar label="" used={used} total={total} />
              </Card>
            )
          })}
        </div>

        {/* Leave form / result */}
        {step === 'idle' && (
          <Card style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>ยื่นคำขอลา</div>
            <Btn variant="primary" size="lg" onClick={() => setStep('form')}>
              + ยื่นคำขอใหม่
            </Btn>
          </Card>
        )}

        {(step === 'form' || step === 'submitting') && (
          <Card style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>คำขอลาใหม่</div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Leave type */}
              <div>
                <label style={{ fontSize: 13, color: T.inkSoft, display: 'block', marginBottom: 8 }}>ประเภทการลา</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {leaveTypes.map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setLeaveType(t)}
                      style={{
                        padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        border: `1px solid ${leaveType === t ? T.brand : T.hairline}`,
                        background: leaveType === t ? T.brandTint : T.surface,
                        color: leaveType === t ? T.brandDeep : T.inkSoft,
                        cursor: 'pointer', transition: 'all .12s',
                      }}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: T.inkSoft, display: 'block', marginBottom: 6 }}>วันที่เริ่ม</label>
                  <input
                    type="date" required value={startDate}
                    onChange={e => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value) }}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: T.inkSoft, display: 'block', marginBottom: 6 }}>วันที่สิ้นสุด</label>
                  <input
                    type="date" required value={endDate} min={startDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label style={{ fontSize: 13, color: T.inkSoft, display: 'block', marginBottom: 6 }}>
                  เหตุผล <span style={{ color: T.inkFaint }}>(ไม่บังคับ)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="เช่น ลาป่วยเป็นไข้, ธุระครอบครัว..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn variant="ghost" onClick={resetForm} disabled={step === 'submitting'}>ยกเลิก</Btn>
                <Btn variant="primary" type="submit" disabled={step === 'submitting' || !startDate || !endDate}>
                  {step === 'submitting' ? <><Spinner size={14} /> AI กำลังวิเคราะห์…</> : 'ส่งคำขอ'}
                </Btn>
              </div>
            </form>
          </Card>
        )}

        {step === 'result' && result && (
          <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: T.goodSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>✓</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>ส่งคำขอแล้ว</div>
                <div style={{ fontSize: 12, color: T.inkFaint }}>{result.request.ref_no}</div>
              </div>
              <div style={{ flex: 1 }} />
              <StatusChip status="pending" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, fontSize: 13 }}>
              <div><span style={{ color: T.inkFaint }}>ประเภท </span><LeaveTypeBadge type={result.request.leave_type} /></div>
              <div><span style={{ color: T.inkFaint }}>วันที่ </span>{result.request.start_date} – {result.request.end_date}</div>
              <div><span style={{ color: T.inkFaint }}>จำนวน </span><strong>{result.request.days} วัน</strong></div>
            </div>

            {result.ai && (
              <AICard style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#8a5a1f' }}>
                  <span>✦</span> ผล AI วิเคราะห์
                </div>
                <div style={{ fontSize: 14 }}>{result.ai.summary}</div>
                <ScoreBar score={result.ai.score} />
                <div style={{ fontSize: 13, color: T.inkSoft }}>{result.ai.reasoning}</div>
                {result.ai.flags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {result.ai.flags.map(f => (
                      <Chip key={f} kind="warn" style={{ fontSize: 11 }}>{f}</Chip>
                    ))}
                  </div>
                )}
              </AICard>
            )}

            <Btn variant="primary" onClick={resetForm}>ยื่นคำขอใหม่</Btn>
          </Card>
        )}

        {/* Recent requests */}
        {requests.length > 0 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: T.inkSoft }}>คำขอล่าสุด</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requests.map(req => (
                <Card key={req.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <LeaveTypeBadge type={req.leave_type} />
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <span style={{ fontWeight: 500 }}>{req.start_date}</span>
                    {req.start_date !== req.end_date && <span> – {req.end_date}</span>}
                    <span style={{ color: T.inkFaint }}> · {req.days} วัน</span>
                    {req.reason && <span style={{ color: T.inkFaint }}> · {req.reason}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: T.inkFaint }}>
                    {format(parseISO(req.submitted_at), 'd MMM', { locale: th })}
                  </div>
                  <StatusChip status={req.status} />
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </AppShell>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: 14,
  border: `1px solid ${T.hairline}`, borderRadius: 8,
  background: T.surface, color: T.ink, fontFamily: 'inherit',
  outline: 'none',
}

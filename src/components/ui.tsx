'use client'
import React from 'react'
import { avatarTones, statusColor, statusLabel, T } from '@/lib/tokens'
import { LeaveStatus } from '@/types'

// ── Avatar ───────────────────────────────────────────────────────────────
export function Avatar({ initial = '?', tone = 'brand', size = 32 }: {
  initial?: string; tone?: string; size?: number
}) {
  const c = avatarTones[tone] ?? avatarTones.brand
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600, flexShrink: 0,
      background: c.bg, color: c.fg,
    }}>{initial}</span>
  )
}

// ── StatusChip ───────────────────────────────────────────────────────────
export function StatusChip({ status }: { status: LeaveStatus }) {
  const c = statusColor[status] ?? statusColor.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', fontSize: 12, fontWeight: 500,
      borderRadius: 999, background: c.bg, color: c.fg,
      border: '1px solid transparent',
    }}>{statusLabel[status]}</span>
  )
}

// ── Chip ─────────────────────────────────────────────────────────────────
type ChipKind = 'default' | 'brand' | 'good' | 'warn' | 'bad' | 'ai' | 'outline'
const chipStyles: Record<ChipKind, React.CSSProperties> = {
  default: { background: T.surface2,   color: T.inkSoft },
  brand:   { background: T.brandTint,  color: T.brandDeep },
  good:    { background: T.goodSoft,   color: T.good },
  warn:    { background: T.warnSoft,   color: T.warn },
  bad:     { background: T.badSoft,    color: T.bad },
  ai:      { background: T.accentTint, color: '#8a5a1f' },
  outline: { background: 'transparent', border: `1px solid ${T.hairline}`, color: T.inkSoft },
}
export function Chip({ children, kind = 'default', style }: {
  children: React.ReactNode; kind?: ChipKind; style?: React.CSSProperties
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', fontSize: 12, fontWeight: 500,
      borderRadius: 999, border: '1px solid transparent',
      whiteSpace: 'nowrap', ...chipStyles[kind], ...style,
    }}>{children}</span>
  )
}

// ── Btn ──────────────────────────────────────────────────────────────────
type BtnVariant = 'default' | 'primary' | 'ghost' | 'danger' | 'amber'
type BtnSize = 'sm' | 'md' | 'lg'
const btnVariants: Record<BtnVariant, React.CSSProperties> = {
  default: { background: T.surface,  color: T.ink,     borderColor: T.hairline },
  primary: { background: T.brand,    color: '#fff',     borderColor: T.brand },
  ghost:   { background: 'transparent', color: T.inkSoft, borderColor: 'transparent' },
  danger:  { background: T.surface,  color: T.bad,     borderColor: T.badSoft },
  amber:   { background: T.accent,   color: '#fff',     borderColor: T.accent },
}
const btnSizes: Record<BtnSize, React.CSSProperties> = {
  sm: { padding: '5px 10px', fontSize: 13 },
  md: { padding: '8px 14px', fontSize: 14 },
  lg: { padding: '11px 18px', fontSize: 15, borderRadius: 10 },
}
export function Btn({ children, variant = 'default', size = 'md', onClick, disabled, style, type = 'button' }: {
  children: React.ReactNode
  variant?: BtnVariant
  size?: BtnSize
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
  type?: 'button' | 'submit' | 'reset'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1px solid', borderRadius: 9,
        fontFamily: 'inherit', fontWeight: 500,
        transition: 'all .12s', whiteSpace: 'nowrap',
        opacity: disabled ? 0.45 : 1,
        ...btnSizes[size], ...btnVariants[variant], ...style,
      }}
    >{children}</button>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick }: {
  children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void
}) {
  return (
    <div onClick={onClick} style={{
      background: T.surface, border: `1px solid ${T.hairline}`,
      borderRadius: 12, ...style,
      cursor: onClick ? 'pointer' : undefined,
    }}>{children}</div>
  )
}

// ── AICard ───────────────────────────────────────────────────────────────
export function AICard({ children, style }: {
  children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: T.accentTint,
      border: `1px solid ${T.accentSoft}`,
      borderRadius: 12, ...style,
    }}>{children}</div>
  )
}

// ── Spinner ──────────────────────────────────────────────────────────────
export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid ${T.hairline}`,
      borderTopColor: T.brand,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}

// ── ScoreBar ─────────────────────────────────────────────────────────────
export function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? T.good : score >= 50 ? T.warn : T.bad
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 6, background: T.hairline, borderRadius: 99, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${score}%`,
          background: color, borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, minWidth: 32, textAlign: 'right' }}>
        {score}
      </span>
    </div>
  )
}

// ── LeaveTypeBadge ────────────────────────────────────────────────────────
const leaveTypeStyle: Record<string, ChipKind> = {
  'ลาพักร้อน': 'brand',
  'ลากิจ': 'warn',
  'ลาป่วย': 'bad',
}
export function LeaveTypeBadge({ type }: { type: string }) {
  return <Chip kind={leaveTypeStyle[type] ?? 'default'}>{type}</Chip>
}

// ── QuotaBar ──────────────────────────────────────────────────────────────
export function QuotaBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const color = pct >= 90 ? T.bad : pct >= 70 ? T.warn : T.good
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: T.inkSoft }}>{label}</span>
        <span style={{ color: T.inkFaint }}>{used}/{total} วัน</span>
      </div>
      <div style={{ height: 5, background: T.hairline, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ msg, type = 'good' }: { msg: string; type?: 'good' | 'bad' | 'ai' }) {
  const colors = {
    good: { bg: T.goodSoft, color: T.good, border: T.good },
    bad:  { bg: T.badSoft,  color: T.bad,  border: T.bad },
    ai:   { bg: T.accentTint, color: '#8a5a1f', border: T.accent },
  }
  const c = colors[type]
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500,
      zIndex: 9999, animation: 'fadeIn 0.2s ease-out',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>{msg}</div>
  )
}

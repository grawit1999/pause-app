'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { T } from '@/lib/tokens'
import { Avatar } from './ui'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'

function Logo() {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: T.ink }}>
      <span style={{
        width: 32, height: 32, borderRadius: 9,
        background: T.brand, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <path d="M11 2C8 2 5.5 4 4.5 6.5C3.5 9 4 11.5 4 12C4 12 6.5 12 9 10.5C11.5 9 12 6 12 4.5C12 3 11 2 11 2Z"
            stroke="#fff" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M4.5 12L7 8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </span>
      <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
        Pause<span style={{ color: T.brand }}>.</span>
      </span>
    </Link>
  )
}

function NavItem({ href, label, badge }: { href: string; label: string; badge?: number }) {
  const pathname = usePathname()
  const active = pathname.startsWith(href)
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 12px', borderRadius: 8,
      fontSize: 14, fontWeight: active ? 600 : 400,
      textDecoration: 'none',
      color: active ? T.brand : T.inkSoft,
      background: active ? T.brandTint : 'transparent',
      transition: 'all .12s',
    }}>
      {label}
      {badge ? (
        <span style={{
          background: T.accent, color: '#fff',
          borderRadius: 999, fontSize: 11, fontWeight: 700,
          padding: '1px 6px', lineHeight: 1.4,
        }}>{badge}</span>
      ) : null}
    </Link>
  )
}

export function AppShell({ profile, pendingCount = 0, children }: {
  profile: Profile
  pendingCount?: number
  children: React.ReactNode
}) {
  const router = useRouter()
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  const navByRole: Record<string, { href: string; label: string; badge?: number }[]> = {
    employee: [
      { href: '/employee', label: 'ลางาน' },
      { href: '/employee/history', label: 'ประวัติ' },
    ],
    approver: [
      { href: '/approver', label: 'Inbox', badge: pendingCount || undefined },
      { href: '/approver/history', label: 'ประวัติ' },
    ],
    hr: [
      { href: '/hr', label: 'ภาพรวม' },
      { href: '/hr/requests', label: 'คำขอทั้งหมด' },
      { href: '/hr/quotas', label: 'โควต้า' },
    ],
    admin: [
      { href: '/hr', label: 'ภาพรวม' },
      { href: '/hr/requests', label: 'คำขอทั้งหมด' },
      { href: '/hr/quotas', label: 'โควต้า' },
    ],
  }

  const navItems = navByRole[profile.role] ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Topbar */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', gap: 16,
        padding: '0 20px', background: T.paper,
        borderBottom: `1px solid ${T.hairline}`,
        flexShrink: 0,
      }}>
        <Logo />
        <div style={{ width: 1, height: 20, background: T.hairline }} />
        <nav style={{ display: 'flex', gap: 2 }}>
          {navItems.map(item => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{profile.full_name}</div>
            <div style={{ fontSize: 11, color: T.inkFaint }}>
              {profile.department} · {{
                employee: 'พนักงาน', approver: 'หัวหน้า', hr: 'HR', admin: 'Admin'
              }[profile.role]}
            </div>
          </div>
          <Avatar initial={profile.initial} tone={profile.avatar_tone} size={34} />
          <button
            onClick={() => setShowLogoutDialog(true)}
            title="ออกจากระบบ"
            style={{
              marginLeft: 4, padding: '6px 8px', borderRadius: 8,
              border: `1px solid ${T.hairline}`, background: 'transparent',
              color: T.inkFaint, cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center',
              transition: 'all .12s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = T.badSoft
              ;(e.currentTarget as HTMLButtonElement).style.color = T.bad
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = T.bad
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = T.inkFaint
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = T.hairline
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M6 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M10 10l3-2.5L10 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto', background: T.paper2 }}>
        {children}
      </main>

      {/* Logout dialog */}
      {showLogoutDialog && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowLogoutDialog(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 100,
              animation: 'fadeIn 0.15s ease-out',
            }}
          />
          {/* Dialog */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: T.surface, borderRadius: 16,
            border: `1px solid ${T.hairline}`,
            padding: 28, width: 320,
            zIndex: 101,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            animation: 'fadeIn 0.15s ease-out',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: T.badSoft, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
                  <path d="M6 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" stroke={T.bad} strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M10 10l3-2.5L10 5" stroke={T.bad} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 7.5H6" stroke={T.bad} strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>ออกจากระบบ?</div>
                <div style={{ fontSize: 13, color: T.inkFaint, marginTop: 2 }}>
                  {profile.full_name}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowLogoutDialog(false)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, fontWeight: 500,
                  border: `1px solid ${T.hairline}`, background: T.surface,
                  color: T.inkSoft, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >ยกเลิก</button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, fontWeight: 500,
                  border: `1px solid ${T.bad}`, background: T.bad,
                  color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >ออกจากระบบ</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

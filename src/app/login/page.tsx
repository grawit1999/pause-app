'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { T } from '@/lib/tokens'
import { Btn, Spinner } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.paper2, padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: T.surface, border: `1px solid ${T.hairline}`,
        borderRadius: 16, padding: 32,
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 40, height: 40, borderRadius: 11, background: T.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
              <path d="M11 2C8 2 5.5 4 4.5 6.5C3.5 9 4 11.5 4 12C4 12 6.5 12 9 10.5C11.5 9 12 6 12 4.5C12 3 11 2 11 2Z"
                stroke="#fff" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M4.5 12L7 8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </span>
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Pause<span style={{ color: T.brand }}>.</span>
          </span>
        </div>

        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>เข้าสู่ระบบ</div>
          <div style={{ fontSize: 13, color: T.inkFaint, marginTop: 4 }}>ระบบลางาน + AI</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: T.inkSoft, display: 'block', marginBottom: 6 }}>อีเมล</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: T.inkSoft, display: 'block', marginBottom: 6 }}>รหัสผ่าน</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: T.bad, background: T.badSoft, padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <Btn variant="primary" size="lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? <><Spinner size={14} /> กำลังเข้าสู่ระบบ…</> : 'เข้าสู่ระบบ'}
          </Btn>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 14,
  border: `1px solid ${T.hairline}`, borderRadius: 8,
  background: T.surface, color: T.ink, fontFamily: 'inherit',
  outline: 'none',
}

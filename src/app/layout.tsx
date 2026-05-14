import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pause. — ระบบลางาน',
  description: 'ระบบลางานอัจฉริยะด้วย AI สำหรับองค์กร',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" style={{ height: '100%' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ height: '100%', margin: 0 }}>{children}</body>
    </html>
  )
}

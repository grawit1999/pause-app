// Design tokens — mirrors proto-shared.jsx
export const T = {
  paper: '#faf7f0',
  paper2: '#f3ede0',
  surface: '#ffffff',
  surface2: '#f7f3ea',
  ink: '#1a1a1a',
  inkSoft: '#5a554c',
  inkFaint: '#94897a',
  hairline: '#e8e2d3',
  hairlineSoft: '#efebe1',
  brand: '#1d4a3e',
  brandSoft: '#d8e3dd',
  brandTint: '#ecf1ee',
  brandDeep: '#143329',
  accent: '#d4923a',
  accentSoft: '#f6e6c8',
  accentTint: '#fbf3e2',
  good: '#3d7a52',
  goodSoft: '#dde9df',
  warn: '#b8842e',
  warnSoft: '#f3e6c8',
  bad: '#a8523f',
  badSoft: '#ecd6cf',
} as const

export const avatarTones: Record<string, { bg: string; fg: string }> = {
  brand:  { bg: T.brandTint,  fg: T.brandDeep },
  amber:  { bg: T.accentTint, fg: '#8a5a1f' },
  sky:    { bg: '#dbe7ef',    fg: '#355d75' },
  lilac:  { bg: '#e6dfee',    fg: '#5b4979' },
  rose:   { bg: '#f4dfd8',    fg: '#8c4534' },
  olive:  { bg: '#e2e3cf',    fg: '#545d2e' },
  ai:     { bg: T.accent,     fg: '#fff' },
}

export const statusColor: Record<string, { bg: string; fg: string }> = {
  pending:   { bg: T.warnSoft,  fg: T.warn },
  approved:  { bg: T.goodSoft,  fg: T.good },
  rejected:  { bg: T.badSoft,   fg: T.bad },
  cancelled: { bg: T.hairline,  fg: T.inkFaint },
}

export const statusLabel: Record<string, string> = {
  pending:   'รอดำเนินการ',
  approved:  'อนุมัติ',
  rejected:  'ปฏิเสธ',
  cancelled: 'ยกเลิก',
}

export const leaveTypes = ['ลาพักร้อน', 'ลากิจ', 'ลาป่วย'] as const

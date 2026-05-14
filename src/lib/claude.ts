import { AIAnalysis, LeaveQuota, LeaveType } from '@/types'

const USE_MOCK = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key'

interface AnalyzeParams {
  employeeName: string
  department: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  quotas: LeaveQuota[]
  recentHistory: { leave_type: LeaveType; days: number; status: string; start_date: string }[]
}

function mockAnalyze(params: AnalyzeParams): AIAnalysis {
  const quotaForType = params.quotas.find(q => q.leave_type === params.leaveType)
  const remaining = quotaForType
    ? quotaForType.total_days - quotaForType.used_days - params.days
    : null

  const flags: string[] = []

  // quota exceeded
  if (remaining !== null && remaining < 0) {
    flags.push('quota_exceeded')
  } else if (remaining !== null && remaining <= 2) {
    flags.push('quota_low')
  }

  // long duration
  if (params.days >= 5) flags.push('long_duration')

  // no reason
  if (!params.reason.trim() && params.leaveType !== 'ลาป่วย') flags.push('no_reason')

  // frequent monday — check if start date is Monday
  const dow = new Date(params.startDate).getDay()
  const mondayCount = params.recentHistory.filter(r =>
    r.leave_type === 'ลาป่วย' && new Date(r.start_date).getDay() === 1
  ).length
  if (dow === 1 && mondayCount >= 2) flags.push('frequent_monday')

  const quotaExceeded = flags.includes('quota_exceeded')
  const score = quotaExceeded ? 25 : flags.includes('quota_low') ? 65 : params.days >= 5 ? 72 : 91
  const recommendation: AIAnalysis['recommendation'] = quotaExceeded
    ? 'ปฏิเสธ'
    : flags.length >= 2
    ? 'ตรวจสอบเพิ่มเติม'
    : 'อนุมัติ'

  const summary = `${params.employeeName} ขอ${params.leaveType} ${params.days} วัน (${params.startDate}${params.days > 1 ? ` – ${params.endDate}` : ''})${params.reason ? ` เหตุผล: ${params.reason}` : ''}`

  const reasoning = quotaExceeded
    ? `โควต้า${params.leaveType}ไม่เพียงพอ เหลือ ${quotaForType ? quotaForType.total_days - quotaForType.used_days : 0} วัน แต่ขอ ${params.days} วัน ควรปฏิเสธหรือขอปรับจำนวนวัน`
    : flags.includes('quota_low')
    ? `โควต้าเหลือน้อย (${remaining} วัน) ควรพิจารณาอนุมัติด้วยความระมัดระวัง`
    : `คำขอปกติ โควต้าเพียงพอ ไม่พบความผิดปกติ แนะนำอนุมัติ`

  return { score, recommendation, summary, flags, reasoning }
}

export async function analyzeLeaveRequest(params: AnalyzeParams): Promise<AIAnalysis> {
  if (USE_MOCK) return mockAnalyze(params)

  // Real Anthropic call — only reached when API key is set
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const quotaForType = params.quotas.find(q => q.leave_type === params.leaveType)
  const remaining = quotaForType
    ? quotaForType.total_days - quotaForType.used_days - params.days
    : null

  const prompt = `คุณคือ AI ผู้ช่วยระบบลางาน "Pause." วิเคราะห์คำขอลาและตอบเป็น JSON เท่านั้น

คำขอ: ${params.employeeName} (${params.department}) ขอ${params.leaveType} ${params.days} วัน (${params.startDate}–${params.endDate}) เหตุผล: "${params.reason}"
โควต้า: ${params.quotas.map(q => `${q.leave_type} เหลือ ${q.total_days - q.used_days}/${q.total_days}`).join(', ')}
${remaining !== null ? `หลังอนุมัติ: ${params.leaveType} เหลือ ${remaining} วัน` : ''}
ประวัติ 6 เดือน: ${params.recentHistory.length === 0 ? 'ไม่มี' : params.recentHistory.map(r => `${r.leave_type} ${r.days}วัน ${r.status}`).join(', ')}

ตอบ JSON: {"score":<0-100>,"recommendation":<"อนุมัติ"|"ปฏิเสธ"|"ตรวจสอบเพิ่มเติม">,"summary":"<1 ประโยค>","flags":[...],"reasoning":"<2-3 ประโยค>"}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: 'ตอบด้วย JSON เท่านั้น',
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = JSON.parse(text.trim())
  return {
    score: parsed.score,
    recommendation: parsed.recommendation,
    summary: parsed.summary,
    flags: parsed.flags ?? [],
    reasoning: parsed.reasoning,
  }
}

export type Role = 'employee' | 'approver' | 'hr' | 'admin'
export type AvatarTone = 'brand' | 'amber' | 'sky' | 'lilac' | 'rose' | 'olive'
export type LeaveType = 'ลาพักร้อน' | 'ลากิจ' | 'ลาป่วย'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type AIRecommendation = 'อนุมัติ' | 'ปฏิเสธ' | 'ตรวจสอบเพิ่มเติม'

export interface Profile {
  id: string
  full_name: string
  initial: string
  avatar_tone: AvatarTone
  role: Role
  department: string
  approver_id: string | null
  created_at: string
}

export interface LeaveQuota {
  id: string
  employee_id: string
  year: number
  leave_type: LeaveType
  total_days: number
  used_days: number
}

export interface LeaveRequest {
  id: string
  ref_no: string
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  days: number
  reason: string
  status: LeaveStatus
  ai_score: number | null
  ai_recommendation: AIRecommendation | null
  ai_summary: string | null
  ai_flags: string[]
  approver_id: string | null
  approver_comment: string | null
  approved_at: string | null
  submitted_at: string
  updated_at: string
  // joined
  employee?: Profile
  approver?: Profile
}

export interface LeaveRequestWithEmployee extends LeaveRequest {
  employee: Profile
}

export interface AIAnalysis {
  score: number
  recommendation: AIRecommendation
  summary: string
  flags: string[]
  reasoning: string
}

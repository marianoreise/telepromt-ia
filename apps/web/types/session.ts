export type SessionStatus = 'active' | 'ended' | 'expired'

export interface SessionDetail {
  id: string
  started_at: string
  ended_at: string | null
  duration_sec: number | null
  credits_used: number
  company: string
  job_title: string
  status: SessionStatus
  seconds_remaining: number | null
  language?: string
  transcript?: string | null
}

export interface SessionSummary {
  id: string
  started_at: string
  ended_at: string | null
  duration_sec: number | null
  credits_used: number
  company: string
  job_title: string
  status: SessionStatus
}

export interface CreateSessionPayload {
  company: string
  job_title: string
}

export interface ActiveSessionConflict {
  message: string
  active_session_id: string
}

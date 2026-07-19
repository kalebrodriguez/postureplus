import type { CalibrationProfile, CoachSettings, SessionGoal, SessionSummary } from '../types/posture'

const CAL_KEY = 'postureplus.calibration'
const SETTINGS_KEY = 'postureplus.settings'
const HISTORY_KEY = 'postureplus.sessionHistory'
const MAX_HISTORY = 40

const DEFAULT_SETTINGS: CoachSettings = {
  alertDelaySec: 30,
  alertMode: 'toast',
  goal: 'office',
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadCalibration(): CalibrationProfile | null {
  return readJson<CalibrationProfile | null>(CAL_KEY, null)
}

export function saveCalibration(profile: CalibrationProfile): void {
  localStorage.setItem(CAL_KEY, JSON.stringify(profile))
}

export function clearCalibration(): void {
  localStorage.removeItem(CAL_KEY)
}

export function loadSettings(): CoachSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<CoachSettings>>(SETTINGS_KEY, {}) }
}

export function saveSettings(settings: CoachSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadSessionHistory(): SessionSummary[] {
  const list = readJson<SessionSummary[]>(HISTORY_KEY, [])
  return Array.isArray(list) ? list : []
}

export function saveSessionSummary(entry: SessionSummary): SessionSummary[] {
  if (entry.durationMs < 20_000) return loadSessionHistory()
  const next = [entry, ...loadSessionHistory()].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  return next
}

export function clearSessionHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export interface ProgressInsight {
  weeklyGoodPercent: number | null
  sessionsThisWeek: number
  topIssue: string | null
  streakDays: number
  insight: string
}

export function buildProgressInsight(history: SessionSummary[]): ProgressInsight {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const week = history.filter((h) => h.endedAt >= weekAgo)
  const weeklyGoodPercent =
    week.length === 0
      ? null
      : Math.round(week.reduce((s, h) => s + h.goodPercent, 0) / week.length)

  const issueCounts = new Map<string, number>()
  for (const h of week) {
    if (!h.topIssue) continue
    issueCounts.set(h.topIssue, (issueCounts.get(h.topIssue) ?? 0) + 1)
  }
  let topIssue: string | null = null
  let topCount = 0
  for (const [issue, count] of issueCounts) {
    if (count > topCount) {
      topIssue = issue
      topCount = count
    }
  }

  // Simple consecutive-day streak where avg good% >= 60
  const byDay = new Map<string, number[]>()
  for (const h of history) {
    const key = new Date(h.endedAt).toISOString().slice(0, 10)
    const arr = byDay.get(key) ?? []
    arr.push(h.goodPercent)
    byDay.set(key, arr)
  }
  let streakDays = 0
  const day = new Date()
  for (;;) {
    const key = day.toISOString().slice(0, 10)
    const scores = byDay.get(key)
    if (!scores) break
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    if (avg < 60) break
    streakDays += 1
    day.setDate(day.getDate() - 1)
  }

  let insight =
    week.length === 0
      ? 'Complete a few coaching sessions to unlock weekly insights.'
      : `Across ${week.length} session${week.length === 1 ? '' : 's'} this week, you averaged ${weeklyGoodPercent}% good posture.`

  const declining = week.filter((h) => h.scoreTrend === 'declining').length
  if (declining >= Math.max(2, Math.floor(week.length / 2))) {
    insight =
      'Your posture often declines later in sessions — schedule a short reset before fatigue sets in.'
  } else if (topIssue) {
    insight = `Your most frequent issue this week is ${topIssue.toLowerCase()}. A quick guided drill after sessions can help.`
  }

  return {
    weeklyGoodPercent,
    sessionsThisWeek: week.length,
    topIssue,
    streakDays,
    insight,
  }
}

export function formatHistoryWhen(endedAt: number): string {
  const diff = Date.now() - endedAt
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function defaultGoalLabel(goal: SessionGoal): string {
  switch (goal) {
    case 'studying':
      return 'Studying'
    case 'gaming':
      return 'Gaming'
    case 'standing-desk':
      return 'Standing desk'
    default:
      return 'Office work'
  }
}

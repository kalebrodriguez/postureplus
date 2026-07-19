export interface SessionHistoryEntry {
  id: string
  endedAt: number
  durationMs: number
  goodPercent: number
  alertCount: number
  averageScore: number | null
}

const STORAGE_KEY = 'postureplus.sessionHistory'
const MAX_ENTRIES = 8

export function loadSessionHistory(): SessionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SessionHistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) =>
        typeof entry?.id === 'string' &&
        typeof entry.endedAt === 'number' &&
        typeof entry.durationMs === 'number',
    )
  } catch {
    return []
  }
}

export function saveSessionHistoryEntry(
  entry: Omit<SessionHistoryEntry, 'id' | 'endedAt'> & {
    id?: string
    endedAt?: number
  },
): SessionHistoryEntry[] {
  // Skip tiny accidental opens
  if (entry.durationMs < 15_000) {
    return loadSessionHistory()
  }

  const nextEntry: SessionHistoryEntry = {
    id: entry.id ?? crypto.randomUUID(),
    endedAt: entry.endedAt ?? Date.now(),
    durationMs: entry.durationMs,
    goodPercent: entry.goodPercent,
    alertCount: entry.alertCount,
    averageScore: entry.averageScore,
  }

  const history = [nextEntry, ...loadSessionHistory()].slice(0, MAX_ENTRIES)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  return history
}

export function clearSessionHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function formatHistoryWhen(endedAt: number): string {
  const diff = Date.now() - endedAt
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(endedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatHistoryDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes <= 0) return `${seconds}s`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

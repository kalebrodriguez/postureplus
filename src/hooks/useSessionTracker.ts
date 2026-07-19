import { useEffect, useMemo, useRef, useState } from 'react'
import {
  clearSessionHistory,
  loadSessionHistory,
  saveSessionHistoryEntry,
  type SessionHistoryEntry,
} from '../lib/sessionHistory'
import { BODY_PARTS, formatElapsed, recommendationsFor } from '../lib/posture'
import type {
  BodyPartState,
  ExerciseRecommendation,
  PostureAnalysis,
  SessionStats,
} from '../types/posture'

interface UseSessionTrackerResult {
  stats: SessionStats
  bodyParts: BodyPartState[]
  exercises: ExerciseRecommendation[]
  history: SessionHistoryEntry[]
  toastMessage: string | null
  badgeLabel: string
  badgeTone: 'idle' | 'good' | 'fair' | 'poor'
  clearHistory: () => void
}

const ALERT_COOLDOWN_MS = 9000

export function useSessionTracker(
  analysis: PostureAnalysis | null,
  personDetected: boolean,
  isLive: boolean,
): UseSessionTrackerResult {
  const sessionStartRef = useRef(Date.now())
  const lastAlertAtRef = useRef(0)
  const totalChecksRef = useRef(0)
  const goodChecksRef = useRef(0)
  const alertCountRef = useRef(0)
  const scoreSumRef = useRef(0)
  const scoreSamplesRef = useRef(0)
  const savedRef = useRef(false)
  const liveStartedRef = useRef(false)

  const [elapsedLabel, setElapsedLabel] = useState('0:00')
  const [alertCount, setAlertCount] = useState(0)
  const [goodPercent, setGoodPercent] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [history, setHistory] = useState<SessionHistoryEntry[]>(() => loadSessionHistory())

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedLabel(formatElapsed(Date.now() - sessionStartRef.current))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (isLive) liveStartedRef.current = true
  }, [isLive])

  useEffect(() => {
    if (!isLive || !analysis) return

    totalChecksRef.current += 1
    if (personDetected && analysis.status === 'Good') {
      goodChecksRef.current += 1
    }
    if (personDetected) {
      scoreSumRef.current += analysis.score
      scoreSamplesRef.current += 1
    }

    const pct =
      totalChecksRef.current > 0
        ? Math.round((goodChecksRef.current / totalChecksRef.current) * 100)
        : 0
    setGoodPercent(personDetected ? pct : null)

    if (
      personDetected &&
      analysis.issues.length > 0 &&
      Date.now() - lastAlertAtRef.current > ALERT_COOLDOWN_MS
    ) {
      lastAlertAtRef.current = Date.now()
      alertCountRef.current += 1
      setAlertCount(alertCountRef.current)
      setToastMessage(`⚠  ${analysis.issues[0]} — try the exercise below`)
    }
  }, [analysis, isLive, personDetected])

  useEffect(() => {
    if (!toastMessage) return
    const id = window.setTimeout(() => setToastMessage(null), 5000)
    return () => window.clearTimeout(id)
  }, [toastMessage])

  useEffect(() => {
    const persist = () => {
      if (savedRef.current || !liveStartedRef.current) return
      savedRef.current = true

      const durationMs = Date.now() - sessionStartRef.current
      const pct =
        totalChecksRef.current > 0
          ? Math.round((goodChecksRef.current / totalChecksRef.current) * 100)
          : 0
      const averageScore =
        scoreSamplesRef.current > 0
          ? Math.round(scoreSumRef.current / scoreSamplesRef.current)
          : null

      const next = saveSessionHistoryEntry({
        durationMs,
        goodPercent: pct,
        alertCount: alertCountRef.current,
        averageScore,
      })
      setHistory(next)
    }

    const onHide = () => {
      if (document.visibilityState === 'hidden') persist()
    }

    window.addEventListener('pagehide', persist)
    document.addEventListener('visibilitychange', onHide)

    return () => {
      window.removeEventListener('pagehide', persist)
      document.removeEventListener('visibilitychange', onHide)
      persist()
    }
  }, [])

  const bodyParts: BodyPartState[] = useMemo(() => {
    return (Object.keys(BODY_PARTS) as Array<keyof typeof BODY_PARTS>).map((key) => {
      const cfg = BODY_PARTS[key]
      const hasIssue = Boolean(analysis?.issues.includes(cfg.issue))
      return {
        key,
        label: cfg.label,
        icon: cfg.icon,
        statusText: !personDetected ? '—' : hasIssue ? cfg.bad : cfg.ok,
        state: !personDetected ? 'idle' : hasIssue ? 'bad' : 'ok',
      }
    })
  }, [analysis, personDetected])

  const exercises = useMemo(() => {
    if (!personDetected || !analysis?.issues.length) return []
    return recommendationsFor(analysis.issues)
  }, [analysis, personDetected])

  let badgeLabel = 'Ready'
  let badgeTone: UseSessionTrackerResult['badgeTone'] = 'idle'

  if (!isLive) {
    badgeLabel = 'Ready'
  } else if (!personDetected) {
    badgeLabel = 'No person'
  } else if (analysis) {
    badgeLabel = `${analysis.status} posture`
    if (analysis.status === 'Good' || analysis.status === 'Fair' || analysis.status === 'Poor') {
      badgeTone = analysis.status.toLowerCase() as 'good' | 'fair' | 'poor'
    }
  }

  return {
    stats: {
      elapsedLabel,
      goodPercent,
      alertCount,
    },
    bodyParts,
    exercises,
    history,
    toastMessage,
    badgeLabel,
    badgeTone,
    clearHistory: () => {
      clearSessionHistory()
      setHistory([])
    },
  }
}

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BODY_PARTS,
  EXERCISES,
  formatElapsed,
  goalBreakMinutes,
  recommendationsFor,
} from '../lib/posture'
import { SustainedPostureTracker } from '../lib/sustainedPosture'
import { loadSettings, saveSessionSummary, saveSettings } from '../lib/storage'
import type {
  BodyPartState,
  CalibrationProfile,
  CoachSettings,
  CoachingCue,
  ExerciseRecommendation,
  PostureAnalysis,
  PostureIssue,
  PosturePhase,
  SessionStats,
  SessionSummary,
} from '../types/posture'

interface UseCoachingSessionResult {
  stats: SessionStats
  bodyParts: BodyPartState[]
  exercises: ExerciseRecommendation[]
  activeCue: CoachingCue | null
  toastMessage: string | null
  badgeLabel: string
  badgeTone: 'idle' | 'good' | 'fair' | 'poor'
  phase: PosturePhase
  settings: CoachSettings
  setAlertDelaySec: (sec: number) => void
  toggleMute: () => void
  togglePause: () => void
  summary: SessionSummary | null
  endSession: () => SessionSummary | null
  startGuidedExercise: (issue: PostureIssue) => void
  guided: {
    exercise: ExerciseRecommendation | null
    rep: number
    holdLeft: number
    done: boolean
    tickHold: () => void
    nextRep: () => void
    close: () => void
  }
}

export function useCoachingSession(
  analysis: PostureAnalysis | null,
  personDetected: boolean,
  isLive: boolean,
  calibration: CalibrationProfile | null,
): UseCoachingSessionResult {
  const [settings, setSettings] = useState(() => loadSettings())
  const trackerRef = useRef(new SustainedPostureTracker(settings.alertDelaySec * 1000))
  const sessionStartRef = useRef(Date.now())
  const lastAlertAtRef = useRef(0)
  const totalChecksRef = useRef(0)
  const goodChecksRef = useRef(0)
  const alertCountRef = useRef(0)
  const scoreSumRef = useRef(0)
  const scoreSamplesRef = useRef(0)
  const issueCountsRef = useRef(new Map<PostureIssue, number>())
  const goodStreakRef = useRef(0)
  const longestGoodRef = useRef(0)
  const correctionTimesRef = useRef<number[]>([])
  const sustainedStartedAtRef = useRef<number | null>(null)
  const earlyScoreRef = useRef<number[]>([])
  const lateScoreRef = useRef<number[]>([])
  const firstDeclineAtRef = useRef<number | null>(null)

  const [elapsedLabel, setElapsedLabel] = useState('0:00')
  const [alertCount, setAlertCount] = useState(0)
  const [goodPercent, setGoodPercent] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [phase, setPhase] = useState<PosturePhase>('none')
  const [activeCue, setActiveCue] = useState<CoachingCue | null>(null)
  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [fatigueHint, setFatigueHint] = useState<string | null>(null)
  const [breakHint, setBreakHint] = useState<string | null>(null)
  const [guidedExercise, setGuidedExercise] = useState<ExerciseRecommendation | null>(null)
  const [guidedRep, setGuidedRep] = useState(1)
  const [holdLeft, setHoldLeft] = useState(0)
  const [guidedDone, setGuidedDone] = useState(false)

  useEffect(() => {
    trackerRef.current.setAlertDelayMs(settings.alertDelaySec * 1000)
  }, [settings.alertDelaySec])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (paused) return
      const elapsed = Date.now() - sessionStartRef.current
      setElapsedLabel(formatElapsed(elapsed))

      const goal = calibration?.goal ?? settings.goal
      const breakAt = goalBreakMinutes(goal) * 60_000
      if (elapsed > breakAt && !breakHint) {
        setBreakHint(
          `You've been in a ${goal.replace('-', ' ')} session for ${goalBreakMinutes(goal)}+ minutes — take a 20-second posture reset.`,
        )
      }

      if (firstDeclineAtRef.current && !fatigueHint) {
        const mins = Math.max(1, Math.round(firstDeclineAtRef.current / 60000))
        setFatigueHint(
          `Your posture began declining around ${mins} min. Consider a break a few minutes earlier next time.`,
        )
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [paused, breakHint, fatigueHint, calibration?.goal, settings.goal])

  useEffect(() => {
    if (!isLive || !analysis || paused) return

    const now = Date.now()
    const tracked = trackerRef.current.update(analysis.issues, now)
    setPhase(tracked.phase)

    totalChecksRef.current += 1
    if (personDetected && analysis.status === 'Good') {
      goodChecksRef.current += 1
      goodStreakRef.current += 120 // approx UI throttle ms
      longestGoodRef.current = Math.max(longestGoodRef.current, goodStreakRef.current)
    } else {
      goodStreakRef.current = 0
    }

    if (personDetected) {
      scoreSumRef.current += analysis.score
      scoreSamplesRef.current += 1
      const elapsed = now - sessionStartRef.current
      if (elapsed < 10 * 60_000) earlyScoreRef.current.push(analysis.score)
      else lateScoreRef.current.push(analysis.score)

      if (
        firstDeclineAtRef.current == null &&
        earlyScoreRef.current.length > 20 &&
        analysis.score < 70
      ) {
        const earlyAvg =
          earlyScoreRef.current.reduce((a, b) => a + b, 0) / earlyScoreRef.current.length
        if (earlyAvg >= 78) firstDeclineAtRef.current = elapsed
      }
    }

    for (const issue of tracked.sustainedIssues) {
      issueCountsRef.current.set(issue, (issueCountsRef.current.get(issue) ?? 0) + 1)
    }

    const enriched: PostureAnalysis = { ...analysis, phase: tracked.phase }
    const primary =
      enriched.cues.find((c) => tracked.sustainedIssues.includes(c.issue)) ??
      enriched.cues[0] ??
      null
    setActiveCue(primary)

    if (tracked.phase === 'sustained') {
      if (sustainedStartedAtRef.current == null) sustainedStartedAtRef.current = now
    } else if (tracked.phase === 'recovered' || tracked.phase === 'good') {
      if (sustainedStartedAtRef.current != null) {
        correctionTimesRef.current.push(now - sustainedStartedAtRef.current)
        sustainedStartedAtRef.current = null
      }
    }

    const pct =
      totalChecksRef.current > 0
        ? Math.round((goodChecksRef.current / totalChecksRef.current) * 100)
        : 0
    setGoodPercent(personDetected ? pct : null)

    const shouldAlert =
      !muted &&
      settings.alertMode !== 'silent' &&
      tracked.sustainedIssues.length > 0 &&
      now - lastAlertAtRef.current > settings.alertDelaySec * 1000

    if (shouldAlert && primary) {
      lastAlertAtRef.current = now
      alertCountRef.current += 1
      setAlertCount(alertCountRef.current)
      if (settings.alertMode === 'toast') {
        setToastMessage(`${primary.observation} ${primary.action}`)
      }
    }
  }, [analysis, isLive, personDetected, paused, muted, settings.alertDelaySec, settings.alertMode])

  useEffect(() => {
    if (!toastMessage) return
    const id = window.setTimeout(() => setToastMessage(null), 6000)
    return () => window.clearTimeout(id)
  }, [toastMessage])

  useEffect(() => {
    if (!guidedExercise || holdLeft <= 0 || guidedDone) return
    const id = window.setTimeout(() => setHoldLeft((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [guidedExercise, holdLeft, guidedDone])

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

  const buildSummary = (): SessionSummary | null => {
    if (!isLive && totalChecksRef.current === 0) return null
    const durationMs = Date.now() - sessionStartRef.current
    const goodPercentValue =
      totalChecksRef.current > 0
        ? Math.round((goodChecksRef.current / totalChecksRef.current) * 100)
        : 0
    const averageScore =
      scoreSamplesRef.current > 0
        ? Math.round(scoreSumRef.current / scoreSamplesRef.current)
        : 0

    let topIssue: PostureIssue | null = null
    let topCount = 0
    for (const [issue, count] of issueCountsRef.current) {
      if (count > topCount) {
        topIssue = issue
        topCount = count
      }
    }

    const early =
      earlyScoreRef.current.length > 0
        ? earlyScoreRef.current.reduce((a, b) => a + b, 0) / earlyScoreRef.current.length
        : averageScore
    const late =
      lateScoreRef.current.length > 0
        ? lateScoreRef.current.reduce((a, b) => a + b, 0) / lateScoreRef.current.length
        : averageScore
    const scoreTrend =
      late - early > 4 ? 'improving' : early - late > 4 ? 'declining' : 'stable'

    const avgCorrection =
      correctionTimesRef.current.length > 0
        ? Math.round(
            correctionTimesRef.current.reduce((a, b) => a + b, 0) /
              correctionTimesRef.current.length,
          )
        : null

    const recommendedExercise = topIssue
      ? { issue: topIssue, ...EXERCISES[topIssue] }
      : null

    return {
      id: crypto.randomUUID(),
      endedAt: Date.now(),
      durationMs,
      goodPercent: goodPercentValue,
      averageScore,
      alertCount: alertCountRef.current,
      longestGoodStreakMs: longestGoodRef.current,
      topIssue,
      averageCorrectionMs: avgCorrection,
      scoreTrend,
      recommendedExercise,
      goal: calibration?.goal ?? settings.goal,
    }
  }

  let badgeLabel = 'Ready'
  let badgeTone: UseCoachingSessionResult['badgeTone'] = 'idle'
  if (!isLive) badgeLabel = 'Ready'
  else if (paused) badgeLabel = 'Paused'
  else if (!personDetected) badgeLabel = 'No person'
  else {
    badgeLabel =
      phase === 'slight'
        ? 'Slight deviation'
        : phase === 'sustained'
          ? 'Sustained issue'
          : phase === 'correcting'
            ? 'Correcting'
            : phase === 'recovered'
              ? 'Recovered'
              : analysis
                ? `${analysis.status} posture`
                : 'Live'
    if (analysis?.status === 'Good' || analysis?.status === 'Fair' || analysis?.status === 'Poor') {
      badgeTone = analysis.status.toLowerCase() as 'good' | 'fair' | 'poor'
    }
  }

  return {
    stats: {
      elapsedLabel,
      goodPercent,
      alertCount,
      phase,
      fatigueHint,
      breakHint,
      muted,
      paused,
      alertDelaySec: settings.alertDelaySec,
    },
    bodyParts,
    exercises,
    activeCue,
    toastMessage,
    badgeLabel,
    badgeTone,
    phase,
    settings,
    setAlertDelaySec: (sec: number) => {
      const next = { ...settings, alertDelaySec: sec }
      setSettings(next)
      saveSettings(next)
    },
    toggleMute: () => setMuted((v) => !v),
    togglePause: () => setPaused((v) => !v),
    summary,
    endSession: () => {
      const snap = buildSummary()
      if (snap) {
        saveSessionSummary(snap)
        setSummary(snap)
      }
      return snap
    },
    startGuidedExercise: (issue: PostureIssue) => {
      const exercise = { issue, ...EXERCISES[issue] }
      setGuidedExercise(exercise)
      setGuidedRep(1)
      setHoldLeft(exercise.holdSeconds)
      setGuidedDone(false)
    },
    guided: {
      exercise: guidedExercise,
      rep: guidedRep,
      holdLeft,
      done: guidedDone,
      tickHold: () => setHoldLeft((v) => Math.max(0, v - 1)),
      nextRep: () => {
        if (!guidedExercise) return
        if (guidedRep >= guidedExercise.reps) {
          setGuidedDone(true)
          return
        }
        setGuidedRep((r) => r + 1)
        setHoldLeft(guidedExercise.holdSeconds)
      },
      close: () => {
        setGuidedExercise(null)
        setGuidedDone(false)
      },
    },
  }
}

export type PostureStatus = 'Good' | 'Fair' | 'Poor' | 'None'

export type PostureIssue =
  | 'Slouching'
  | 'Uneven shoulders'
  | 'Head drooping forward'
  | 'Head tilting'

export type PosturePhase =
  | 'good'
  | 'slight'
  | 'sustained'
  | 'correcting'
  | 'recovered'
  | 'none'

export type WorkMode = 'sitting' | 'standing'
export type SessionGoal = 'office' | 'studying' | 'gaming' | 'standing-desk'
export type AlertMode = 'visual' | 'toast' | 'silent'

export interface NormalizedLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface PostureMetrics {
  spineAngleDeg: number
  shoulderDiffNorm: number
  headTiltNorm: number
  neckDroopNorm: number
  headForwardCm: number
  elevatedShoulder: 'left' | 'right' | 'none'
  leanDirection: 'left' | 'right' | 'none'
  leanNorm: number
  shoulderWidth: number
  torsoHeight: number
  midShoulder: { x: number; y: number }
  midEar: { x: number; y: number }
  midHip: { x: number; y: number }
}

export interface CalibrationBaseline {
  spineAngleDeg: number
  shoulderDiffNorm: number
  headTiltNorm: number
  neckDroopNorm: number
  midShoulder: { x: number; y: number }
  midEar: { x: number; y: number }
}

export interface CalibrationProfile {
  workMode: WorkMode
  goal: SessionGoal
  baseline: CalibrationBaseline
  completedAt: number
}

export interface CoachingCue {
  issue: PostureIssue
  bodyPart: BodyPartKey
  observation: string
  action: string
  severity: 'slight' | 'sustained'
}

export interface PostureAnalysis {
  issues: PostureIssue[]
  score: number
  status: PostureStatus
  metrics: PostureMetrics
  cues: CoachingCue[]
  phase: PosturePhase
}

export interface SessionStats {
  elapsedLabel: string
  goodPercent: number | null
  alertCount: number
  phase: PosturePhase
  fatigueHint: string | null
  breakHint: string | null
  muted: boolean
  paused: boolean
  alertDelaySec: number
}

export type BodyPartKey = 'spine' | 'shoulders' | 'head' | 'neck'

export interface BodyPartState {
  key: BodyPartKey
  label: string
  icon: string
  statusText: string
  state: 'idle' | 'ok' | 'bad'
}

export interface ExerciseRecommendation {
  issue: PostureIssue
  name: string
  description: string
  holdSeconds: number
  reps: number
}

export interface SessionSummary {
  id: string
  endedAt: number
  durationMs: number
  goodPercent: number
  averageScore: number
  alertCount: number
  longestGoodStreakMs: number
  topIssue: PostureIssue | null
  averageCorrectionMs: number | null
  scoreTrend: 'improving' | 'stable' | 'declining'
  recommendedExercise: ExerciseRecommendation | null
  goal: SessionGoal
}

export interface CoachSettings {
  alertDelaySec: number
  alertMode: AlertMode
  goal: SessionGoal
}

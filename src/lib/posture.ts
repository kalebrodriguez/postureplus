import type {
  BodyPartKey,
  ExerciseRecommendation,
  PostureAnalysis,
  PostureIssue,
  PosturePhase,
  SessionGoal,
} from '../types/posture'

export { analyzePosture, emptyAnalysis, captureBaseline, computeMetrics, buildCues } from './metrics'

export const EXERCISES: Record<
  PostureIssue,
  Omit<ExerciseRecommendation, 'issue'>
> = {
  Slouching: {
    name: 'Chest Opener',
    description:
      'Stand or sit tall, clasp hands behind back, squeeze shoulder blades and lift chest.',
    holdSeconds: 15,
    reps: 3,
  },
  'Uneven shoulders': {
    name: 'Shoulder Rolls',
    description:
      'Roll both shoulders backward in slow circles, then shrug to ears, hold, and release.',
    holdSeconds: 3,
    reps: 10,
  },
  'Head drooping forward': {
    name: 'Chin Tuck',
    description:
      'Pull chin straight back (gentle double chin). Hold, release, and repeat.',
    holdSeconds: 5,
    reps: 10,
  },
  'Head tilting': {
    name: 'Neck Side Stretch',
    description:
      'Tilt one ear toward the same-side shoulder. Keep shoulders relaxed, then switch.',
    holdSeconds: 20,
    reps: 2,
  },
}

export const BODY_PARTS: Record<
  BodyPartKey,
  { issue: PostureIssue; ok: string; bad: string; label: string; icon: string }
> = {
  spine: { issue: 'Slouching', ok: 'Aligned', bad: 'Slouching', label: 'Spine', icon: '↕' },
  shoulders: {
    issue: 'Uneven shoulders',
    ok: 'Level',
    bad: 'Uneven',
    label: 'Shoulders',
    icon: '↔',
  },
  head: {
    issue: 'Head drooping forward',
    ok: 'Good position',
    bad: 'Drooping forward',
    label: 'Head Position',
    icon: '○',
  },
  neck: {
    issue: 'Head tilting',
    ok: 'Centered',
    bad: 'Tilting',
    label: 'Neck Tilt',
    icon: '↗',
  },
}

const SCORE_RING_RADIUS = 32
export const SCORE_RING_CIRCUMFERENCE = 2 * Math.PI * SCORE_RING_RADIUS

export function scoreColor(score: number): string {
  if (score >= 78) return 'var(--green)'
  if (score >= 50) return 'var(--amber)'
  return 'var(--red)'
}

export function skeletonColor(status: PostureAnalysis['status']): string {
  if (status === 'Good') return 'rgba(34,197,94,0.75)'
  if (status === 'Fair') return 'rgba(245,158,11,0.75)'
  return 'rgba(239,68,68,0.75)'
}

export function phaseLabel(phase: PosturePhase): string {
  switch (phase) {
    case 'good':
      return 'Good'
    case 'slight':
      return 'Slight deviation'
    case 'sustained':
      return 'Sustained poor posture'
    case 'correcting':
      return 'Correcting'
    case 'recovered':
      return 'Recovered'
    default:
      return 'Waiting'
  }
}

export function recommendationsFor(issues: PostureIssue[]): ExerciseRecommendation[] {
  return issues.map((issue) => ({
    issue,
    name: EXERCISES[issue].name,
    description: EXERCISES[issue].description,
    holdSeconds: EXERCISES[issue].holdSeconds,
    reps: EXERCISES[issue].reps,
  }))
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function goalBreakMinutes(goal: SessionGoal): number {
  switch (goal) {
    case 'gaming':
      return 40
    case 'studying':
      return 30
    case 'standing-desk':
      return 35
    default:
      return 25
  }
}

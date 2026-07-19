import type {
  BodyPartKey,
  ExerciseRecommendation,
  NormalizedLandmark,
  PostureAnalysis,
  PostureIssue,
} from '../types/posture'

export const EXERCISES: Record<PostureIssue, Omit<ExerciseRecommendation, 'issue'>> = {
  Slouching: {
    name: 'Chest Opener',
    description:
      'Stand, clasp hands behind back, squeeze shoulder blades and lift chest. Hold 15s. Repeat 3×.',
  },
  'Uneven shoulders': {
    name: 'Shoulder Rolls',
    description:
      'Roll both shoulders backward in slow circles 10×, then shrug to ears, hold 3s, release. Repeat 5×.',
  },
  'Head drooping forward': {
    name: 'Chin Tuck',
    description:
      'Pull chin straight back (double chin). Hold 5s, release. Do 10 reps — great for screen workers.',
  },
  'Head tilting': {
    name: 'Neck Side Stretch',
    description:
      'Tilt right ear toward right shoulder, hold 20s. Switch sides. Keep shoulders relaxed.',
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

export function analyzePosture(landmarks: NormalizedLandmark[]): PostureAnalysis {
  const issues: PostureIssue[] = []

  const lEar = landmarks[7]
  const rEar = landmarks[8]
  const lS = landmarks[11]
  const rS = landmarks[12]
  const lH = landmarks[23]
  const rH = landmarks[24]

  const midS = { x: (lS.x + rS.x) / 2, y: (lS.y + rS.y) / 2 }
  const midH = { x: (lH.x + rH.x) / 2, y: (lH.y + rH.y) / 2 }
  const midE = { x: (lEar.x + rEar.x) / 2, y: (lEar.y + rEar.y) / 2 }

  const shoulderWidth = Math.max(Math.abs(lS.x - rS.x), 0.001)
  const torsoHeight = Math.max(Math.abs(midS.y - midH.y), 0.001)

  const spineAngle =
    (Math.atan2(midS.x - midH.x, midH.y - midS.y) * 180) / Math.PI

  if (Math.abs(spineAngle) > 12) issues.push('Slouching')
  if (Math.abs(lS.y - rS.y) / shoulderWidth > 0.12) issues.push('Uneven shoulders')
  if (Math.abs(lEar.y - rEar.y) / shoulderWidth > 0.12) issues.push('Head tilting')

  const neckDroop = (midE.y - midS.y) / torsoHeight
  if (neckDroop > -0.22) issues.push('Head drooping forward')

  const score = Math.max(0, 100 - issues.length * 22)
  const status = issues.length === 0 ? 'Good' : issues.length === 1 ? 'Fair' : 'Poor'

  return { issues, score, status }
}

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

export function recommendationsFor(issues: PostureIssue[]): ExerciseRecommendation[] {
  return issues.map((issue) => ({
    issue,
    name: EXERCISES[issue].name,
    description: EXERCISES[issue].description,
  }))
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

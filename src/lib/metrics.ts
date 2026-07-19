import type {
  CalibrationBaseline,
  CalibrationProfile,
  CoachingCue,
  NormalizedLandmark,
  PostureAnalysis,
  PostureIssue,
  PostureMetrics,
  PosturePhase,
  PostureStatus,
  WorkMode,
} from '../types/posture'

/** Assume ~45cm average shoulder width when estimating cm from normalized coords. */
const ASSUMED_SHOULDER_WIDTH_CM = 45

export function computeMetrics(landmarks: NormalizedLandmark[]): PostureMetrics {
  const lEar = landmarks[7]
  const rEar = landmarks[8]
  const lS = landmarks[11]
  const rS = landmarks[12]
  const lH = landmarks[23]
  const rH = landmarks[24]

  const midShoulder = { x: (lS.x + rS.x) / 2, y: (lS.y + rS.y) / 2 }
  const midEar = { x: (lEar.x + rEar.x) / 2, y: (lEar.y + rEar.y) / 2 }
  const shoulderWidth = Math.max(Math.abs(lS.x - rS.x), 0.001)

  // Desk webcams often crop the hips — fall back to an upper-body torso estimate.
  const hipVisibility = Math.min(lH?.visibility ?? 0, rH?.visibility ?? 0)
  const hipsReliable = hipVisibility > 0.4
  const midHip = hipsReliable
    ? { x: (lH.x + rH.x) / 2, y: (lH.y + rH.y) / 2 }
    : { x: midShoulder.x, y: midShoulder.y + shoulderWidth * 1.6 }

  const torsoHeight = Math.max(Math.abs(midShoulder.y - midHip.y), shoulderWidth * 0.8, 0.001)

  const spineAngleDeg = hipsReliable
    ? (Math.atan2(midShoulder.x - midHip.x, midHip.y - midShoulder.y) * 180) / Math.PI
    : 0

  const shoulderDiffNorm = (lS.y - rS.y) / shoulderWidth
  const headTiltNorm = (lEar.y - rEar.y) / shoulderWidth
  const neckDroopNorm = (midEar.y - midShoulder.y) / torsoHeight

  // Positive = ears lower / farther forward relative to upright baseline heuristic
  const uprightNeck = -0.28
  const forwardNorm = Math.max(0, neckDroopNorm - uprightNeck)
  const headForwardCm = Math.round(forwardNorm * (ASSUMED_SHOULDER_WIDTH_CM / shoulderWidth) * 10) / 10

  const elevatedShoulder =
    Math.abs(shoulderDiffNorm) < 0.04 ? 'none' : shoulderDiffNorm > 0 ? 'left' : 'right'

  const leanNorm = hipsReliable ? (midShoulder.x - midHip.x) / shoulderWidth : 0
  const leanDirection =
    Math.abs(leanNorm) < 0.05 ? 'none' : leanNorm > 0 ? 'right' : 'left'

  return {
    spineAngleDeg,
    shoulderDiffNorm,
    headTiltNorm,
    neckDroopNorm,
    headForwardCm,
    elevatedShoulder,
    leanDirection,
    leanNorm,
    shoulderWidth,
    torsoHeight,
    midShoulder,
    midEar,
    midHip,
  }
}

export function captureBaseline(landmarks: NormalizedLandmark[]): CalibrationBaseline {
  const m = computeMetrics(landmarks)
  return {
    spineAngleDeg: m.spineAngleDeg,
    shoulderDiffNorm: Math.abs(m.shoulderDiffNorm),
    headTiltNorm: Math.abs(m.headTiltNorm),
    neckDroopNorm: m.neckDroopNorm,
    midShoulder: m.midShoulder,
    midEar: m.midEar,
  }
}

export interface AnalyzeOptions {
  baseline?: CalibrationBaseline | null
  workMode?: WorkMode
  phase?: PosturePhase
}

function thresholds(baseline?: CalibrationBaseline | null, workMode: WorkMode = 'sitting') {
  const modeScale = workMode === 'standing' ? 1.15 : 1
  return {
    spine: (baseline?.spineAngleDeg ?? 0) + 10 * modeScale,
    shoulders: (baseline?.shoulderDiffNorm ?? 0) + 0.1 * modeScale,
    tilt: (baseline?.headTiltNorm ?? 0) + 0.1 * modeScale,
    // Higher neckDroopNorm = more forward. Flag when above baseline + slack.
    neck: (baseline?.neckDroopNorm ?? -0.28) + 0.08 * modeScale,
  }
}

export function buildCues(
  metrics: PostureMetrics,
  issues: PostureIssue[],
  baseline: CalibrationBaseline | null | undefined,
  severity: 'slight' | 'sustained',
): CoachingCue[] {
  const cues: CoachingCue[] = []

  for (const issue of issues) {
    if (issue === 'Head drooping forward') {
      const delta = baseline
        ? Math.max(0, metrics.neckDroopNorm - baseline.neckDroopNorm)
        : metrics.headForwardCm / 20
      const cm = Math.max(1, Math.round((delta * ASSUMED_SHOULDER_WIDTH_CM + metrics.headForwardCm) * 5) / 5)
      cues.push({
        issue,
        bodyPart: 'head',
        observation: `Your head has moved about ${cm.toFixed(cm < 10 ? 1 : 0)} cm forward.`,
        action: 'Bring your chin slightly backward — think gentle double-chin.',
        severity,
      })
    }

    if (issue === 'Uneven shoulders') {
      const side =
        metrics.elevatedShoulder === 'none'
          ? 'one shoulder'
          : `your ${metrics.elevatedShoulder} shoulder`
      cues.push({
        issue,
        bodyPart: 'shoulders',
        observation: `${side[0].toUpperCase()}${side.slice(1)} is slightly elevated.`,
        action: 'Drop both shoulders and roll them back evenly.',
        severity,
      })
    }

    if (issue === 'Slouching') {
      const lean =
        metrics.leanDirection === 'none'
          ? 'Your torso is rounding forward.'
          : `You’re leaning ${metrics.leanDirection} and rounding through the spine.`
      cues.push({
        issue,
        bodyPart: 'spine',
        observation: lean,
        action: 'Stack ribs over hips and lightly lift through the crown of your head.',
        severity,
      })
    }

    if (issue === 'Head tilting') {
      const side = metrics.headTiltNorm > 0 ? 'left' : 'right'
      cues.push({
        issue,
        bodyPart: 'neck',
        observation: `Your head is tilting toward your ${side} shoulder.`,
        action: 'Level your ears over your shoulders without shrugging.',
        severity,
      })
    }
  }

  return cues
}

export function analyzePosture(
  landmarks: NormalizedLandmark[],
  options: AnalyzeOptions = {},
): PostureAnalysis {
  const metrics = computeMetrics(landmarks)
  const t = thresholds(options.baseline, options.workMode ?? 'sitting')
  const issues: PostureIssue[] = []

  if (Math.abs(metrics.spineAngleDeg) > t.spine) issues.push('Slouching')
  if (Math.abs(metrics.shoulderDiffNorm) > t.shoulders) issues.push('Uneven shoulders')
  if (Math.abs(metrics.headTiltNorm) > t.tilt) issues.push('Head tilting')
  if (metrics.neckDroopNorm > t.neck) issues.push('Head drooping forward')

  const score = Math.max(0, 100 - issues.length * 22)
  const status: PostureStatus =
    issues.length === 0 ? 'Good' : issues.length === 1 ? 'Fair' : 'Poor'

  const phase = options.phase ?? (issues.length === 0 ? 'good' : 'slight')
  const severity = phase === 'sustained' || phase === 'correcting' ? 'sustained' : 'slight'

  return {
    issues,
    score,
    status,
    metrics,
    cues: buildCues(metrics, issues, options.baseline, severity),
    phase,
  }
}

export function emptyAnalysis(phase: PosturePhase = 'none'): PostureAnalysis {
  return {
    issues: [],
    score: 0,
    status: 'None',
    metrics: {
      spineAngleDeg: 0,
      shoulderDiffNorm: 0,
      headTiltNorm: 0,
      neckDroopNorm: 0,
      headForwardCm: 0,
      elevatedShoulder: 'none',
      leanDirection: 'none',
      leanNorm: 0,
      shoulderWidth: 0.001,
      torsoHeight: 0.001,
      midShoulder: { x: 0.5, y: 0.4 },
      midEar: { x: 0.5, y: 0.25 },
      midHip: { x: 0.5, y: 0.7 },
    },
    cues: [],
    phase,
  }
}

export type { CalibrationProfile }

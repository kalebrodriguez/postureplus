import { describe, expect, it } from 'vitest'
import { analyzePosture, buildCues, computeMetrics } from './metrics'
import type { NormalizedLandmark } from '../types/posture'

function lm(x: number, y: number, z = 0): NormalizedLandmark {
  return { x, y, z, visibility: 1 }
}

function buildLandmarks(overrides: Partial<Record<number, NormalizedLandmark>> = {}) {
  const points: NormalizedLandmark[] = Array.from({ length: 33 }, () => lm(0.5, 0.5))
  points[7] = lm(0.45, 0.2)
  points[8] = lm(0.55, 0.2)
  points[11] = lm(0.35, 0.35)
  points[12] = lm(0.65, 0.35)
  points[23] = lm(0.4, 0.7)
  points[24] = lm(0.6, 0.7)
  Object.assign(points, overrides)
  return points
}

describe('analyzePosture', () => {
  it('scores good posture highly', () => {
    const result = analyzePosture(buildLandmarks())
    expect(result.status).toBe('Good')
    expect(result.score).toBe(100)
    expect(result.issues).toEqual([])
    expect(result.cues).toEqual([])
  })

  it('detects uneven shoulders and builds an actionable cue', () => {
    const result = analyzePosture(
      buildLandmarks({
        11: lm(0.35, 0.3),
        12: lm(0.65, 0.42),
      }),
      { phase: 'sustained' },
    )
    expect(result.issues).toContain('Uneven shoulders')
    expect(result.cues[0]?.action).toMatch(/shoulders/i)
  })

  it('uses calibration baseline to reduce false positives', () => {
    const landmarks = buildLandmarks({
      7: lm(0.45, 0.28),
      8: lm(0.55, 0.28),
    })
    const metrics = computeMetrics(landmarks)
    const without = analyzePosture(landmarks)
    const withBaseline = analyzePosture(landmarks, {
      baseline: {
        spineAngleDeg: 0,
        shoulderDiffNorm: 0,
        headTiltNorm: 0,
        neckDroopNorm: metrics.neckDroopNorm,
        midShoulder: metrics.midShoulder,
        midEar: metrics.midEar,
      },
    })
    expect(without.issues.length).toBeGreaterThanOrEqual(withBaseline.issues.length)
  })
})

describe('buildCues', () => {
  it('mentions head forward distance', () => {
    const metrics = computeMetrics(buildLandmarks())
    const cues = buildCues(metrics, ['Head drooping forward'], null, 'slight')
    expect(cues[0]?.observation).toMatch(/cm forward/i)
  })
})

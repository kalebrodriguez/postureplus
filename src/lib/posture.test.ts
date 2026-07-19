import { describe, expect, it } from 'vitest'
import { analyzePosture } from '../lib/posture'
import type { NormalizedLandmark } from '../types/posture'

function lm(x: number, y: number, z = 0): NormalizedLandmark {
  return { x, y, z, visibility: 1 }
}

function buildLandmarks(overrides: Partial<Record<number, NormalizedLandmark>> = {}) {
  const points: NormalizedLandmark[] = Array.from({ length: 33 }, () => lm(0.5, 0.5))
  // Default upright, level posture
  points[7] = lm(0.45, 0.2) // left ear
  points[8] = lm(0.55, 0.2) // right ear
  points[11] = lm(0.35, 0.35) // left shoulder
  points[12] = lm(0.65, 0.35) // right shoulder
  points[23] = lm(0.4, 0.7) // left hip
  points[24] = lm(0.6, 0.7) // right hip
  Object.assign(points, overrides)
  return points
}

describe('analyzePosture', () => {
  it('scores good posture highly', () => {
    const result = analyzePosture(buildLandmarks())
    expect(result.status).toBe('Good')
    expect(result.score).toBe(100)
    expect(result.issues).toEqual([])
  })

  it('detects uneven shoulders', () => {
    const result = analyzePosture(
      buildLandmarks({
        11: lm(0.35, 0.3),
        12: lm(0.65, 0.42),
      }),
    )
    expect(result.issues).toContain('Uneven shoulders')
    expect(result.score).toBeLessThan(100)
  })
})

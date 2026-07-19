import { describe, expect, it } from 'vitest'
import { SustainedPostureTracker } from './sustainedPosture'

describe('SustainedPostureTracker', () => {
  it('stays in slight until delay elapses', () => {
    const tracker = new SustainedPostureTracker(30_000)
    const t0 = 1_000_000
    expect(tracker.update(['Slouching'], t0).phase).toBe('slight')
    expect(tracker.update(['Slouching'], t0 + 10_000).phase).toBe('slight')
    expect(tracker.update(['Slouching'], t0 + 30_000).phase).toBe('sustained')
  })

  it('moves to recovered then good after sustained clears', () => {
    const tracker = new SustainedPostureTracker(5_000)
    const t0 = 1_000_000
    tracker.update(['Head drooping forward'], t0)
    tracker.update(['Head drooping forward'], t0 + 5_000)
    expect(tracker.update([], t0 + 5_500).phase).toBe('recovered')
    expect(tracker.update([], t0 + 10_000).phase).toBe('good')
  })
})

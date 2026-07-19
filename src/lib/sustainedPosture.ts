import type { PostureIssue, PosturePhase } from '../types/posture'

interface IssueTimer {
  activeSince: number | null
  lastSeenAt: number
}

/**
 * Tracks whether issues are momentary or sustained, and recovery transitions.
 */
export class SustainedPostureTracker {
  private timers = new Map<PostureIssue, IssueTimer>()
  private phase: PosturePhase = 'none'
  private hadSustained = false
  private goodSince: number | null = null
  private issueHold = new Map<PostureIssue, number>()
  private alertDelayMs: number

  constructor(alertDelayMs: number) {
    this.alertDelayMs = alertDelayMs
  }

  setAlertDelayMs(ms: number) {
    this.alertDelayMs = ms
  }

  reset() {
    this.timers.clear()
    this.phase = 'none'
    this.hadSustained = false
    this.goodSince = null
    this.issueHold.clear()
  }

  update(issues: PostureIssue[], now = Date.now()): {
    phase: PosturePhase
    sustainedIssues: PostureIssue[]
    holdMs: Map<PostureIssue, number>
  } {
    const active = new Set(issues)

    for (const issue of issues) {
      const timer = this.timers.get(issue) ?? { activeSince: null, lastSeenAt: now }
      if (timer.activeSince == null) timer.activeSince = now
      timer.lastSeenAt = now
      this.timers.set(issue, timer)
      this.issueHold.set(issue, now - timer.activeSince)
    }

    for (const [issue, timer] of this.timers) {
      if (!active.has(issue)) {
        // Clear quickly once the issue disappears for >1.2s
        if (now - timer.lastSeenAt > 1200) {
          this.timers.delete(issue)
          this.issueHold.delete(issue)
        }
      }
    }

    const sustainedIssues = [...this.timers.entries()]
      .filter(
        ([issue, t]) =>
          active.has(issue) &&
          t.activeSince != null &&
          now - t.activeSince >= this.alertDelayMs,
      )
      .map(([issue]) => issue)

    if (sustainedIssues.length > 0) {
      this.phase = 'sustained'
      this.hadSustained = true
      this.goodSince = null
    } else if (issues.length > 0) {
      this.phase = this.hadSustained ? 'correcting' : 'slight'
      this.goodSince = null
    } else if (this.hadSustained) {
      if (this.goodSince == null) this.goodSince = now
      this.phase = now - this.goodSince < 4000 ? 'recovered' : 'good'
      if (this.phase === 'good') this.hadSustained = false
    } else {
      this.phase = 'good'
      this.goodSince = this.goodSince ?? now
    }

    return {
      phase: this.phase,
      sustainedIssues,
      holdMs: new Map(this.issueHold),
    }
  }
}

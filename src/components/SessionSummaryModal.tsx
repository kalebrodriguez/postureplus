import { formatElapsed } from '../lib/posture'
import type { SessionSummary } from '../types/posture'
import './SessionSummaryModal.css'

interface SessionSummaryModalProps {
  summary: SessionSummary
  onClose: () => void
  onGuided?: () => void
  onViewProgress?: () => void
}

export function SessionSummaryModal({
  summary,
  onClose,
  onGuided,
  onViewProgress,
}: SessionSummaryModalProps) {
  return (
    <div className="summary">
      <div className="summary__card">
        <p className="summary__eyebrow">Session complete</p>
        <h2>Here’s how you did</h2>
        <p className="summary__lede">
          {formatElapsed(summary.durationMs)} monitored ·{' '}
          {summary.scoreTrend === 'declining'
            ? 'Posture declined later in the session'
            : summary.scoreTrend === 'improving'
              ? 'Posture improved as you went'
              : 'Posture stayed fairly steady'}
        </p>

        <div className="summary__grid">
          <Stat label="Avg score" value={`${summary.averageScore}`} />
          <Stat label="Good posture" value={`${summary.goodPercent}%`} />
          <Stat label="Longest streak" value={formatElapsed(summary.longestGoodStreakMs)} />
          <Stat label="Alerts" value={`${summary.alertCount}`} />
          <Stat
            label="Top issue"
            value={summary.topIssue ?? 'None'}
          />
          <Stat
            label="Avg correction"
            value={
              summary.averageCorrectionMs == null
                ? '—'
                : formatElapsed(summary.averageCorrectionMs)
            }
          />
        </div>

        {summary.recommendedExercise ? (
          <div className="summary__exercise">
            <p className="summary__exercise-label">Recommended next</p>
            <h3>{summary.recommendedExercise.name}</h3>
            <p>{summary.recommendedExercise.description}</p>
          </div>
        ) : null}

        <div className="summary__actions">
          {summary.recommendedExercise && onGuided ? (
            <button type="button" className="btn btn--primary" onClick={onGuided}>
              Start guided exercise
            </button>
          ) : null}
          {onViewProgress ? (
            <button type="button" className="btn btn--ghost" onClick={onViewProgress}>
              View progress
            </button>
          ) : null}
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary__stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

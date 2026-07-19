import './SidePanel.css'
import { SCORE_RING_CIRCUMFERENCE, scoreColor } from '../lib/posture'
import type {
  BodyPartState,
  ExerciseRecommendation,
  PostureAnalysis,
} from '../types/posture'

interface SidePanelProps {
  analysis: PostureAnalysis | null
  personDetected: boolean
  isLive: boolean
  bodyParts: BodyPartState[]
  exercises: ExerciseRecommendation[]
}

export function SidePanel({
  analysis,
  personDetected,
  isLive,
  bodyParts,
  exercises,
}: SidePanelProps) {
  const detected = isLive && personDetected && analysis != null
  const score = detected ? analysis.score : null
  const status = detected ? analysis.status : null
  const offset =
    score == null
      ? SCORE_RING_CIRCUMFERENCE
      : SCORE_RING_CIRCUMFERENCE - (score / 100) * SCORE_RING_CIRCUMFERENCE

  let statusLabel = 'Waiting'
  let statusClass = 'none'
  let statusSub = isLive
    ? 'Position yourself in the camera frame.'
    : 'Enable camera to begin.'

  if (detected && status) {
    statusLabel = status
    statusClass = status.toLowerCase()
    statusSub =
      analysis.issues.length === 0
        ? 'Great posture — keep it up!'
        : `${analysis.issues.length} issue${analysis.issues.length > 1 ? 's' : ''} detected.`
  }

  return (
    <aside className="panel">
      <div className="panel-section">
        <div className="section-title">Posture Score</div>
        <div className="score-block">
          <div className="score-ring-wrap">
            <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#2a2a35" strokeWidth="7" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke={score == null ? 'var(--border2)' : scoreColor(score)}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={SCORE_RING_CIRCUMFERENCE}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.4s, stroke 0.4s' }}
              />
            </svg>
            <div className="score-num">{score ?? '—'}</div>
          </div>
          <div className="score-info">
            <div className={`score-label ${statusClass}`}>{statusLabel}</div>
            <div className="score-sub">{statusSub}</div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-title">Body Breakdown</div>
        <div className="body-list">
          {bodyParts.map((part) => (
            <div
              key={part.key}
              className={`body-row${part.state === 'idle' ? '' : ` ${part.state}`}`}
            >
              <div className="body-left">
                <div className="body-icon">{part.icon}</div>
                <div className="body-name">{part.label}</div>
              </div>
              <div className="body-status">{part.statusText}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="section-title">Recommended Exercises</div>
        {exercises.length === 0 ? (
          <div className="good-state">
            <div className="good-check">✓</div>
            <div className="good-title">Looking good</div>
            <div className="good-sub">
              {isLive
                ? 'No corrections needed right now.'
                : 'Enable camera to start analysis.'}
            </div>
          </div>
        ) : (
          <div className="fix-list">
            {exercises.map((ex) => (
              <div key={ex.issue} className="fix-card">
                <div className="fix-issue">{ex.issue}</div>
                <div className="fix-name">{ex.name}</div>
                <div className="fix-desc">{ex.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

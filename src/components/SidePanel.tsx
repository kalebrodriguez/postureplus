import './SidePanel.css'
import { SCORE_RING_CIRCUMFERENCE, phaseLabel, scoreColor } from '../lib/posture'
import type {
  BodyPartState,
  CoachingCue,
  ExerciseRecommendation,
  PostureAnalysis,
  PostureIssue,
  PosturePhase,
} from '../types/posture'

interface SidePanelProps {
  analysis: PostureAnalysis | null
  personDetected: boolean
  isLive: boolean
  phase: PosturePhase
  activeCue: CoachingCue | null
  bodyParts: BodyPartState[]
  exercises: ExerciseRecommendation[]
  onStartExercise: (issue: PostureIssue) => void
}

export function SidePanel({
  analysis,
  personDetected,
  isLive,
  phase,
  activeCue,
  bodyParts,
  exercises,
  onStartExercise,
}: SidePanelProps) {
  const detected = isLive && personDetected && analysis != null
  const score = detected ? analysis.score : null
  const offset =
    score == null
      ? SCORE_RING_CIRCUMFERENCE
      : SCORE_RING_CIRCUMFERENCE - (score / 100) * SCORE_RING_CIRCUMFERENCE

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
            <div className={`score-label ${detected ? analysis.status.toLowerCase() : 'none'}`}>
              {detected ? phaseLabel(phase) : 'Waiting'}
            </div>
            <div className="score-sub">
              {!detected
                ? 'Enable camera and complete calibration to begin.'
                : activeCue
                  ? activeCue.action
                  : 'Great posture — keep it up!'}
            </div>
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
              {isLive ? 'No corrections needed right now.' : 'Start a session to get drills.'}
            </div>
          </div>
        ) : (
          <div className="fix-list">
            {exercises.map((ex) => (
              <div key={ex.issue} className="fix-card">
                <div className="fix-issue">{ex.issue}</div>
                <div className="fix-name">{ex.name}</div>
                <div className="fix-desc">{ex.description}</div>
                <button
                  type="button"
                  className="fix-start"
                  onClick={() => onStartExercise(ex.issue)}
                >
                  Start guided · {ex.reps} reps
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

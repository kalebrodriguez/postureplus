import type { ExerciseRecommendation } from '../types/posture'
import './GuidedExerciseModal.css'

interface GuidedExerciseModalProps {
  exercise: ExerciseRecommendation
  rep: number
  holdLeft: number
  done: boolean
  onNextRep: () => void
  onClose: () => void
}

export function GuidedExerciseModal({
  exercise,
  rep,
  holdLeft,
  done,
  onNextRep,
  onClose,
}: GuidedExerciseModalProps) {
  return (
    <div className="guided">
      <div className="guided__card">
        <p className="guided__eyebrow">Guided exercise</p>
        <h2>{exercise.name}</h2>
        <p className="guided__for">For: {exercise.issue}</p>
        <p className="guided__desc">{exercise.description}</p>

        <div className="guided__demo" aria-hidden="true">
          <div className={`guided__pulse${holdLeft > 0 && !done ? ' is-active' : ''}`} />
          <span>{done ? 'Complete' : holdLeft > 0 ? `${holdLeft}s` : 'Rest'}</span>
        </div>

        <div className="guided__meta">
          <span>
            Rep {Math.min(rep, exercise.reps)} / {exercise.reps}
          </span>
          <span>Hold {exercise.holdSeconds}s</span>
        </div>

        <div className="guided__actions">
          {!done ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={onNextRep}
              disabled={holdLeft > 0}
            >
              {holdLeft > 0 ? 'Holding…' : rep >= exercise.reps ? 'Finish' : 'Next rep'}
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={onClose}>
              Done
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

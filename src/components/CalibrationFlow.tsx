import { useEffect, useMemo, useState } from 'react'
import { captureBaseline } from '../lib/posture'
import { saveCalibration, saveSettings, loadSettings } from '../lib/storage'
import type {
  CalibrationProfile,
  NormalizedLandmark,
  SessionGoal,
  WorkMode,
} from '../types/posture'
import './CalibrationFlow.css'

type Step = 'intro' | 'mode' | 'habitual' | 'best'

interface CalibrationFlowProps {
  landmarks: NormalizedLandmark[] | null
  personDetected: boolean
  cameraReady: boolean
  onRequestCamera: () => void
  onComplete: (profile: CalibrationProfile) => void
  onSkip: () => void
}

const GOALS: { id: SessionGoal; label: string }[] = [
  { id: 'office', label: 'Office work' },
  { id: 'studying', label: 'Studying' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'standing-desk', label: 'Standing desk' },
]

/** Desk-webcam friendly: only need a face + both shoulders in frame. */
function hasUpperBodyFrame(landmarks: NormalizedLandmark[] | null): boolean {
  if (!landmarks || landmarks.length < 13) return false
  const nose = landmarks[0]
  const lS = landmarks[11]
  const rS = landmarks[12]
  if (!nose || !lS || !rS) return false

  const inFrame = (p: NormalizedLandmark) =>
    p.x > 0.02 && p.x < 0.98 && p.y > 0.02 && p.y < 0.98

  if (!inFrame(nose) || !inFrame(lS) || !inFrame(rS)) return false

  // Shoulders should be separated and roughly level with/below the face
  const shoulderSpan = Math.abs(lS.x - rS.x)
  if (shoulderSpan < 0.08) return false
  if (lS.y < nose.y - 0.02 || rS.y < nose.y - 0.02) return false

  return true
}

export function CalibrationFlow({
  landmarks,
  personDetected,
  cameraReady,
  onRequestCamera,
  onComplete,
  onSkip,
}: CalibrationFlowProps) {
  const [step, setStep] = useState<Step>('intro')
  const [workMode, setWorkMode] = useState<WorkMode>('sitting')
  const [goal, setGoal] = useState<SessionGoal>(loadSettings().goal)
  const [habitual, setHabitual] = useState<ReturnType<typeof captureBaseline> | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [forceCapture, setForceCapture] = useState(false)

  const frameOk = useMemo(
    () => personDetected && hasUpperBodyFrame(landmarks),
    [landmarks, personDetected],
  )

  // Start the camera as soon as calibration opens so framing feedback is live
  useEffect(() => {
    if (!cameraReady) onRequestCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (countdown == null) return
    if (countdown <= 0) {
      setCountdown(null)
      const canUse =
        landmarks != null && (forceCapture || hasUpperBodyFrame(landmarks))
      if (!canUse || !landmarks) {
        setError('Couldn’t lock a clear head-and-shoulders view. Try Capture anyway.')
        setForceCapture(false)
        return
      }
      const baseline = captureBaseline(landmarks)
      setForceCapture(false)
      if (step === 'habitual') {
        setHabitual(baseline)
        setError(null)
        setStep('best')
      } else if (step === 'best') {
        const profile: CalibrationProfile = {
          workMode,
          goal,
          baseline,
          completedAt: Date.now(),
        }
        saveCalibration(profile)
        saveSettings({ ...loadSettings(), goal })
        onComplete(profile)
      }
      return
    }
    const id = window.setTimeout(() => setCountdown((c) => (c == null ? c : c - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [countdown, landmarks, step, workMode, goal, onComplete, forceCapture])

  const beginCapture = (force = false) => {
    setError(null)
    if (!cameraReady) {
      onRequestCamera()
      setError('Starting camera… click again in a moment.')
      return
    }
    if (!force && !frameOk) {
      setError('Move closer so your face and both shoulders are in view.')
      return
    }
    if (!landmarks) {
      setError('Wait until you appear on camera, then try again.')
      return
    }
    setForceCapture(force)
    setCountdown(3)
  }

  return (
    <div className="calib">
      <div className="calib__card">
        {step === 'intro' && (
          <>
            <p className="calib__eyebrow">Personal calibration</p>
            <h2>Learn your baseline in 15 seconds</h2>
            <p>
              Posture+ compares you to <em>your</em> comfortable alignment — not a generic
              mannequin. A normal laptop webcam framing is enough.
            </p>
            <ul className="calib__list">
              <li>Camera near eye level when possible</li>
              <li>Face and both shoulders in view</li>
              <li>Sit or stand how you normally work</li>
            </ul>
            <div className="calib__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  if (!cameraReady) onRequestCamera()
                  setStep('mode')
                }}
              >
                Start setup
              </button>
              <button type="button" className="btn btn--ghost" onClick={onSkip}>
                Skip for now
              </button>
            </div>
          </>
        )}

        {step === 'mode' && (
          <>
            <p className="calib__eyebrow">Setup</p>
            <h2>How are you working today?</h2>
            <div className="calib__choices">
              <button
                type="button"
                className={workMode === 'sitting' ? 'is-active' : ''}
                onClick={() => setWorkMode('sitting')}
              >
                Sitting
              </button>
              <button
                type="button"
                className={workMode === 'standing' ? 'is-active' : ''}
                onClick={() => setWorkMode('standing')}
              >
                Standing
              </button>
            </div>
            <p className="calib__sub">Session goal</p>
            <div className="calib__choices calib__choices--wrap">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={goal === g.id ? 'is-active' : ''}
                  onClick={() => setGoal(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="calib__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  if (!cameraReady) onRequestCamera()
                  setStep('habitual')
                }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'habitual' && (
          <>
            <p className="calib__eyebrow">Step 1 of 2</p>
            <h2>Hold your normal working posture</h2>
            <p>Don’t “fix” it — sit or stand the way you usually do at your desk.</p>
            <StatusLine cameraReady={cameraReady} frameOk={frameOk} countdown={countdown} />
            {error ? <p className="calib__error">{error}</p> : null}
            <div className="calib__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => beginCapture(false)}
                disabled={countdown != null}
              >
                {countdown != null ? `Capturing in ${countdown}` : 'Capture normal posture'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => beginCapture(true)}
                disabled={countdown != null || !landmarks}
              >
                Capture anyway
              </button>
            </div>
          </>
        )}

        {step === 'best' && (
          <>
            <p className="calib__eyebrow">Step 2 of 2</p>
            <h2>Now find your best comfortable posture</h2>
            <p>
              Lengthen through the spine, soften the ribs, level the shoulders. This becomes
              your personal target{habitual ? ' (we already saved your habitual baseline).' : '.'}
            </p>
            <StatusLine cameraReady={cameraReady} frameOk={frameOk} countdown={countdown} />
            {error ? <p className="calib__error">{error}</p> : null}
            <div className="calib__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => beginCapture(false)}
                disabled={countdown != null}
              >
                {countdown != null ? `Capturing in ${countdown}` : 'Save best posture'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => beginCapture(true)}
                disabled={countdown != null || !landmarks}
              >
                Capture anyway
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatusLine({
  cameraReady,
  frameOk,
  countdown,
}: {
  cameraReady: boolean
  frameOk: boolean
  countdown: number | null
}) {
  let text = 'Starting camera…'
  if (cameraReady && !frameOk) {
    text = 'Show your face and both shoulders — a typical laptop selfie framing is fine'
  } else if (cameraReady) {
    text = countdown != null ? 'Hold still…' : 'Looking good — ready to capture'
  }
  return <p className="calib__status">{text}</p>
}

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

type Step = 'intro' | 'mode' | 'habitual' | 'best' | 'confirm'

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

  const visibilityOk = useMemo(() => {
    if (!landmarks || landmarks.length < 13) return false
    // Desk webcams usually frame head + shoulders only — hips are not required.
    const pts = [0, 7, 8, 11, 12]
    return pts.every((i) => (landmarks[i]?.visibility ?? 1) > 0.45)
  }, [landmarks])

  useEffect(() => {
    if (countdown == null) return
    if (countdown <= 0) {
      setCountdown(null)
      if (!landmarks || !personDetected) {
        setError('Keep your head and shoulders in frame, then try again.')
        return
      }
      const baseline = captureBaseline(landmarks)
      if (step === 'habitual') {
        setHabitual(baseline)
        setStep('best')
      } else if (step === 'best') {
        // Prefer "best" posture as coaching baseline
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
  }, [countdown, landmarks, personDetected, step, workMode, goal, onComplete])

  const startCapture = () => {
    setError(null)
    if (!cameraReady) {
      onRequestCamera()
      return
    }
    if (!personDetected || !visibilityOk) {
      setError('Center your head and shoulders in the frame. Hips don’t need to be visible.')
      return
    }
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
              mannequin. Your video stays on this device.
            </p>
            <ul className="calib__list">
              <li>Place the camera near eye level when possible</li>
              <li>Keep your head and shoulders clearly in frame</li>
              <li>Sit or stand as you normally work — hips aren’t required</li>
            </ul>
            <div className="calib__actions">
              <button type="button" className="btn btn--primary" onClick={() => setStep('mode')}>
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
            <StatusLine
              cameraReady={cameraReady}
              personDetected={personDetected}
              visibilityOk={visibilityOk}
              countdown={countdown}
            />
            {error ? <p className="calib__error">{error}</p> : null}
            <div className="calib__actions">
              <button type="button" className="btn btn--primary" onClick={startCapture} disabled={countdown != null}>
                {countdown != null ? `Capturing in ${countdown}` : 'Capture normal posture'}
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
            <StatusLine
              cameraReady={cameraReady}
              personDetected={personDetected}
              visibilityOk={visibilityOk}
              countdown={countdown}
            />
            {error ? <p className="calib__error">{error}</p> : null}
            <div className="calib__actions">
              <button type="button" className="btn btn--primary" onClick={startCapture} disabled={countdown != null}>
                {countdown != null ? `Capturing in ${countdown}` : 'Save best posture'}
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
  personDetected,
  visibilityOk,
  countdown,
}: {
  cameraReady: boolean
  personDetected: boolean
  visibilityOk: boolean
  countdown: number | null
}) {
  let text = 'Enable camera to begin'
  if (cameraReady && !personDetected) text = 'No person detected — step into frame'
  else if (cameraReady && !visibilityOk) text = 'Move so your head and both shoulders are clearly visible'
  else if (cameraReady) text = countdown != null ? 'Hold still…' : 'Looking good — ready to capture'
  return <p className="calib__status">{text}</p>
}

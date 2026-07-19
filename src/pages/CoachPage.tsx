import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { CameraPanel } from '../components/CameraPanel'
import { SidePanel } from '../components/SidePanel'
import { AlertToast } from '../components/AlertToast'
import { CalibrationFlow } from '../components/CalibrationFlow'
import { SessionSummaryModal } from '../components/SessionSummaryModal'
import { GuidedExerciseModal } from '../components/GuidedExerciseModal'
import { usePoseCamera } from '../hooks/usePoseCamera'
import { useCoachingSession } from '../hooks/useCoachingSession'
import { loadCalibration } from '../lib/storage'
import type { CalibrationProfile, PosturePhase } from '../types/posture'

export function CoachPage() {
  const navigate = useNavigate()
  const [calibration, setCalibration] = useState<CalibrationProfile | null>(() => loadCalibration())
  const [showCalibration, setShowCalibration] = useState(() => !loadCalibration())
  const [showSummary, setShowSummary] = useState(false)
  const [pausedGate, setPausedGate] = useState(false)
  const [phaseGate, setPhaseGate] = useState<PosturePhase>('none')

  const camera = usePoseCamera({
    baseline: calibration?.baseline,
    workMode: calibration?.workMode,
    phase: phaseGate,
    paused: pausedGate,
  })

  const session = useCoachingSession(
    camera.analysis,
    camera.personDetected,
    camera.phase === 'live',
    calibration,
  )

  useEffect(() => {
    setPausedGate(session.stats.paused)
  }, [session.stats.paused])

  useEffect(() => {
    setPhaseGate(session.phase)
  }, [session.phase])

  const scoreLabel =
    camera.phase === 'live' && camera.personDetected && camera.analysis
      ? `Score ${camera.analysis.score}/100`
      : ''

  const endAndSummarize = () => {
    const snap = session.endSession()
    camera.stop()
    if (snap) setShowSummary(true)
  }

  return (
    <div className="app-shell coach-shell">
      <Header
        variant="coach"
        badgeLabel={session.badgeLabel}
        badgeTone={session.badgeTone}
      />

      <main className="main">
        <CameraPanel
          phase={camera.phase}
          error={camera.error}
          scoreLabel={scoreLabel}
          stats={session.stats}
          activeCue={session.activeCue}
          videoRef={camera.videoRef}
          canvasRef={camera.canvasRef}
          hideStartScreen={showCalibration}
          overlay={
            showCalibration ? (
              <CalibrationFlow
                landmarks={camera.landmarks}
                personDetected={camera.personDetected}
                cameraReady={camera.phase === 'live'}
                onRequestCamera={() => {
                  void camera.start()
                }}
                onComplete={(profile) => {
                  setCalibration(profile)
                  setShowCalibration(false)
                }}
                onSkip={() => setShowCalibration(false)}
              />
            ) : null
          }
          onStart={() => {
            void camera.start()
          }}
          onEndSession={endAndSummarize}
          onTogglePause={session.togglePause}
          onToggleMute={session.toggleMute}
          onAlertDelayChange={session.setAlertDelaySec}
        />
        <SidePanel
          analysis={camera.analysis}
          personDetected={camera.personDetected}
          isLive={camera.phase === 'live'}
          phase={session.phase}
          activeCue={session.activeCue}
          bodyParts={session.bodyParts}
          exercises={session.exercises}
          onStartExercise={session.startGuidedExercise}
        />
      </main>

      <AlertToast message={session.toastMessage} />

      {showSummary && session.summary ? (
        <SessionSummaryModal
          summary={session.summary}
          onClose={() => {
            setShowSummary(false)
          }}
          onGuided={() => {
            if (session.summary?.topIssue) {
              void camera.start()
              session.startGuidedExercise(session.summary.topIssue)
            }
            setShowSummary(false)
          }}
          onViewProgress={() => navigate('/progress')}
        />
      ) : null}

      {session.guided.exercise ? (
        <GuidedExerciseModal
          exercise={session.guided.exercise}
          rep={session.guided.rep}
          holdLeft={session.guided.holdLeft}
          done={session.guided.done}
          onNextRep={session.guided.nextRep}
          onClose={session.guided.close}
        />
      ) : null}
    </div>
  )
}

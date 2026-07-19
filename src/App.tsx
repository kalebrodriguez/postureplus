import { Header } from './components/Header'
import { CameraPanel } from './components/CameraPanel'
import { SidePanel } from './components/SidePanel'
import { AlertToast } from './components/AlertToast'
import { usePoseCamera } from './hooks/usePoseCamera'
import { useSessionTracker } from './hooks/useSessionTracker'
import './styles/global.css'

export default function App() {
  const camera = usePoseCamera()
  const isLive = camera.phase === 'live'
  const session = useSessionTracker(camera.analysis, camera.personDetected, isLive)

  const scoreLabel =
    isLive && camera.personDetected && camera.analysis
      ? `Score ${camera.analysis.score}/100`
      : ''

  return (
    <div className="app-shell">
      <Header badgeLabel={session.badgeLabel} badgeTone={session.badgeTone} />

      <main className="main">
        <CameraPanel
          phase={camera.phase}
          error={camera.error}
          scoreLabel={scoreLabel}
          stats={session.stats}
          videoRef={camera.videoRef}
          canvasRef={camera.canvasRef}
          onStart={() => {
            void camera.start()
          }}
        />
        <SidePanel
          analysis={camera.analysis}
          personDetected={camera.personDetected}
          isLive={isLive}
          bodyParts={session.bodyParts}
          exercises={session.exercises}
        />
      </main>

      <AlertToast message={session.toastMessage} />
    </div>
  )
}

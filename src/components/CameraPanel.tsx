import type { RefObject } from 'react'
import './CameraPanel.css'
import type { CameraPhase } from '../hooks/usePoseCamera'
import type { SessionStats } from '../types/posture'

interface CameraPanelProps {
  phase: CameraPhase
  error: string | null
  scoreLabel: string
  stats: SessionStats
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  onStart: () => void
}

export function CameraPanel({
  phase,
  error,
  scoreLabel,
  stats,
  videoRef,
  canvasRef,
  onStart,
}: CameraPanelProps) {
  const isLive = phase === 'live'
  const isStarting = phase === 'starting'

  return (
    <section className="camera-section">
      <div className="camera-wrap">
        {!isLive && (
          <div id="start-screen" className="start-screen">
            <h2>AI Posture Coach</h2>
            <p>Click below to enable your webcam and start real-time posture analysis.</p>
            <button
              type="button"
              className="start-btn"
              onClick={onStart}
              disabled={isStarting}
            >
              {isStarting ? 'Starting...' : 'Enable Camera'}
            </button>
            {error ? <span className="error-msg">{error}</span> : null}
          </div>
        )}

        <canvas ref={canvasRef} className="output-canvas" />
        <video ref={videoRef} className="input-video" playsInline muted />

        <div className="cam-bar">
          <div className="live-pill">
            <div className={`live-dot${isLive ? ' on' : ''}`} />
            Live
          </div>
          <div className="cam-score">{scoreLabel}</div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-label">Session</div>
          <div className="stat-value">{stats.elapsedLabel}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Good Posture</div>
          <div className="stat-value">
            {stats.goodPercent == null ? '—' : `${stats.goodPercent}%`}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Alerts</div>
          <div className="stat-value">{stats.alertCount}</div>
        </div>
      </div>
    </section>
  )
}

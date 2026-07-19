import type { RefObject, ReactNode } from 'react'
import './CameraPanel.css'
import type { CameraPhase } from '../hooks/usePoseCamera'
import { phaseLabel } from '../lib/posture'
import type { CoachingCue, SessionStats } from '../types/posture'

interface CameraPanelProps {
  phase: CameraPhase
  error: string | null
  scoreLabel: string
  stats: SessionStats
  activeCue: CoachingCue | null
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  overlay?: ReactNode
  onStart: () => void
  onEndSession?: () => void
  onTogglePause?: () => void
  onToggleMute?: () => void
  onAlertDelayChange?: (sec: number) => void
  hideStartScreen?: boolean
}

export function CameraPanel({
  phase,
  error,
  scoreLabel,
  stats,
  activeCue,
  videoRef,
  canvasRef,
  overlay,
  onStart,
  onEndSession,
  onTogglePause,
  onToggleMute,
  onAlertDelayChange,
  hideStartScreen = false,
}: CameraPanelProps) {
  const isLive = phase === 'live'
  const isStarting = phase === 'starting'

  return (
    <section className="camera-section">
      <div className="camera-wrap">
        {!isLive && !hideStartScreen && (
          <div id="start-screen" className="start-screen">
            <div className="start-visual" aria-hidden="true">
              <div className="start-frame" />
              <div className="start-silhouette" />
            </div>
            <h2>Set up your coach</h2>
            <p>
              Place the camera near eye level. We’ll analyze spine, shoulders, head, and neck —
              all on this device.
            </p>
            <p className="privacy-note">Your video never leaves this device.</p>
            <button
              type="button"
              className="start-btn"
              onClick={onStart}
              disabled={isStarting}
            >
              {isStarting ? 'Starting...' : 'Enable Camera'}
            </button>
            <p className="start-help">
              Troubleshooting: allow camera permission, close other apps using the webcam, and
              ensure you’re on HTTPS or localhost.
            </p>
            {error ? <span className="error-msg">{error}</span> : null}
          </div>
        )}

        <canvas ref={canvasRef} className="output-canvas" />
        <video ref={videoRef} className="input-video" playsInline muted />
        {overlay}

        <div className="cam-bar">
          <div className="live-pill">
            <div className={`live-dot${isLive && !stats.paused ? ' on' : ''}`} />
            {stats.paused ? 'Paused' : 'Live'}
          </div>
          <div className="cam-score">
            {scoreLabel}
            {isLive ? ` · ${phaseLabel(stats.phase)}` : ''}
          </div>
        </div>
      </div>

      {activeCue ? (
        <div className={`cue-banner cue-banner--${activeCue.severity}`}>
          <strong>{activeCue.observation}</strong>
          <span>{activeCue.action}</span>
        </div>
      ) : null}

      {(stats.breakHint || stats.fatigueHint) && (
        <div className="hint-banner">
          {stats.breakHint ?? stats.fatigueHint}
        </div>
      )}

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

      {isLive ? (
        <div className="coach-controls">
          <button type="button" onClick={onTogglePause}>
            {stats.paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={onToggleMute}>
            {stats.muted ? 'Unmute alerts' : 'Mute alerts'}
          </button>
          <label className="delay-control">
            Alert after
            <select
              value={stats.alertDelaySec}
              onChange={(e) => onAlertDelayChange?.(Number(e.target.value))}
              aria-label="Alert delay"
            >
              <option value={20}>20s</option>
              <option value={30}>30s</option>
              <option value={45}>45s</option>
            </select>
          </label>
          <button type="button" className="danger" onClick={onEndSession}>
            End session
          </button>
        </div>
      ) : null}
    </section>
  )
}

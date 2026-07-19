import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import {
  drawCoachingOverlay,
  drawPoseOverlay,
  getPoseLandmarker,
  requestCameraStream,
} from '../lib/poseEngine'
import { analyzePosture, emptyAnalysis, skeletonColor } from '../lib/posture'
import type {
  CalibrationBaseline,
  NormalizedLandmark as AppLandmark,
  PostureAnalysis,
  PosturePhase,
  WorkMode,
} from '../types/posture'

export type CameraPhase = 'idle' | 'starting' | 'live' | 'error'

interface UsePoseCameraOptions {
  baseline?: CalibrationBaseline | null
  workMode?: WorkMode
  phase?: PosturePhase
  paused?: boolean
  onLandmarks?: (landmarks: AppLandmark[]) => void
}

interface UsePoseCameraResult {
  phase: CameraPhase
  error: string | null
  analysis: PostureAnalysis | null
  personDetected: boolean
  landmarks: AppLandmark[] | null
  landmarksRef: RefObject<AppLandmark[] | null>
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  start: () => Promise<void>
  stop: () => void
}

export function usePoseCamera(options: UsePoseCameraOptions = {}): UsePoseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTimestampRef = useRef(0)
  const lastUiUpdateRef = useRef(0)
  const runningRef = useRef(false)
  const landmarksRef = useRef<AppLandmark[] | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [phase, setPhase] = useState<CameraPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PostureAnalysis | null>(null)
  const [personDetected, setPersonDetected] = useState(false)
  const [landmarks, setLandmarks] = useState<AppLandmark[] | null>(null)

  const publishUi = useCallback((next: PostureAnalysis, detected: boolean, lm: AppLandmark[] | null) => {
    const now = performance.now()
    if (now - lastUiUpdateRef.current < 100) return
    lastUiUpdateRef.current = now
    setAnalysis(next)
    setPersonDetected(detected)
    setLandmarks(lm)
  }, [])

  const stop = useCallback(() => {
    runningRef.current = false
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    landmarksRef.current = null
    setPhase('idle')
    setPersonDetected(false)
    setLandmarks(null)
  }, [])

  const renderFrame = useCallback(async () => {
    if (!runningRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => {
        void renderFrame()
      })
      return
    }

    try {
      const landmarker = await getPoseLandmarker()
      const now = performance.now()
      if (now <= lastTimestampRef.current) lastTimestampRef.current += 1
      else lastTimestampRef.current = now

      const result = landmarker.detectForVideo(video, lastTimestampRef.current)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const opts = optionsRef.current
      if (opts.paused) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#fff'
        ctx.font = '600 20px system-ui'
        ctx.fillText('Paused', 24, 40)
        ctx.restore()
      } else {
        const landmarks = result.landmarks[0] as NormalizedLandmark[] | undefined
        if (landmarks?.length) {
          const appLandmarks = landmarks as AppLandmark[]
          landmarksRef.current = appLandmarks
          opts.onLandmarks?.(appLandmarks)

          const next = analyzePosture(appLandmarks, {
            baseline: opts.baseline,
            workMode: opts.workMode,
            phase: opts.phase,
          })
          drawPoseOverlay(ctx, landmarks, skeletonColor(next.status))
          drawCoachingOverlay(ctx, next.metrics, next.cues, opts.baseline)
          publishUi(next, true, appLandmarks)
        } else {
          landmarksRef.current = null
          publishUi(emptyAnalysis(opts.phase ?? 'none'), false, null)
        }
        ctx.restore()
      }
    } catch (err) {
      console.error(err)
    }

    rafRef.current = requestAnimationFrame(() => {
      void renderFrame()
    })
  }, [publishUi])

  const start = useCallback(async () => {
    if (runningRef.current || phase === 'starting' || phase === 'live') return

    setPhase('starting')
    setError(null)

    try {
      await getPoseLandmarker()
      const stream = await requestCameraStream()
      streamRef.current = stream

      const video = videoRef.current
      if (!video) throw new Error('Video element is not ready.')

      video.srcObject = stream
      await video.play()

      runningRef.current = true
      setPhase('live')
      rafRef.current = requestAnimationFrame(() => {
        void renderFrame()
      })
    } catch (err) {
      stop()
      const message =
        err instanceof Error
          ? err.name === 'NotAllowedError' || err.message.includes('NotAllowed')
            ? 'Camera access denied. Please allow camera in your browser settings.'
            : err.message
          : 'Could not start camera.'
      setError(message)
      setPhase('error')
    }
  }, [phase, renderFrame, stop])

  useEffect(() => () => stop(), [stop])

  return {
    phase,
    error,
    analysis,
    personDetected,
    landmarks,
    landmarksRef,
    videoRef,
    canvasRef,
    start,
    stop,
  }
}

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { drawPoseOverlay, getPoseLandmarker, requestCameraStream } from '../lib/poseEngine'
import { analyzePosture, skeletonColor } from '../lib/posture'
import type { PostureAnalysis } from '../types/posture'

export type CameraPhase = 'idle' | 'starting' | 'live' | 'error'

interface UsePoseCameraResult {
  phase: CameraPhase
  error: string | null
  analysis: PostureAnalysis | null
  personDetected: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  start: () => Promise<void>
  stop: () => void
}

const EMPTY_ANALYSIS: PostureAnalysis = {
  issues: [],
  score: 0,
  status: 'None',
}

export function usePoseCamera(): UsePoseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTimestampRef = useRef(0)
  const lastUiUpdateRef = useRef(0)
  const runningRef = useRef(false)

  const [phase, setPhase] = useState<CameraPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PostureAnalysis | null>(null)
  const [personDetected, setPersonDetected] = useState(false)

  const publishUi = useCallback((next: PostureAnalysis, detected: boolean) => {
    const now = performance.now()
    // Keep the HUD readable without re-rendering on every camera frame
    if (now - lastUiUpdateRef.current < 120) return
    lastUiUpdateRef.current = now
    setAnalysis(next)
    setPersonDetected(detected)
  }, [])

  const stop = useCallback(() => {
    runningRef.current = false
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
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
      // MediaPipe VIDEO mode requires strictly increasing timestamps
      if (now <= lastTimestampRef.current) {
        lastTimestampRef.current += 1
      } else {
        lastTimestampRef.current = now
      }

      const result = landmarker.detectForVideo(video, lastTimestampRef.current)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const landmarks = result.landmarks[0] as NormalizedLandmark[] | undefined
      if (landmarks?.length) {
        const next = analyzePosture(landmarks)
        drawPoseOverlay(ctx, landmarks, skeletonColor(next.status))
        publishUi(next, true)
      } else {
        publishUi(EMPTY_ANALYSIS, false)
      }
      ctx.restore()
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
      if (!video) {
        throw new Error('Video element is not ready.')
      }

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
          ? err.message.includes('NotAllowed') || err.name === 'NotAllowedError'
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
    videoRef,
    canvasRef,
    start,
    stop,
  }
}

import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'
import type { CalibrationBaseline, CoachingCue, PostureMetrics } from '../types/posture'

const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

let landmarkerPromise: Promise<PoseLandmarker> | null = null

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
    })()
  }

  return landmarkerPromise
}

export function drawPoseOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  lineColor: string,
): void {
  const drawingUtils = new DrawingUtils(ctx)
  drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
    color: lineColor,
    lineWidth: 2.5,
  })
  drawingUtils.drawLandmarks(landmarks, {
    color: 'rgba(255,255,255,0.85)',
    lineWidth: 1,
    radius: 3,
  })
}

export function drawCoachingOverlay(
  ctx: CanvasRenderingContext2D,
  metrics: PostureMetrics,
  cues: CoachingCue[],
  baseline: CalibrationBaseline | null | undefined,
): void {
  const w = ctx.canvas.width
  const h = ctx.canvas.height

  if (baseline) {
    ctx.save()
    ctx.strokeStyle = 'rgba(79, 142, 247, 0.45)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(baseline.midEar.x * w, baseline.midEar.y * h)
    ctx.lineTo(baseline.midShoulder.x * w, baseline.midShoulder.y * h)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(baseline.midEar.x * w, baseline.midEar.y * h, 10, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  for (const cue of cues) {
    ctx.save()
    const color =
      cue.severity === 'sustained' ? 'rgba(239,68,68,0.95)' : 'rgba(245,158,11,0.9)'
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 3

    if (cue.bodyPart === 'head') {
      const x = metrics.midEar.x * w
      const y = metrics.midEar.y * h
      // Arrow pointing backward (chin tuck direction)
      ctx.beginPath()
      ctx.moveTo(x + 28, y)
      ctx.lineTo(x + 8, y)
      ctx.lineTo(x + 14, y - 6)
      ctx.moveTo(x + 8, y)
      ctx.lineTo(x + 14, y + 6)
      ctx.stroke()
    }

    if (cue.bodyPart === 'shoulders') {
      const y = metrics.midShoulder.y * h
      const x = metrics.midShoulder.x * w
      ctx.beginPath()
      ctx.moveTo(x - 40, y - 18)
      ctx.lineTo(x - 40, y)
      ctx.lineTo(x - 34, y - 6)
      ctx.moveTo(x - 40, y)
      ctx.lineTo(x - 46, y - 6)
      ctx.stroke()
    }

    if (cue.bodyPart === 'spine') {
      const x = metrics.midShoulder.x * w
      const y1 = metrics.midShoulder.y * h
      const y2 = metrics.midHip.y * h
      ctx.beginPath()
      ctx.moveTo(x - 24, (y1 + y2) / 2)
      ctx.lineTo(x - 8, (y1 + y2) / 2 - 16)
      ctx.stroke()
    }

    if (cue.bodyPart === 'neck') {
      const x = metrics.midEar.x * w
      const y = metrics.midEar.y * h
      ctx.beginPath()
      ctx.arc(x, y, 16, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }
}

export async function requestCameraStream(): Promise<MediaStream> {
  if (!window.isSecureContext) {
    throw new Error(
      'Camera requires HTTPS. Open this app via GitHub Pages or localhost.',
    )
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser does not support camera access.')
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user',
    },
    audio: false,
  })
}

import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision'

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

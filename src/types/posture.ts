export type PostureStatus = 'Good' | 'Fair' | 'Poor' | 'None'

export type PostureIssue =
  | 'Slouching'
  | 'Uneven shoulders'
  | 'Head drooping forward'
  | 'Head tilting'

export interface PostureAnalysis {
  issues: PostureIssue[]
  score: number
  status: PostureStatus
}

export interface NormalizedLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface SessionStats {
  elapsedLabel: string
  goodPercent: number | null
  alertCount: number
}

export type BodyPartKey = 'spine' | 'shoulders' | 'head' | 'neck'

export interface BodyPartState {
  key: BodyPartKey
  label: string
  icon: string
  statusText: string
  state: 'idle' | 'ok' | 'bad'
}

export interface ExerciseRecommendation {
  issue: PostureIssue
  name: string
  description: string
}

export type CardOrientation = 'upright' | 'reversed'

export type TrainerMode = 'browse' | 'study'

export type StudyRating = 'known' | 'practice'

export interface StudyProgress {
  knownCardIds: string[]
  practiceCardIds: string[]
  orientationProgress: Record<
    string,
    Partial<Record<CardOrientation, StudyRating>>
  >
}

export interface TrainerStateV1 {
  version: 1
  mode: TrainerMode
  shuffleEnabled: boolean
  reversedEnabled: boolean
  deckOrderIds: string[]
  currentIndex: number
  orientations: Array<CardOrientation | null>
  studyRevealed: boolean
  studyProgress: StudyProgress
}

export type TrainerState = TrainerStateV1

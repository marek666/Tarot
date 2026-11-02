export type CardOrientation = 'upright' | 'reversed'

export type ClassicTrainerMode = 'browse' | 'study'

export type TrainerMode = ClassicTrainerMode | 'journey'

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

export interface TrainerStateV2 {
  version: 2
  mode: TrainerMode
  previousMode: ClassicTrainerMode
  shuffleEnabled: boolean
  reversedEnabled: boolean
  deckOrderIds: string[]
  currentIndex: number
  orientations: Array<CardOrientation | null>
  studyRevealed: boolean
  studyProgress: StudyProgress
  studyProgressExpanded: boolean
  journeyChapterIndex: number
  journeyHighestChapterIndex: number
}

export type TrainerState = TrainerStateV2

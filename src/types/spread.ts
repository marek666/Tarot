import type { DailyArea } from './dailyCard.ts'
import type { TarotCard } from './tarot.ts'
import type { CardOrientation } from './trainer.ts'

export const SPREAD_LAYOUT_IDS = ['timeline', 'situation', 'relationship'] as const

export type SpreadLayoutId = (typeof SPREAD_LAYOUT_IDS)[number]

export interface SpreadPositionDefinition {
  id: string
  title: string
  shortTitle: string
  role: string
  readingLens: string
  reflectionPrompt: string
}

export interface SpreadLayoutDefinition {
  id: SpreadLayoutId
  title: string
  description: string
  positions: readonly [
    SpreadPositionDefinition,
    SpreadPositionDefinition,
    SpreadPositionDefinition,
  ]
  connectionPrompt: string
  finalPrompt: string
}

export interface SpreadCardState {
  cardId: string
  orientation: CardOrientation
  revealed: boolean
  interpretationRevealed: boolean
}

export interface ThreeCardSpreadState {
  version: 1
  layoutId: SpreadLayoutId
  area: DailyArea
  question: string
  reversedEnabled: boolean
  learningFirst: boolean
  cards: SpreadCardState[]
}

export interface SpreadCardInterpretation {
  position: SpreadPositionDefinition
  keywords: readonly string[]
  classicSummary: string
  classicDescription: string
  positionMeaning: string
  areaConnection: string
  reflectionQuestion: string
}

export interface CombinedSpreadInterpretation {
  overview: string
  cardThemes: readonly string[]
  pattern: string
  connectionQuestions: readonly string[]
  finalQuestion: string
}

export interface ResolvedSpreadCard {
  state: SpreadCardState
  card: TarotCard
}

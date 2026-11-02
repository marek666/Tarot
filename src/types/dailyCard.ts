import type { CardOrientation } from './trainer.ts'

export const DAILY_AREAS = ['general', 'relationships', 'work', 'growth'] as const

export type DailyArea = (typeof DAILY_AREAS)[number]

export interface DailyCardState {
  version: 1
  localDate: string
  cardId: string
  orientation: CardOrientation
  area: DailyArea
}

export interface DailyInterpretation {
  keywords: readonly string[]
  summary: string
  traditionalConnection: string
  reflectionQuestion: string
}

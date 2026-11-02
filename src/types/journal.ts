import type { DailyArea, DailyCardState } from './dailyCard.ts'
import type { SpreadLayoutId, SpreadCardState, ThreeCardSpreadState } from './spread.ts'

export interface JournalBase {
  id: string
  createdAt: string
  note: string
  area: DailyArea
}

export interface JournalDailyEntry extends JournalBase {
  type: 'daily'
  localDate: string
  cardId: string
  orientation: DailyCardState['orientation']
}

export interface JournalSpreadEntry extends JournalBase {
  type: 'spread'
  layoutId: SpreadLayoutId
  question: string
  cards: [SpreadCardState, SpreadCardState, SpreadCardState]
}

export type JournalEntry = JournalDailyEntry | JournalSpreadEntry
export interface JournalState { version: 1; entries: JournalEntry[] }

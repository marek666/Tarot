import type { DailyArea, DailyCardState } from '../types/dailyCard.ts'
import { DAILY_AREAS } from '../types/dailyCard.ts'
import type { CardOrientation } from '../types/trainer.ts'
import type { StorageLike } from './trainerState.ts'
import {
  sampleRandomIndex,
  secureRandomUint32,
  type RandomUint32Source,
} from './random.ts'

export type { RandomUint32Source } from './random.ts'

export const DAILY_CARD_STATE_KEY = 'tarot-trainer:daily-card'
export const DAILY_CARD_STATE_VERSION = 1

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatLocalDateLabel(localDate: string): string {
  if (!isValidDateKey(localDate)) return localDate
  const [year, month, day] = localDate.split('-').map(Number)
  return new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'full' }).format(
    new Date(year!, month! - 1, day),
  )
}

function isValidDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function isDailyArea(value: unknown): value is DailyArea {
  return typeof value === 'string' && (DAILY_AREAS as readonly string[]).includes(value)
}

function isOrientation(value: unknown): value is CardOrientation {
  return value === 'upright' || value === 'reversed'
}

export function createDailyCardState(
  cardIds: readonly string[],
  localDate: string,
  reversedEnabled: boolean,
  area: DailyArea = 'general',
  randomUint32: RandomUint32Source = secureRandomUint32,
): DailyCardState {
  if (!isValidDateKey(localDate)) throw new RangeError('Datum denní karty není platné.')

  const cardId = cardIds[sampleRandomIndex(cardIds.length, randomUint32)]!
  const orientation: CardOrientation = reversedEnabled && sampleRandomIndex(2, randomUint32) === 0
    ? 'reversed'
    : 'upright'

  return {
    version: DAILY_CARD_STATE_VERSION,
    localDate,
    cardId,
    orientation,
    area,
  }
}

export function parseDailyCardState(
  raw: string,
  validCardIds: readonly string[],
): DailyCardState | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
    const record = value as Record<string, unknown>

    if (
      record.version !== DAILY_CARD_STATE_VERSION ||
      typeof record.localDate !== 'string' ||
      !isValidDateKey(record.localDate) ||
      typeof record.cardId !== 'string' ||
      !validCardIds.includes(record.cardId) ||
      !isOrientation(record.orientation) ||
      !isDailyArea(record.area)
    ) {
      return null
    }

    return {
      version: DAILY_CARD_STATE_VERSION,
      localDate: record.localDate,
      cardId: record.cardId,
      orientation: record.orientation,
      area: record.area,
    }
  } catch {
    return null
  }
}

function saveDailyCardState(storage: StorageLike | null, state: DailyCardState): boolean {
  if (!storage) return false
  try {
    storage.setItem(DAILY_CARD_STATE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function loadOrCreateDailyCardState(
  storage: StorageLike | null,
  cardIds: readonly string[],
  reversedEnabled: boolean,
  now: Date = new Date(),
  randomUint32: RandomUint32Source = secureRandomUint32,
): DailyCardState {
  const localDate = getLocalDateKey(now)
  let previousArea: DailyArea = 'general'

  if (storage) {
    try {
      const raw = storage.getItem(DAILY_CARD_STATE_KEY)
      if (raw) {
        const restored = parseDailyCardState(raw, cardIds)
        if (restored?.localDate === localDate) return restored
        if (restored) previousArea = restored.area
      }
    } catch {
      // Denní karta zůstane funkční v paměti i bez dostupného localStorage.
    }
  }

  const created = createDailyCardState(
    cardIds,
    localDate,
    reversedEnabled,
    previousArea,
    randomUint32,
  )
  saveDailyCardState(storage, created)
  return created
}

export function changeDailyArea(
  storage: StorageLike | null,
  state: DailyCardState,
  area: DailyArea,
): DailyCardState {
  const updated = { ...state, area }
  saveDailyCardState(storage, updated)
  return updated
}

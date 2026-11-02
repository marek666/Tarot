import type { DailyArea } from '../types/dailyCard.ts'
import { DAILY_AREAS } from '../types/dailyCard.ts'
import type {
  SpreadCardState,
  SpreadLayoutId,
  ThreeCardSpreadState,
} from '../types/spread.ts'
import { SPREAD_LAYOUT_IDS } from '../types/spread.ts'
import type { CardOrientation } from '../types/trainer.ts'
import {
  createUniqueId,
  sampleRandomIndex,
  secureRandomUint32,
  type RandomUint32Source,
} from './random.ts'
import type { StorageLike } from './trainerState.ts'

export const SPREAD_STATE_KEY = 'tarot-trainer:spread'
export const SPREAD_STATE_VERSION = 2
export const SPREAD_QUESTION_MAX_LENGTH = 280

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLayoutId(value: unknown): value is SpreadLayoutId {
  return typeof value === 'string' && (SPREAD_LAYOUT_IDS as readonly string[]).includes(value)
}

function isArea(value: unknown): value is DailyArea {
  return typeof value === 'string' && (DAILY_AREAS as readonly string[]).includes(value)
}

function isOrientation(value: unknown): value is CardOrientation {
  return value === 'upright' || value === 'reversed'
}

function isValidReadingId(value: unknown): value is string {
  return typeof value === 'string' && /^spread:[a-f0-9]{32}$/.test(value)
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && new Date(value).toISOString() === value
}

export function createSpreadReadingId(): string {
  return createUniqueId('spread')
}

export function normalizeSpreadQuestion(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, SPREAD_QUESTION_MAX_LENGTH)
}

export function createDefaultSpreadState(
  reversedEnabled = false,
): ThreeCardSpreadState {
  return {
    version: SPREAD_STATE_VERSION,
    readingId: null,
    dealtAt: null,
    layoutId: 'timeline',
    area: 'general',
    question: '',
    reversedEnabled,
    learningFirst: false,
    cards: [],
  }
}

export function parseSpreadState(
  raw: string,
  validCardIds: readonly string[],
  createId: () => string = createSpreadReadingId,
  now: Date = new Date(),
): ThreeCardSpreadState | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || (value.version !== 1 && value.version !== SPREAD_STATE_VERSION)) return null
    if (
      !isLayoutId(value.layoutId) ||
      !isArea(value.area) ||
      typeof value.question !== 'string' ||
      value.question.length > SPREAD_QUESTION_MAX_LENGTH ||
      typeof value.reversedEnabled !== 'boolean' ||
      typeof value.learningFirst !== 'boolean' ||
      !Array.isArray(value.cards) ||
      (value.cards.length !== 0 && value.cards.length !== 3)
    ) {
      return null
    }

    const validIds = new Set(validCardIds)
    const parsedCards: SpreadCardState[] = []
    for (const candidate of value.cards) {
      if (
        !isRecord(candidate) ||
        typeof candidate.cardId !== 'string' ||
        !validIds.has(candidate.cardId) ||
        !isOrientation(candidate.orientation) ||
        typeof candidate.revealed !== 'boolean' ||
        typeof candidate.interpretationRevealed !== 'boolean' ||
        (!candidate.revealed && candidate.interpretationRevealed) ||
        (!value.learningFirst && candidate.revealed && !candidate.interpretationRevealed)
      ) {
        return null
      }
      parsedCards.push({
        cardId: candidate.cardId,
        orientation: candidate.orientation,
        revealed: candidate.revealed,
        interpretationRevealed: candidate.interpretationRevealed,
      })
    }

    if (new Set(parsedCards.map((card) => card.cardId)).size !== parsedCards.length) return null

    const hasCards = parsedCards.length === 3
    const readingId = value.version === 1
      ? hasCards ? createId() : null
      : value.readingId
    const dealtAt = value.version === 1
      ? hasCards ? now.toISOString() : null
      : value.dealtAt
    if (
      (hasCards && (!isValidReadingId(readingId) || !isValidIsoDate(dealtAt))) ||
      (!hasCards && (readingId !== null || dealtAt !== null))
    ) return null

    return {
      version: SPREAD_STATE_VERSION,
      readingId: readingId as string | null,
      dealtAt: dealtAt as string | null,
      layoutId: value.layoutId,
      area: value.area,
      question: normalizeSpreadQuestion(value.question),
      reversedEnabled: value.reversedEnabled,
      learningFirst: value.learningFirst,
      cards: parsedCards,
    }
  } catch {
    return null
  }
}

export function saveSpreadState(
  storage: StorageLike | null,
  state: ThreeCardSpreadState,
): boolean {
  if (!storage) return false
  try {
    storage.setItem(SPREAD_STATE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function loadSpreadState(
  storage: StorageLike | null,
  validCardIds: readonly string[],
  defaultReversedEnabled = false,
): ThreeCardSpreadState {
  if (!storage) return createDefaultSpreadState(defaultReversedEnabled)
  try {
    const raw = storage.getItem(SPREAD_STATE_KEY)
    if (!raw) return createDefaultSpreadState(defaultReversedEnabled)
    const parsed = parseSpreadState(raw, validCardIds)
    if (parsed) {
      if (JSON.parse(raw).version !== SPREAD_STATE_VERSION) saveSpreadState(storage, parsed)
      return parsed
    }
    storage.removeItem(SPREAD_STATE_KEY)
  } catch {
    // Paměťový stav zůstane použitelný i při blokovaném localStorage.
  }
  return createDefaultSpreadState(defaultReversedEnabled)
}

export function updateSpreadSettings(
  state: ThreeCardSpreadState,
  patch: Partial<Pick<
    ThreeCardSpreadState,
    'layoutId' | 'area' | 'question' | 'reversedEnabled' | 'learningFirst'
  >>,
): ThreeCardSpreadState {
  if (state.cards.length > 0) return state
  return {
    ...state,
    ...patch,
    question: patch.question === undefined
      ? state.question
      : patch.question.slice(0, SPREAD_QUESTION_MAX_LENGTH),
  }
}

export function dealThreeCardSpread(
  state: ThreeCardSpreadState,
  cardIds: readonly string[],
  randomUint32: RandomUint32Source = secureRandomUint32,
  createId: () => string = createSpreadReadingId,
  now: Date = new Date(),
): ThreeCardSpreadState {
  if (cardIds.length < 3) throw new RangeError('Tříkaretní výklad vyžaduje alespoň tři karty.')

  const pool = [...cardIds]
  const cards: SpreadCardState[] = []
  for (let position = 0; position < 3; position += 1) {
    const selectedIndex = position + sampleRandomIndex(pool.length - position, randomUint32)
    const selectedId = pool[selectedIndex]!
    pool[selectedIndex] = pool[position]!
    pool[position] = selectedId

    cards.push({
      cardId: selectedId,
      orientation: state.reversedEnabled && sampleRandomIndex(2, randomUint32) === 0
        ? 'reversed'
        : 'upright',
      revealed: false,
      interpretationRevealed: false,
    })
  }

  return {
    ...state,
    readingId: createId(),
    dealtAt: now.toISOString(),
    question: normalizeSpreadQuestion(state.question),
    cards,
  }
}

export function revealSpreadCard(
  state: ThreeCardSpreadState,
  index: number,
): ThreeCardSpreadState {
  if (!Number.isInteger(index) || index < 0 || index >= state.cards.length) return state
  if (state.cards[index]?.revealed) return state

  const cards = state.cards.map((card, cardIndex) => cardIndex === index
    ? {
        ...card,
        revealed: true,
        interpretationRevealed: state.learningFirst ? false : true,
      }
    : card)
  return { ...state, cards }
}

export function revealAllSpreadCards(state: ThreeCardSpreadState): ThreeCardSpreadState {
  return {
    ...state,
    cards: state.cards.map((card) => ({
      ...card,
      revealed: true,
      interpretationRevealed: state.learningFirst
        ? card.interpretationRevealed
        : true,
    })),
  }
}

export function revealSpreadInterpretation(
  state: ThreeCardSpreadState,
  index: number,
): ThreeCardSpreadState {
  if (!state.cards[index]?.revealed || state.cards[index]?.interpretationRevealed) return state
  return {
    ...state,
    cards: state.cards.map((card, cardIndex) => cardIndex === index
      ? { ...card, interpretationRevealed: true }
      : card),
  }
}

export function clearSpreadCards(state: ThreeCardSpreadState): ThreeCardSpreadState {
  return { ...state, readingId: null, dealtAt: null, cards: [] }
}

export function isSpreadUnfinished(state: ThreeCardSpreadState): boolean {
  return state.cards.some((card) => !card.revealed || !card.interpretationRevealed)
}

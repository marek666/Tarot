import { shuffleDeck, type RandomSource } from './deckModes.ts'
import type { TarotCard, TarotMeaning } from '../types/tarot.ts'
import type {
  CardOrientation,
  StudyProgress,
  StudyRating,
} from '../types/trainer.ts'

export interface StudyProgressSummary {
  total: number
  known: number
  practice: number
  remaining: number
}

export function createEmptyStudyProgress(): StudyProgress {
  return {
    knownCardIds: [],
    practiceCardIds: [],
    orientationProgress: {},
  }
}

export function applyStudyRating(
  progress: StudyProgress,
  cardId: string,
  rating: StudyRating,
): StudyProgress {
  const knownCardIds = progress.knownCardIds.filter((id) => id !== cardId)
  const practiceCardIds = progress.practiceCardIds.filter((id) => id !== cardId)

  if (rating === 'known') knownCardIds.push(cardId)
  else practiceCardIds.push(cardId)

  return {
    knownCardIds,
    practiceCardIds,
    orientationProgress: { ...progress.orientationProgress },
  }
}

export function resetStudyProgress(): StudyProgress {
  return createEmptyStudyProgress()
}

export function getStudyProgressSummary(
  progress: StudyProgress,
  total: number,
): StudyProgressSummary {
  const known = progress.knownCardIds.length
  const practice = progress.practiceCardIds.length

  return {
    total,
    known,
    practice,
    remaining: Math.max(0, total - known - practice),
  }
}

export function createStudyOrder(
  cardIds: readonly string[],
  practiceCardIds: readonly string[],
  shuffleEnabled: boolean,
  lastCardId: string | null = null,
  random: RandomSource = Math.random,
): string[] {
  const availableIds = new Set(cardIds)
  const practiceIds = new Set(practiceCardIds.filter((id) => availableIds.has(id)))
  const priority = cardIds.filter((id) => practiceIds.has(id))
  const remaining = cardIds.filter((id) => !practiceIds.has(id))
  const orderedPriority = shuffleEnabled ? shuffleDeck(priority, random) : priority
  const orderedRemaining = shuffleEnabled ? shuffleDeck(remaining, random) : remaining
  const order = [...orderedPriority, ...orderedRemaining]

  if (order.length > 1 && order[0] === lastCardId) {
    const replacementIndex = order.findIndex((id) => id !== lastCardId)
    if (replacementIndex > 0) {
      const first = order[0]!
      order[0] = order[replacementIndex]!
      order[replacementIndex] = first
    }
  }

  return order
}

export function getMeaningForOrientation(
  card: TarotCard,
  orientation: CardOrientation,
): TarotMeaning {
  return orientation === 'reversed' ? card.reversed : card.upright
}

import type { TarotCard, TarotSuit } from '../types/tarot.ts'
import type { StudyProgress } from '../types/trainer.ts'

export type CardGroupFilter = 'all' | 'major' | 'minor' | TarotSuit
export type CardStudyFilter = 'all' | 'known' | 'practice' | 'remaining'

export interface CardPickerFilters {
  query: string
  group: CardGroupFilter
  study: CardStudyFilter
}

export function normalizeCardSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('cs')
    .trim()
}

function matchesGroup(card: TarotCard, group: CardGroupFilter): boolean {
  if (group === 'all') return true
  if (group === 'major' || group === 'minor') return card.arcana === group
  return card.suit === group
}

function matchesStudy(
  cardId: string,
  study: CardStudyFilter,
  progress: Pick<StudyProgress, 'knownCardIds' | 'practiceCardIds'> | null,
): boolean {
  if (study === 'all' || progress === null) return true

  const known = progress.knownCardIds.includes(cardId)
  const practice = progress.practiceCardIds.includes(cardId)
  if (study === 'known') return known
  if (study === 'practice') return practice
  return !known && !practice
}

export function filterPickerCards(
  cards: readonly TarotCard[],
  filters: CardPickerFilters,
  progress: Pick<StudyProgress, 'knownCardIds' | 'practiceCardIds'> | null = null,
): TarotCard[] {
  const query = normalizeCardSearch(filters.query)

  return cards.filter((card) => {
    const searchableName = normalizeCardSearch(`${card.nameCs} ${card.nameEn}`)
    return (
      (query.length === 0 || searchableName.includes(query)) &&
      matchesGroup(card, filters.group) &&
      matchesStudy(card.id, filters.study, progress)
    )
  })
}

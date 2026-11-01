import type { Arcana, TarotCard, TarotMeaning, TarotSuit } from '../types/tarot.ts'

const SUITS = ['wands', 'cups', 'swords', 'pentacles'] as const satisfies readonly TarotSuit[]
const EXPECTED_GROUPS: ReadonlyArray<readonly [Arcana, TarotSuit | null, number]> = [
  ['major', null, 22],
  ...SUITS.map((suit) => ['minor', suit, 14] as const),
]

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Neplatný tarotový balíček: ${message}`)
  }
}

function assertText(value: unknown, label: string, minimumLength = 1): asserts value is string {
  assert(typeof value === 'string' && value.trim().length >= minimumLength, `${label} je prázdné nebo příliš krátké`)
}

function assertMeaning(value: unknown, label: string): asserts value is TarotMeaning {
  assert(typeof value === 'object' && value !== null, `${label} není objekt`)

  const meaning = value as Record<string, unknown>
  assert(Array.isArray(meaning.keywords), `${label}.keywords není pole`)
  assert(meaning.keywords.length >= 3 && meaning.keywords.length <= 5, `${label}.keywords musí obsahovat 3 až 5 položek`)
  meaning.keywords.forEach((keyword, index) => assertText(keyword, `${label}.keywords[${index}]`))
  assert(new Set(meaning.keywords).size === meaning.keywords.length, `${label}.keywords obsahuje duplicitu`)
  assertText(meaning.summary, `${label}.summary`, 12)
  assertText(meaning.description, `${label}.description`, 40)
}

function assertCard(value: unknown, index: number): asserts value is TarotCard {
  assert(typeof value === 'object' && value !== null, `karta na pozici ${index} není objekt`)

  const card = value as Record<string, unknown>
  const label = `karta na pozici ${index}`
  assertText(card.id, `${label}.id`)
  assert(Number.isInteger(card.number), `${card.id}.number není celé číslo`)
  assertText(card.nameCs, `${card.id}.nameCs`)
  assertText(card.nameEn, `${card.id}.nameEn`)
  assert(card.arcana === 'major' || card.arcana === 'minor', `${card.id}.arcana má neplatnou hodnotu`)
  assert(card.suit === null || SUITS.includes(card.suit as TarotSuit), `${card.id}.suit má neplatnou hodnotu`)
  assertText(card.image, `${card.id}.image`)
  assert((card.image as string).startsWith('/cards/'), `${card.id}.image musí směřovat do /cards/`)
  assertMeaning(card.upright, `${card.id}.upright`)
  assertMeaning(card.reversed, `${card.id}.reversed`)
}

export function validateTarotDeck(value: unknown): readonly TarotCard[] {
  assert(Array.isArray(value), 'exportovaná data nejsou pole')
  assert(value.length === 78, `očekáváno 78 karet, nalezeno ${value.length}`)
  value.forEach(assertCard)

  const cards = value as TarotCard[]
  assert(new Set(cards.map((card) => card.id)).size === 78, 'ID karet nejsou unikátní')
  assert(new Set(cards.map((card) => card.image)).size === 78, 'cesty k obrázkům nejsou unikátní')

  let offset = 0
  for (const [arcana, suit, count] of EXPECTED_GROUPS) {
    const group = cards.slice(offset, offset + count)
    assert(group.every((card) => card.arcana === arcana && card.suit === suit), `skupina ${suit ?? 'major'} není ve správném pořadí`)

    const firstNumber = arcana === 'major' ? 0 : 1
    group.forEach((card, index) => {
      assert(card.number === firstNumber + index, `${card.id} má číslo ${card.number}, očekáváno ${firstNumber + index}`)
    })
    offset += count
  }

  return Object.freeze(cards)
}

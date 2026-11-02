import type { CardOrientation } from '../types/trainer.ts'

export type { CardOrientation } from '../types/trainer.ts'
export type RandomSource = () => number

function sampleRandom(random: RandomSource): number {
  const value = random()
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Generátor náhody musí vracet číslo v rozsahu 0 včetně až 1 vyjma.')
  }
  return value
}

export function shuffleDeck<T>(cards: readonly T[], random: RandomSource = Math.random): T[] {
  const shuffled = [...cards]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(sampleRandom(random) * (index + 1))
    const swappedCard = shuffled[index]!
    shuffled[index] = shuffled[swapIndex]!
    shuffled[swapIndex] = swappedCard
  }

  return shuffled
}

export function createDeckOrder<T>(
  cards: readonly T[],
  shuffleEnabled: boolean,
  random: RandomSource = Math.random,
): T[] {
  return shuffleEnabled ? shuffleDeck(cards, random) : [...cards]
}

export function chooseCardOrientation(
  reversedEnabled: boolean,
): CardOrientation {
  return reversedEnabled ? 'reversed' : 'upright'
}

export function applyReversedSetting(
  orientations: readonly (CardOrientation | null)[],
  currentIndex: number,
  enabled: boolean,
): Array<CardOrientation | null> {
  if (currentIndex < 0 || currentIndex >= orientations.length) {
    throw new RangeError('Index aktuální karty je mimo rozsah orientací.')
  }

  const updated = orientations.map(
    (orientation): CardOrientation | null => orientation === null
      ? null
      : enabled ? 'reversed' : 'upright',
  )

  updated[currentIndex] = enabled ? 'reversed' : 'upright'
  return updated
}

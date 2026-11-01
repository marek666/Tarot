export function getPreviousIndex(currentIndex: number): number {
  return Math.max(0, currentIndex - 1)
}

export function getNextIndex(currentIndex: number, deckSize: number): number {
  return Math.min(deckSize - 1, currentIndex + 1)
}

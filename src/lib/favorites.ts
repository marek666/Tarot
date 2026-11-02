/** Oblíbené jsou samostatná navigační pomůcka, nemění studijní hodnocení. */
export function toggleFavoriteCard(ids: readonly string[], cardId: string): string[] {
  return ids.includes(cardId)
    ? ids.filter((id) => id !== cardId)
    : [...ids, cardId]
}

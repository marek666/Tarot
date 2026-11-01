export type Arcana = 'major' | 'minor'

export type TarotSuit = 'wands' | 'cups' | 'swords' | 'pentacles'

export interface TarotMeaning {
  keywords: readonly [string, string, string, ...string[]]
  summary: string
  description: string
}

export interface TarotCard {
  id: string
  number: number
  nameCs: string
  nameEn: string
  arcana: Arcana
  suit: TarotSuit | null
  image: string
  upright: TarotMeaning
  reversed: TarotMeaning
}

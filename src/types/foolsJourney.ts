export type FoolsJourneySection = 'intro' | 'outer' | 'inner' | 'transformation'

export interface FoolsJourneySymbol {
  name: string
  meaning: string
}

export interface FoolsJourneyChapter {
  cardId: string
  section: FoolsJourneySection
  chapterTitle: string
  story: string
  lesson: string
  symbols: readonly [FoolsJourneySymbol, FoolsJourneySymbol, ...FoolsJourneySymbol[]]
  keywords: readonly [string, string, string, ...string[]]
  previousConnection: string
  nextConnection: string
}

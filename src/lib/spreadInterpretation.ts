import { DAILY_AREA_LABELS } from '../data/dailyInterpretations.ts'
import { SPREAD_LAYOUTS } from '../data/spreadLayouts.ts'
import type { DailyArea } from '../types/dailyCard.ts'
import type { TarotCard, TarotMeaning, TarotSuit } from '../types/tarot.ts'
import type { CardOrientation } from '../types/trainer.ts'
import type {
  CombinedSpreadInterpretation,
  ResolvedSpreadCard,
  SpreadCardInterpretation,
  SpreadLayoutId,
} from '../types/spread.ts'
import { getDailyInterpretation } from './dailyInterpretation.ts'

const suitNames: Record<TarotSuit, string> = {
  wands: 'Holí',
  cups: 'Pohárů',
  swords: 'Mečů',
  pentacles: 'Pentaklů',
}

const suitPatterns: Record<TarotSuit, string> = {
  wands: 'opakovaně zdůrazňují energii, iniciativu a způsob zacházení s motivací',
  cups: 'opakovaně zdůrazňují emoce, vztahovost a způsob přijímání či vyjadřování citů',
  swords: 'opakovaně zdůrazňují myšlení, komunikaci a rozhodnutí, která potřebují přesnost',
  pentacles: 'opakovaně zdůrazňují praktické kroky, zdroje, tělo a dlouhodobou udržitelnost',
}

function meaningFor(card: TarotCard, orientation: CardOrientation): TarotMeaning {
  return orientation === 'reversed' ? card.reversed : card.upright
}

export function getSpreadCardInterpretation(
  card: TarotCard,
  orientation: CardOrientation,
  layoutId: SpreadLayoutId,
  positionIndex: number,
  area: DailyArea,
): SpreadCardInterpretation {
  const layout = SPREAD_LAYOUTS[layoutId]
  const position = layout.positions[positionIndex]
  if (!position) throw new RangeError('Pozice výkladu je mimo rozsah rozložení.')

  const meaning = meaningFor(card, orientation)
  const contextual = getDailyInterpretation(card, orientation, area)
  const contextOnly = contextual.summary.startsWith(meaning.summary)
    ? contextual.summary.slice(meaning.summary.length).trim()
    : contextual.summary

  return {
    position,
    keywords: meaning.keywords,
    classicSummary: meaning.summary,
    classicDescription: meaning.description,
    positionMeaning: `${position.readingLens} ${meaning.summary}`,
    areaConnection: `${DAILY_AREA_LABELS[area]}: ${contextOnly || contextual.summary}`,
    reflectionQuestion: `${position.reflectionPrompt} ve vztahu k motivu „${meaning.keywords[0]}“?`,
  }
}

export function getCombinedSpreadInterpretation(
  cards: readonly ResolvedSpreadCard[],
  layoutId: SpreadLayoutId,
  question: string,
): CombinedSpreadInterpretation {
  if (cards.length !== 3) throw new RangeError('Společný výklad vyžaduje přesně tři karty.')
  const layout = SPREAD_LAYOUTS[layoutId]
  const majorCount = cards.filter(({ card }) => card.arcana === 'major').length
  const reversedCount = cards.filter(({ state }) => state.orientation === 'reversed').length
  const suitCounts = new Map<TarotSuit, number>()

  for (const { card } of cards) {
    if (card.suit) suitCounts.set(card.suit, (suitCounts.get(card.suit) ?? 0) + 1)
  }

  const patterns: string[] = []
  if (majorCount >= 2) {
    patterns.push('Převaha Velkých arkán soustřeďuje pozornost na širší životní postoje a rozhodnutí; neurčuje však jediný možný výsledek.')
  }
  for (const [suit, count] of suitCounts) {
    if (count >= 2) patterns.push(`${count} karty ${suitNames[suit]} ${suitPatterns[suit]}.`)
  }
  if (reversedCount >= 2) {
    patterns.push('Více obrácených karet vybízí zkoumat vnitřní, zadrženou nebo přehodnocovanou podobu témat, ne automaticky jejich negativní opak.')
  } else if (reversedCount === 1) {
    patterns.push('Jediná obrácená karta označuje místo, kde se téma může projevovat méně přímo nebo potřebuje vědomé přehodnocení.')
  }
  if (patterns.length === 0) {
    patterns.push('Karty nevytvářejí jeden dominantní formální vzorec. Je užitečné ponechat více možných spojení a ověřit je podle skutečného kontextu.')
  }

  const cardThemes = cards.map(({ card, state }, index) => {
    const meaning = meaningFor(card, state.orientation)
    return `${layout.positions[index].title}: ${card.nameCs} — ${meaning.summary}`
  })
  const firstKeyword = meaningFor(cards[0]!.card, cards[0]!.state.orientation).keywords[0]
  const secondKeyword = meaningFor(cards[1]!.card, cards[1]!.state.orientation).keywords[0]
  const thirdKeyword = meaningFor(cards[2]!.card, cards[2]!.state.orientation).keywords[0]

  return {
    overview: question
      ? `Rozložení „${layout.title}“ vztahuje tři odlišné pohledy k otázce: „${question}“. Karty nabízejí pracovní hypotézy, nikoli jistou předpověď.`
      : `Rozložení „${layout.title}“ propojuje tři odlišné pohledy na zvolené téma. Karty nabízejí pracovní hypotézy, nikoli jistou předpověď.`,
    cardThemes,
    pattern: patterns.join(' '),
    connectionQuestions: [
      layout.connectionPrompt,
      `Jak spolu souvisejí motivy „${firstKeyword}“, „${secondKeyword}“ a „${thirdKeyword}“ — podporují se, nebo mezi nimi vzniká napětí?`,
    ],
    finalQuestion: layout.finalPrompt,
  }
}

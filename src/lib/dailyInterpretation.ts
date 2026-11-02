import {
  DAILY_AREA_LABELS,
  MAJOR_DAILY_PROFILES,
  RANK_DAILY_FOCUS,
  RANK_REFLECTION_ENDINGS,
  SUIT_DAILY_FOCUS,
  SUIT_REFLECTION,
} from '../data/dailyInterpretations.ts'
import type { DailyArea, DailyInterpretation } from '../types/dailyCard.ts'
import type { TarotCard, TarotMeaning } from '../types/tarot.ts'
import type { CardOrientation } from '../types/trainer.ts'

function meaningFor(card: TarotCard, orientation: CardOrientation): TarotMeaning {
  return orientation === 'reversed' ? card.reversed : card.upright
}

function getContextFocus(card: TarotCard, area: DailyArea): string {
  if (card.arcana === 'major') {
    const profile = MAJOR_DAILY_PROFILES[card.number]
    if (!profile) throw new RangeError(`Chybí denní profil Velké arkány ${card.id}.`)

    if (area === 'general') return `Karta otevírá téma ${profile.focus}.`
    return `V oblasti „${DAILY_AREA_LABELS[area]}“ se její motiv vztahuje k tématu ${profile.focus}.`
  }

  if (!card.suit) throw new RangeError(`Malá arkána ${card.id} nemá barvu.`)
  const rankFocus = RANK_DAILY_FOCUS[card.number]
  if (!rankFocus) throw new RangeError(`Chybí denní profil hodnoty ${card.number}.`)
  return `${SUIT_DAILY_FOCUS[card.suit][area]} ${rankFocus}`
}

function getReflectionQuestion(card: TarotCard, area: DailyArea): string {
  if (card.arcana === 'major') {
    const profile = MAJOR_DAILY_PROFILES[card.number]
    if (!profile) throw new RangeError(`Chybí denní profil Velké arkány ${card.id}.`)

    if (area === 'general') return `Co by dnes znamenalo ${profile.reflection}?`
    if (area === 'relationships') return `Kde ve vztazích potřebujete ${profile.reflection}?`
    if (area === 'work') return `Která pracovní situace po vás žádá ${profile.reflection}?`
    return `Jak můžete ve vlastním rozvoji procvičit schopnost ${profile.reflection}?`
  }

  if (!card.suit) throw new RangeError(`Malá arkána ${card.id} nemá barvu.`)
  const ending = RANK_REFLECTION_ENDINGS[card.number]
  if (!ending) throw new RangeError(`Chybí otázka pro hodnotu ${card.number}.`)
  return `${SUIT_REFLECTION[card.suit][area]} ${ending}?`
}

export function getDailyInterpretation(
  card: TarotCard,
  orientation: CardOrientation,
  area: DailyArea,
): DailyInterpretation {
  const meaning = meaningFor(card, orientation)
  const contextFocus = getContextFocus(card, area)
  const keywordText = meaning.keywords.map((keyword) => `„${keyword}“`).join(', ')

  return {
    keywords: meaning.keywords,
    summary: `${meaning.summary} ${contextFocus}`,
    traditionalConnection: `Tento pohled vychází z tradičních motivů ${keywordText}. ${meaning.description}`,
    reflectionQuestion: getReflectionQuestion(card, area),
  }
}

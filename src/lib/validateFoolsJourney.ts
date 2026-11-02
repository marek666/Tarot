import type { FoolsJourneyChapter, FoolsJourneySection } from '../types/foolsJourney.ts'
import type { TarotCard } from '../types/tarot.ts'

const expectedSections: readonly FoolsJourneySection[] = [
  'intro',
  ...Array<FoolsJourneySection>(7).fill('outer'),
  ...Array<FoolsJourneySection>(7).fill('inner'),
  ...Array<FoolsJourneySection>(7).fill('transformation'),
]

function wordCount(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length
}

export function validateFoolsJourney(
  chapters: readonly FoolsJourneyChapter[],
  majorArcana: readonly TarotCard[],
): readonly FoolsJourneyChapter[] {
  if (chapters.length !== 22) throw new Error(`Cesta Blázna musí mít 22 kapitol, má ${chapters.length}.`)
  if (majorArcana.length !== 22) throw new Error('Validace Cesty Blázna vyžaduje 22 Velkých arkán.')

  const ids = new Set<string>()
  chapters.forEach((chapter, index) => {
    const card = majorArcana[index]
    if (!card || card.number !== index || card.arcana !== 'major' || chapter.cardId !== card.id) {
      throw new Error(`Kapitola ${index + 1} neodkazuje na správnou kartu Velkých arkán.`)
    }
    if (chapter.section !== expectedSections[index]) {
      throw new Error(`Kapitola ${index + 1} je zařazena do nesprávné části příběhu.`)
    }
    if (ids.has(chapter.cardId)) throw new Error(`Duplicitní kapitola pro kartu ${chapter.cardId}.`)
    ids.add(chapter.cardId)

    const words = wordCount(chapter.story)
    if (words < 100 || words > 180) {
      throw new Error(`Kapitola ${index + 1} má ${words} slov; požadováno je 100–180.`)
    }
    if (chapter.symbols.length < 2 || chapter.symbols.length > 4) {
      throw new Error(`Kapitola ${index + 1} musí vysvětlit 2–4 symboly.`)
    }
    if (chapter.keywords.length < 3 || chapter.keywords.length > 5) {
      throw new Error(`Kapitola ${index + 1} musí mít 3–5 klíčových slov.`)
    }
    const textValues = [
      chapter.chapterTitle,
      chapter.story,
      chapter.lesson,
      chapter.previousConnection,
      chapter.nextConnection,
      ...chapter.keywords,
      ...chapter.symbols.flatMap((symbol) => [symbol.name, symbol.meaning]),
    ]
    if (textValues.some((value) => value.trim().length === 0)) {
      throw new Error(`Kapitola ${index + 1} obsahuje prázdný text.`)
    }
  })

  return chapters
}

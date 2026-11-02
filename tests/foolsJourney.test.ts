import { deepEqual, equal } from 'node:assert/strict'
import { test } from 'node:test'
import { foolsJourney } from '../src/data/foolsJourney.ts'
import { majorArcana } from '../src/data/tarotDeck.ts'

test('Cesta Blázna obsahuje přesně 22 kapitol v pořadí Velkých arkán', () => {
  equal(foolsJourney.length, 22)
  deepEqual(
    foolsJourney.map((chapter) => chapter.cardId),
    majorArcana.map((card) => card.id),
  )
})

test('kapitoly mají požadované části, délku příběhu, symboly a klíčová slova', () => {
  foolsJourney.forEach((chapter, index) => {
    const words = chapter.story.trim().split(/\s+/u).length
    equal(words >= 100 && words <= 180, true, `Kapitola ${index + 1} má ${words} slov.`)
    equal(chapter.symbols.length >= 2 && chapter.symbols.length <= 4, true)
    equal(chapter.keywords.length >= 3 && chapter.keywords.length <= 5, true)
  })

  equal(foolsJourney[0]?.section, 'intro')
  deepEqual(foolsJourney.slice(1, 8).map((chapter) => chapter.section), Array(7).fill('outer'))
  deepEqual(foolsJourney.slice(8, 15).map((chapter) => chapter.section), Array(7).fill('inner'))
  deepEqual(foolsJourney.slice(15).map((chapter) => chapter.section), Array(7).fill('transformation'))
})

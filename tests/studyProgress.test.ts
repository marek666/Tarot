import { deepEqual, equal, notEqual } from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyStudyRating,
  createEmptyStudyProgress,
  createStudyOrder,
  getMeaningForOrientation,
  getStudyProgressSummary,
  resetStudyProgress,
} from '../src/lib/studyProgress.ts'
import type { TarotCard } from '../src/types/tarot.ts'

const sampleCard: TarotCard = {
  id: 'sample',
  number: 0,
  nameCs: 'Ukázka',
  nameEn: 'Sample',
  arcana: 'major',
  suit: null,
  image: '/sample.jpg',
  upright: {
    keywords: ['přímá', 'jasná', 'otevřená'],
    summary: 'Přímý význam',
    description: 'Podrobný přímý význam.',
  },
  reversed: {
    keywords: ['obrácená', 'zpomalená', 'vnitřní'],
    summary: 'Obrácený význam',
    description: 'Podrobný obrácený význam.',
  },
}

test('hodnocení karty ukládá výlučně stav Umím nebo Procvičit', () => {
  const practice = applyStudyRating(createEmptyStudyProgress(), 'card-1', 'practice')
  deepEqual(practice.practiceCardIds, ['card-1'])
  deepEqual(practice.knownCardIds, [])

  const known = applyStudyRating(practice, 'card-1', 'known')
  deepEqual(known.knownCardIds, ['card-1'])
  deepEqual(known.practiceCardIds, [])
})

test('souhrn pokroku počítá naučené, procvičované a zbývající karty', () => {
  const summary = getStudyProgressSummary(
    {
      knownCardIds: ['a', 'b'],
      practiceCardIds: ['c'],
      orientationProgress: {},
    },
    78,
  )

  deepEqual(summary, { total: 78, known: 2, practice: 1, remaining: 75 })
})

test('nové studijní kolo upřednostní procvičované karty a zachová všechna ID', () => {
  const ids = ['a', 'b', 'c', 'd']
  const order = createStudyOrder(ids, ['c', 'a'], false)

  deepEqual(order, ['a', 'c', 'b', 'd'])
  deepEqual([...order].sort(), [...ids].sort())
})

test('nové kolo bezdůvodně neopakuje právě dokončenou kartu', () => {
  const order = createStudyOrder(['a', 'b', 'c'], ['a'], false, 'a')

  notEqual(order[0], 'a')
  equal(new Set(order).size, 3)
})

test('reversed poloha vybere obrácený text a přímá poloha přímý text', () => {
  equal(getMeaningForOrientation(sampleCard, 'upright').summary, 'Přímý význam')
  equal(getMeaningForOrientation(sampleCard, 'reversed').summary, 'Obrácený význam')
})

test('reset odstraní pouze studijní hodnocení', () => {
  deepEqual(resetStudyProgress(), {
    knownCardIds: [],
    practiceCardIds: [],
    orientationProgress: {},
  })
})

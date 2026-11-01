import { deepEqual, equal, notDeepEqual, throws } from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyReversedSetting,
  chooseCardOrientation,
  createDeckOrder,
  shuffleDeck,
  type RandomSource,
} from '../src/lib/deckModes.ts'

function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 4_294_967_296
  }
}

test('Fisher–Yates vytvoří novou permutaci a nezmění zdrojové pole', () => {
  const source = [1, 2, 3, 4]
  const shuffled = shuffleDeck(source, () => 0)

  deepEqual(source, [1, 2, 3, 4])
  deepEqual(shuffled, [2, 3, 4, 1])
  notDeepEqual(shuffled, source)
})

test('zamíchaný balíček obsahuje všech 78 karet právě jednou', () => {
  const source = Array.from({ length: 78 }, (_, index) => `card-${index}`)
  const shuffled = shuffleDeck(source, seededRandom(42))

  equal(shuffled.length, 78)
  equal(new Set(shuffled).size, 78)
  deepEqual([...shuffled].sort(), [...source].sort())
})

test('vypnutý Shuffle zachová tradiční pořadí v nové kopii', () => {
  const source = ['a', 'b', 'c'] as const
  const order = createDeckOrder(source, false, () => {
    throw new Error('Generátor se v tradičním režimu nemá volat')
  })

  deepEqual(order, source)
  equal(order === source, false)
})

test('vypnutý Reversed vždy vrátí přímou polohu bez losování', () => {
  equal(
    chooseCardOrientation(false, () => {
      throw new Error('Generátor se při vypnutém Reversed nemá volat')
    }),
    'upright',
  )
})

test('Reversed používá přesnou hranici 50 %', () => {
  equal(chooseCardOrientation(true, () => 0), 'reversed')
  equal(chooseCardOrientation(true, () => 0.499_999), 'reversed')
  equal(chooseCardOrientation(true, () => 0.5), 'upright')
  equal(chooseCardOrientation(true, () => 0.999_999), 'upright')
})

test('neplatný výstup generátoru je odmítnut', () => {
  throws(() => shuffleDeck([1, 2], () => 1), RangeError)
  throws(() => chooseCardOrientation(true, () => -0.1), RangeError)
})

test('zapnutí Reversed obrátí aktuální kartu bez změny ostatních orientací', () => {
  const source = ['upright', 'upright', null] as const

  deepEqual(applyReversedSetting(source, 1, true), ['upright', 'reversed', null])
  deepEqual(source, ['upright', 'upright', null])
})

test('vypnutí Reversed narovná již rozdané karty a zachová nerozdané', () => {
  deepEqual(
    applyReversedSetting(['reversed', 'upright', 'reversed', null], 2, false),
    ['upright', 'upright', 'upright', null],
  )
})

test('změna Reversed odmítne neplatný index', () => {
  throws(() => applyReversedSetting(['upright'], 1, true), RangeError)
})

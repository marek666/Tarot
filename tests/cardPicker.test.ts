import assert from 'node:assert/strict'
import test from 'node:test'
import { tarotDeck } from '../src/data/tarotDeck.ts'
import { filterPickerCards, normalizeCardSearch } from '../src/lib/cardPicker.ts'

test('vyhledávání ignoruje diakritiku a hledá v českém i anglickém názvu', () => {
  assert.equal(normalizeCardSearch('  Velekněžka '), 'veleknezka')

  const czech = filterPickerCards(tarotDeck, { query: 'veleknezka', group: 'all', study: 'all' })
  const english = filterPickerCards(tarotDeck, { query: 'high priestess', group: 'all', study: 'all' })
  assert.deepEqual(czech.map((card) => card.id), ['major-02-high-priestess'])
  assert.deepEqual(english.map((card) => card.id), ['major-02-high-priestess'])
})

test('filtry arkán a barev zachovávají tradiční pořadí', () => {
  const major = filterPickerCards(tarotDeck, { query: '', group: 'major', study: 'all' })
  const cups = filterPickerCards(tarotDeck, { query: '', group: 'cups', study: 'all' })
  assert.equal(major.length, 22)
  assert.equal(cups.length, 14)
  assert.equal(cups[0]?.id, 'cups-01')
  assert.equal(cups[13]?.id, 'cups-14')
})

test('studijní filtry rozlišují Umím, Procvičit a Zbývající', () => {
  const progress = {
    knownCardIds: [tarotDeck[0]!.id],
    practiceCardIds: [tarotDeck[1]!.id],
  }

  const known = filterPickerCards(tarotDeck, { query: '', group: 'all', study: 'known' }, progress)
  const practice = filterPickerCards(tarotDeck, { query: '', group: 'all', study: 'practice' }, progress)
  const remaining = filterPickerCards(tarotDeck, { query: '', group: 'all', study: 'remaining' }, progress)
  assert.deepEqual(known.map((card) => card.id), [tarotDeck[0]!.id])
  assert.deepEqual(practice.map((card) => card.id), [tarotDeck[1]!.id])
  assert.equal(remaining.length, 76)
})

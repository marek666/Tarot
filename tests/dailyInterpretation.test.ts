import assert from 'node:assert/strict'
import test from 'node:test'
import { tarotDeck } from '../src/data/tarotDeck.ts'
import { getDailyInterpretation } from '../src/lib/dailyInterpretation.ts'
import { DAILY_AREAS } from '../src/types/dailyCard.ts'

test('všech 78 karet má úplný výklad pro čtyři oblasti a obě orientace', () => {
  const summaries = new Set<string>()
  let count = 0

  for (const card of tarotDeck) {
    for (const orientation of ['upright', 'reversed'] as const) {
      for (const area of DAILY_AREAS) {
        const interpretation = getDailyInterpretation(card, orientation, area)
        assert.ok(interpretation.keywords.length >= 3 && interpretation.keywords.length <= 5)
        assert.ok(interpretation.summary.length > 80)
        assert.ok(interpretation.traditionalConnection.length > 100)
        assert.match(interpretation.reflectionQuestion, /\?$/)
        summaries.add(interpretation.summary)
        count += 1
      }
    }
  }

  assert.equal(count, 78 * 4 * 2)
  assert.equal(summaries.size, count, 'každá kombinace má mít vlastní konkrétní shrnutí')
})

test('obrácený výklad používá obrácený význam, nikoli mechanický opak', () => {
  const card = tarotDeck.find((candidate) => candidate.id === 'major-14-temperance')!
  const upright = getDailyInterpretation(card, 'upright', 'relationships')
  const reversed = getDailyInterpretation(card, 'reversed', 'relationships')

  assert.ok(upright.summary.startsWith(card.upright.summary))
  assert.ok(reversed.summary.startsWith(card.reversed.summary))
  assert.notEqual(reversed.summary, upright.summary)
  assert.ok(reversed.traditionalConnection.includes(card.reversed.description))
})

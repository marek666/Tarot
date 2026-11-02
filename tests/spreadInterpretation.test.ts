import assert from 'node:assert/strict'
import test from 'node:test'
import { SPREAD_LAYOUTS } from '../src/data/spreadLayouts.ts'
import { tarotDeck } from '../src/data/tarotDeck.ts'
import {
  getCombinedSpreadInterpretation,
  getSpreadCardInterpretation,
} from '../src/lib/spreadInterpretation.ts'
import { DAILY_AREAS } from '../src/types/dailyCard.ts'
import { SPREAD_LAYOUT_IDS, type ResolvedSpreadCard } from '../src/types/spread.ts'

test('každá pozice všech rozložení má konkrétní český výklad', () => {
  const card = tarotDeck.find((candidate) => candidate.id === 'major-14-temperance')!
  let count = 0

  for (const layoutId of SPREAD_LAYOUT_IDS) {
    for (let position = 0; position < 3; position += 1) {
      for (const area of DAILY_AREAS) {
        for (const orientation of ['upright', 'reversed'] as const) {
          const interpretation = getSpreadCardInterpretation(
            card,
            orientation,
            layoutId,
            position,
            area,
          )
          assert.equal(interpretation.position, SPREAD_LAYOUTS[layoutId].positions[position])
          assert.ok(interpretation.positionMeaning.includes(
            orientation === 'upright' ? card.upright.summary : card.reversed.summary,
          ))
          assert.match(interpretation.reflectionQuestion, /\?$/)
          assert.doesNotMatch(interpretation.areaConnection, /pro dnešek/i)
          count += 1
        }
      }
    }
  }

  assert.equal(count, 3 * 3 * 4 * 2)
})

test('změna tematické oblasti změní kontext, ne klasický význam', () => {
  const card = tarotDeck.find((candidate) => candidate.id === 'cups-02')!
  const general = getSpreadCardInterpretation(card, 'upright', 'situation', 0, 'general')
  const work = getSpreadCardInterpretation(card, 'upright', 'situation', 0, 'work')

  assert.equal(general.classicSummary, work.classicSummary)
  assert.notEqual(general.areaConnection, work.areaConnection)
  assert.ok(work.areaConnection.startsWith('Práce:'))
})

test('společná interpretace transparentně popíše Velké arkány, barvu a obrácení', () => {
  const cardById = new Map(tarotDeck.map((card) => [card.id, card]))
  const cards: ResolvedSpreadCard[] = [
    {
      card: cardById.get('major-13-death')!,
      state: { cardId: 'major-13-death', orientation: 'reversed', revealed: true, interpretationRevealed: true },
    },
    {
      card: cardById.get('major-14-temperance')!,
      state: { cardId: 'major-14-temperance', orientation: 'reversed', revealed: true, interpretationRevealed: true },
    },
    {
      card: cardById.get('cups-02')!,
      state: { cardId: 'cups-02', orientation: 'upright', revealed: true, interpretationRevealed: true },
    },
  ]

  const interpretation = getCombinedSpreadInterpretation(
    cards,
    'timeline',
    'Jak pracovat se změnou?',
  )

  assert.match(interpretation.overview, /Jak pracovat se změnou/)
  assert.match(interpretation.pattern, /Převaha Velkých arkán/)
  assert.match(interpretation.pattern, /Více obrácených karet/)
  assert.equal(interpretation.cardThemes.length, 3)
  assert.equal(interpretation.connectionQuestions.length, 2)
  assert.match(interpretation.finalQuestion, /\?$/)
})

test('bez dominantního vzorce společný výklad přizná otevřenost', () => {
  const cardById = new Map(tarotDeck.map((card) => [card.id, card]))
  const ids = ['wands-01', 'cups-02', 'swords-03']
  const cards: ResolvedSpreadCard[] = ids.map((cardId) => ({
    card: cardById.get(cardId)!,
    state: { cardId, orientation: 'upright', revealed: true, interpretationRevealed: true },
  }))

  const interpretation = getCombinedSpreadInterpretation(cards, 'situation', '')
  assert.match(interpretation.pattern, /nevytvářejí jeden dominantní/)
  assert.match(interpretation.overview, /nikoli jistou předpověď/)
})

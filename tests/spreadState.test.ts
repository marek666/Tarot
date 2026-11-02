import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SPREAD_STATE_KEY,
  clearSpreadCards,
  createDefaultSpreadState,
  dealThreeCardSpread,
  loadSpreadState,
  revealAllSpreadCards,
  revealSpreadCard,
  revealSpreadInterpretation,
  saveSpreadState,
  updateSpreadSettings,
} from '../src/lib/spreadState.ts'
import type { StorageLike } from '../src/lib/trainerState.ts'

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>()
  removed: string[] = []

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.removed.push(key)
    this.values.delete(key)
  }
}

const cardIds = Array.from({ length: 78 }, (_, index) => `card-${index}`)

test('los vybere přesně tři různé karty bez změny zdrojového balíčku', () => {
  const original = [...cardIds]
  const values = [3, 10, 20]
  const reading = dealThreeCardSpread(
    createDefaultSpreadState(false),
    cardIds,
    () => values.shift()!,
  )

  assert.equal(reading.cards.length, 3)
  assert.equal(new Set(reading.cards.map((card) => card.cardId)).size, 3)
  assert.ok(reading.cards.every((card) => card.orientation === 'upright'))
  assert.deepEqual(cardIds, original)
})

test('každá karta může být se stejným pravidlem vybrána na první pozici', () => {
  const firstCards = cardIds.map((_, candidateIndex) => {
    const reading = dealThreeCardSpread(
      createDefaultSpreadState(false),
      cardIds,
      () => candidateIndex,
    )
    return reading.cards[0]!.cardId
  })

  assert.deepEqual(firstCards, cardIds)
  assert.equal(new Set(firstCards).size, 78)
})

test('každá orientace se losuje samostatně a vypnutý Reversed je vždy přímý', () => {
  const values = [0, 0, 0, 1, 0, 0]
  const reversedReading = dealThreeCardSpread(
    { ...createDefaultSpreadState(), reversedEnabled: true },
    cardIds,
    () => values.shift()!,
  )
  assert.deepEqual(
    reversedReading.cards.map((card) => card.orientation),
    ['reversed', 'upright', 'reversed'],
  )

  const uprightReading = dealThreeCardSpread(
    createDefaultSpreadState(false),
    cardIds,
    () => 0,
  )
  assert.ok(uprightReading.cards.every((card) => card.orientation === 'upright'))
})

test('rozpracovaný výklad se obnoví včetně pořadí, orientací a odhalení', () => {
  const storage = new MemoryStorage()
  let state = updateSpreadSettings(createDefaultSpreadState(), {
    layoutId: 'relationship',
    area: 'relationships',
    question: 'Co potřebujeme lépe komunikovat?',
    reversedEnabled: true,
    learningFirst: true,
  })
  state = dealThreeCardSpread(state, cardIds, () => 1)
  state = revealSpreadCard(state, 0)
  state = revealSpreadInterpretation(state, 0)
  state = revealSpreadCard(state, 1)

  assert.equal(saveSpreadState(storage, state), true)
  assert.deepEqual(loadSpreadState(storage, cardIds), state)
})

test('rozepsaná otázka zachová mezery při psaní a při losu se bezpečně normalizuje', () => {
  const storage = new MemoryStorage()
  const draft = updateSpreadSettings(createDefaultSpreadState(), {
    question: 'Co potřebuji  lépe ',
  })
  assert.equal(draft.question, 'Co potřebuji  lépe ')

  saveSpreadState(storage, draft)
  assert.equal(loadSpreadState(storage, cardIds).question, 'Co potřebuji lépe')
  assert.equal(dealThreeCardSpread(draft, cardIds, () => 0).question, 'Co potřebuji lépe')
})

test('neplatná uložená data se odstraní a nahradí výchozím stavem', () => {
  const storage = new MemoryStorage()
  storage.setItem(SPREAD_STATE_KEY, JSON.stringify({
    ...createDefaultSpreadState(),
    cards: [
      { cardId: cardIds[0], orientation: 'upright', revealed: false, interpretationRevealed: false },
      { cardId: cardIds[0], orientation: 'sideways', revealed: true, interpretationRevealed: true },
      { cardId: 'unknown', orientation: 'upright', revealed: true, interpretationRevealed: true },
    ],
  }))

  assert.deepEqual(loadSpreadState(storage, cardIds, true), createDefaultSpreadState(true))
  assert.deepEqual(storage.removed, [SPREAD_STATE_KEY])
})

test('blokovaný localStorage nebrání vytvoření výkladu', () => {
  const unavailable: StorageLike = {
    getItem: () => { throw new Error('blocked') },
    setItem: () => { throw new Error('blocked') },
    removeItem: () => { throw new Error('blocked') },
  }

  const restored = loadSpreadState(unavailable, cardIds, true)
  const reading = dealThreeCardSpread(restored, cardIds, () => 0)
  assert.equal(reading.cards.length, 3)
  assert.equal(saveSpreadState(unavailable, reading), false)
})

test('odhalování respektuje výukový režim a rychlé opakování je idempotentní', () => {
  let state = dealThreeCardSpread(
    { ...createDefaultSpreadState(), learningFirst: true },
    cardIds,
    () => 0,
  )
  state = revealSpreadCard(state, 0)
  const repeated = revealSpreadCard(state, 0)
  assert.strictEqual(repeated, state)
  assert.equal(state.cards[0]!.revealed, true)
  assert.equal(state.cards[0]!.interpretationRevealed, false)

  state = revealSpreadInterpretation(state, 0)
  assert.equal(state.cards[0]!.interpretationRevealed, true)
  state = revealAllSpreadCards(state)
  assert.ok(state.cards.every((card) => card.revealed))
  assert.equal(state.cards[1]!.interpretationRevealed, false)
  assert.equal(clearSpreadCards(state).cards.length, 0)
})

test('uložení výkladu nemění existující trainerState ani Kartu dne', () => {
  const storage = new MemoryStorage()
  storage.setItem('tarot-trainer:state', '{"version":3,"marker":"trainer"}')
  storage.setItem('tarot-trainer:daily-card', '{"version":1,"marker":"daily"}')
  const trainerBefore = storage.getItem('tarot-trainer:state')
  const dailyBefore = storage.getItem('tarot-trainer:daily-card')

  const reading = dealThreeCardSpread(createDefaultSpreadState(), cardIds, () => 0)
  saveSpreadState(storage, reading)

  assert.equal(storage.getItem('tarot-trainer:state'), trainerBefore)
  assert.equal(storage.getItem('tarot-trainer:daily-card'), dailyBefore)
})

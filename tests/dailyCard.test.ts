import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DAILY_CARD_STATE_KEY,
  changeDailyArea,
  createDailyCardState,
  getLocalDateKey,
  loadOrCreateDailyCardState,
  parseDailyCardState,
} from '../src/lib/dailyCard.ts'
import type { StorageLike } from '../src/lib/trainerState.ts'

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const cardIds = ['major-00-fool', 'major-01-magician', 'cups-01']
const dayOne = new Date(2026, 10, 2, 23, 58)
const dayTwo = new Date(2026, 10, 3, 0, 2)

test('první denní los vybere jednu kartu, orientaci a místní datum', () => {
  const randomValues = [1, 0]
  const state = createDailyCardState(
    cardIds,
    '2026-11-02',
    true,
    'general',
    () => randomValues.shift()!,
  )

  assert.equal(state.cardId, 'major-01-magician')
  assert.equal(state.orientation, 'reversed')
  assert.equal(state.localDate, '2026-11-02')
  assert.equal(state.area, 'general')
})

test('bez Reversed je denní karta vždy přímá', () => {
  const state = createDailyCardState(cardIds, '2026-11-02', false, 'general', () => 2)
  assert.equal(state.orientation, 'upright')
})

test('během stejného dne se uložená karta ani orientace nemění', () => {
  const storage = new MemoryStorage()
  const first = loadOrCreateDailyCardState(storage, cardIds, true, dayOne, () => 0)
  const restored = loadOrCreateDailyCardState(storage, cardIds, false, dayOne, () => 2)

  assert.deepEqual(restored, first)
  assert.equal(restored.orientation, 'reversed')
})

test('nový místní kalendářní den vytvoří nový los a zachová zvolenou oblast', () => {
  const storage = new MemoryStorage()
  const first = loadOrCreateDailyCardState(storage, cardIds, false, dayOne, () => 0)
  const withArea = changeDailyArea(storage, first, 'work')
  const next = loadOrCreateDailyCardState(storage, cardIds, false, dayTwo, () => 2)

  assert.equal(getLocalDateKey(dayOne), '2026-11-02')
  assert.equal(next.localDate, '2026-11-03')
  assert.equal(next.cardId, 'cups-01')
  assert.equal(next.area, withArea.area)
})

test('změna oblasti zachová kartu, datum i orientaci', () => {
  const storage = new MemoryStorage()
  const state = loadOrCreateDailyCardState(storage, cardIds, true, dayOne, () => 0)
  const updated = changeDailyArea(storage, state, 'relationships')

  assert.deepEqual(updated, { ...state, area: 'relationships' })
  assert.deepEqual(
    parseDailyCardState(storage.getItem(DAILY_CARD_STATE_KEY)!, cardIds),
    updated,
  )
})

test('nedostupný localStorage neukončí losování ani změnu oblasti', () => {
  const unavailable: StorageLike = {
    getItem: () => { throw new Error('blocked') },
    setItem: () => { throw new Error('blocked') },
    removeItem: () => { throw new Error('blocked') },
  }

  const state = loadOrCreateDailyCardState(unavailable, cardIds, false, dayOne, () => 1)
  assert.equal(state.cardId, 'major-01-magician')
  assert.equal(changeDailyArea(unavailable, state, 'growth').area, 'growth')
})

test('poškozená nebo cizí uložená data se bezpečně nahradí', () => {
  const storage = new MemoryStorage()
  storage.setItem(DAILY_CARD_STATE_KEY, JSON.stringify({
    version: 1,
    localDate: '2026-02-31',
    cardId: 'unknown',
    orientation: 'sideways',
    area: 'money',
  }))

  const state = loadOrCreateDailyCardState(storage, cardIds, false, dayOne, () => 0)
  assert.equal(state.localDate, '2026-11-02')
  assert.equal(state.cardId, cardIds[0])
})

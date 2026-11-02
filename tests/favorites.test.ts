import assert from 'node:assert/strict'
import test from 'node:test'
import { toggleFavoriteCard } from '../src/lib/favorites.ts'
import { loadTrainerState, saveTrainerState, TRAINER_STATE_KEY, createDefaultTrainerState } from '../src/lib/trainerState.ts'

const ids = ['major-00-fool', 'major-01-magician', 'cups-01']

test('oblíbené se zapínají a vypínají podle stabilního ID bez duplicit', () => {
  const one = toggleFavoriteCard([], ids[0]!)
  assert.deepEqual(one, [ids[0]])
  const two = toggleFavoriteCard(one, ids[1]!)
  assert.deepEqual(two, [ids[0], ids[1]])
  assert.deepEqual(toggleFavoriteCard(two, ids[0]!), [ids[1]])
})

test('stav v2 se zmigruje na v3, zachová výběr a sjednotí orientaci s Reversed', () => {
  const saved = createDefaultTrainerState(ids)
  const v2 = {
    ...saved,
    version: 2,
    currentIndex: 1,
    orientations: ['upright', 'reversed', null],
    journeyChapterIndex: 5,
    journeyHighestChapterIndex: 6,
  }
  const store = new Map<string, string>([[TRAINER_STATE_KEY, JSON.stringify(v2)]])
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
  }
  const restored = loadTrainerState(storage, ids)
  assert.equal(restored.version, 3)
  assert.equal(restored.currentIndex, 1)
  assert.equal(restored.orientations[1], 'upright')
  assert.equal(restored.journeyChapterIndex, 5)
  assert.deepEqual(restored.favoriteCardIds, [])
  restored.favoriteCardIds = [ids[1]!]
  assert.equal(saveTrainerState(storage, restored), true)
  assert.deepEqual(loadTrainerState(storage, ids).favoriteCardIds, [ids[1]])
})

test('neplatná oblíbená ID nebo duplicity nemažou ostatní uloženou relaci', () => {
  const saved = createDefaultTrainerState(ids)
  const store = new Map<string, string>([[TRAINER_STATE_KEY, JSON.stringify({...saved, favoriteCardIds: [ids[0], ids[0]]})]])
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
  }
  assert.deepEqual(loadTrainerState(storage, ids).favoriteCardIds, [])
  assert.equal(store.has(TRAINER_STATE_KEY), true)
})

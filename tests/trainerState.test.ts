import { deepEqual, equal } from 'node:assert/strict'
import { test } from 'node:test'
import {
  TRAINER_STATE_KEY,
  changeTrainerMode,
  createDefaultTrainerState,
  loadTrainerState,
  saveTrainerState,
  type StorageLike,
} from '../src/lib/trainerState.ts'
import type { TrainerState } from '../src/types/trainer.ts'

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>()
  removedKeys: string[] = []

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.removedKeys.push(key)
    this.values.delete(key)
  }
}

const cardIds = ['a', 'b', 'c', 'd']

function createSavedSession(): TrainerState {
  return {
    version: 1,
    mode: 'study',
    shuffleEnabled: true,
    reversedEnabled: true,
    deckOrderIds: ['c', 'a', 'd', 'b'],
    currentIndex: 2,
    orientations: ['reversed', 'upright', 'reversed', null],
    studyRevealed: true,
    studyProgress: {
      knownCardIds: ['a'],
      practiceCardIds: ['c'],
      orientationProgress: {
        a: { upright: 'known' },
        c: { reversed: 'practice' },
      },
    },
  }
}

test('rozpracovaná relace se obnoví včetně pořadí, orientací a odhaleného významu', () => {
  const storage = new MemoryStorage()
  const session = createSavedSession()

  equal(saveTrainerState(storage, session), true)
  deepEqual(loadTrainerState(storage, cardIds), session)
})

test('uložený pokrok zůstane zachovaný při přepnutí režimu', () => {
  const session = createSavedSession()
  const browsing = changeTrainerMode(session, 'browse')
  const studyingAgain = changeTrainerMode(browsing, 'study')

  deepEqual(studyingAgain.studyProgress, session.studyProgress)
  deepEqual(studyingAgain.deckOrderIds, session.deckOrderIds)
  equal(studyingAgain.currentIndex, session.currentIndex)
})

test('poškozený JSON se odstraní a nahradí bezpečným výchozím stavem', () => {
  const storage = new MemoryStorage()
  storage.setItem(TRAINER_STATE_KEY, '{neplatný json')

  const restored = loadTrainerState(storage, cardIds)

  deepEqual(restored, createDefaultTrainerState(cardIds))
  deepEqual(storage.removedKeys, [TRAINER_STATE_KEY])
})

test('strukturálně neplatná relace se nepoužije', () => {
  const storage = new MemoryStorage()
  const invalid = {
    ...createSavedSession(),
    deckOrderIds: ['a', 'a', 'c', 'd'],
  }
  storage.setItem(TRAINER_STATE_KEY, JSON.stringify(invalid))

  deepEqual(loadTrainerState(storage, cardIds), createDefaultTrainerState(cardIds))
})

test('staré nastavení Shuffle a Reversed se převede při první obnově', () => {
  const storage = new MemoryStorage()
  storage.setItem(
    'tarot-trainer:settings',
    JSON.stringify({ shuffle: true, reversed: true }),
  )

  const restored = loadTrainerState(storage, cardIds)

  equal(restored.shuffleEnabled, true)
  equal(restored.reversedEnabled, true)
  equal(restored.mode, 'browse')
})

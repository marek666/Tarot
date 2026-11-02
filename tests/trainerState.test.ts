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
import type { TrainerState, TrainerStateV1 } from '../src/types/trainer.ts'

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
    version: 3,
    mode: 'study',
    previousMode: 'study',
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
    studyProgressExpanded: true,
    journeyChapterIndex: 8,
    journeyHighestChapterIndex: 12,
    favoriteCardIds: ['b'],
  }
}

function createLegacySession(): TrainerStateV1 {
  const current = createSavedSession()
  return {
    version: 1,
    mode: current.mode === 'journey' ? 'browse' : current.mode,
    shuffleEnabled: current.shuffleEnabled,
    reversedEnabled: current.reversedEnabled,
    deckOrderIds: current.deckOrderIds,
    currentIndex: current.currentIndex,
    orientations: current.orientations,
    studyRevealed: current.studyRevealed,
    studyProgress: current.studyProgress,
  }
}

test('rozpracovaná relace se obnoví včetně pořadí, orientací a odhaleného významu', () => {
  const storage = new MemoryStorage()
  const session = createSavedSession()

  equal(saveTrainerState(storage, session), true)
  deepEqual(loadTrainerState(storage, cardIds), session)
})

test('přímý skok na kartu obnoví relaci i s nepřidělenými přeskočenými orientacemi', () => {
  const storage = new MemoryStorage()
  const session: TrainerState = {
    ...createSavedSession(),
    currentIndex: 3,
    orientations: ['reversed', null, null, 'upright'],
    studyRevealed: false,
  }

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

test('stav verze 0.2.x se migruje bez ztráty studijních dat', () => {
  const storage = new MemoryStorage()
  const legacy = createLegacySession()
  storage.setItem(TRAINER_STATE_KEY, JSON.stringify(legacy))

  const migrated = loadTrainerState(storage, cardIds)

  equal(migrated.version, 3)
  deepEqual(migrated.studyProgress, legacy.studyProgress)
  deepEqual(migrated.deckOrderIds, legacy.deckOrderIds)
  equal(migrated.currentIndex, legacy.currentIndex)
  equal(migrated.studyProgressExpanded, false)
  deepEqual(migrated.favoriteCardIds, [])
  equal(migrated.journeyChapterIndex, 0)
})

test('samostatný postup Cestou Blázna a stav panelu se obnoví', () => {
  const storage = new MemoryStorage()
  const session = { ...createSavedSession(), mode: 'journey' as const }

  saveTrainerState(storage, session)
  const restored = loadTrainerState(storage, cardIds)

  equal(restored.mode, 'journey')
  equal(restored.previousMode, 'study')
  equal(restored.journeyChapterIndex, 8)
  equal(restored.journeyHighestChapterIndex, 12)
  equal(restored.studyProgressExpanded, true)
  deepEqual(restored.favoriteCardIds, ['b'])
  deepEqual(restored.studyProgress, session.studyProgress)
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

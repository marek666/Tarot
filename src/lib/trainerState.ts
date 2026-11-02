import { createEmptyStudyProgress } from './studyProgress.ts'
import type {
  CardOrientation,
  ClassicTrainerMode,
  StudyProgress,
  StudyRating,
  TrainerMode,
  TrainerState,
} from '../types/trainer.ts'

export const TRAINER_STATE_VERSION = 3
export const TRAINER_STATE_KEY = 'tarot-trainer:state'
export const LEGACY_SETTINGS_KEY = 'tarot-trainer:settings'
const JOURNEY_CHAPTER_COUNT = 22

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface InitialSettings {
  shuffleEnabled?: boolean
  reversedEnabled?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function containsSameUniqueIds(candidate: string[], validIds: readonly string[]): boolean {
  if (candidate.length !== validIds.length || new Set(candidate).size !== validIds.length) {
    return false
  }

  const valid = new Set(validIds)
  return candidate.every((id) => valid.has(id))
}

function hasOnlyValidUniqueIds(candidate: string[], validIds: Set<string>): boolean {
  return new Set(candidate).size === candidate.length && candidate.every((id) => validIds.has(id))
}

function parseOrientationProgress(
  value: unknown,
  validIds: Set<string>,
): StudyProgress['orientationProgress'] | null {
  if (!isRecord(value)) return null

  const parsed: StudyProgress['orientationProgress'] = {}
  const validRatings = new Set<StudyRating>(['known', 'practice'])

  for (const [cardId, orientations] of Object.entries(value)) {
    if (!validIds.has(cardId) || !isRecord(orientations)) return null

    const upright = orientations.upright
    const reversed = orientations.reversed
    if (upright !== undefined && !validRatings.has(upright as StudyRating)) return null
    if (reversed !== undefined && !validRatings.has(reversed as StudyRating)) return null

    parsed[cardId] = {
      ...(upright === undefined ? {} : { upright: upright as StudyRating }),
      ...(reversed === undefined ? {} : { reversed: reversed as StudyRating }),
    }
  }

  return parsed
}

function parseStudyProgress(value: unknown, validIds: Set<string>): StudyProgress | null {
  if (!isRecord(value)) return null

  const { knownCardIds, practiceCardIds } = value
  if (!isStringArray(knownCardIds) || !isStringArray(practiceCardIds)) return null
  if (
    !hasOnlyValidUniqueIds(knownCardIds, validIds) ||
    !hasOnlyValidUniqueIds(practiceCardIds, validIds)
  ) {
    return null
  }

  const known = new Set(knownCardIds)
  if (practiceCardIds.some((id) => known.has(id))) return null

  const orientationProgress = parseOrientationProgress(value.orientationProgress, validIds)
  if (!orientationProgress) return null

  return { knownCardIds, practiceCardIds, orientationProgress }
}

interface ParsedSessionFields {
  shuffleEnabled: boolean
  reversedEnabled: boolean
  deckOrderIds: string[]
  currentIndex: number
  orientations: Array<CardOrientation | null>
  studyRevealed: boolean
  studyProgress: StudyProgress
}

function parseSessionFields(
  value: Record<string, unknown>,
  validCardIds: readonly string[],
  mode: TrainerMode,
): ParsedSessionFields | null {
  if (typeof value.shuffleEnabled !== 'boolean' || typeof value.reversedEnabled !== 'boolean') {
    return null
  }
  if (!isStringArray(value.deckOrderIds)) return null
  if (!containsSameUniqueIds(value.deckOrderIds, validCardIds)) return null
  if (
    typeof value.currentIndex !== 'number' ||
    !Number.isInteger(value.currentIndex) ||
    value.currentIndex < 0 ||
    value.currentIndex >= value.deckOrderIds.length
  ) {
    return null
  }
  if (
    !Array.isArray(value.orientations) ||
    value.orientations.length !== value.deckOrderIds.length ||
    !value.orientations.every(
      (orientation) =>
        orientation === null || orientation === 'upright' || orientation === 'reversed',
    )
  ) {
    return null
  }
  if (value.orientations[value.currentIndex] === null) {
    return null
  }
  if (typeof value.studyRevealed !== 'boolean') return null
  if (mode === 'browse' && value.studyRevealed) return null

  const studyProgress = parseStudyProgress(value.studyProgress, new Set(validCardIds))
  if (!studyProgress) return null

  return {
    shuffleEnabled: value.shuffleEnabled,
    reversedEnabled: value.reversedEnabled,
    deckOrderIds: [...value.deckOrderIds],
    currentIndex: value.currentIndex,
    orientations: [...value.orientations] as Array<CardOrientation | null>,
    studyRevealed: value.studyRevealed,
    studyProgress,
  }
}

export function createDefaultTrainerState(
  cardIds: readonly string[],
  settings: InitialSettings = {},
): TrainerState {
  const orientations: Array<CardOrientation | null> = Array(cardIds.length).fill(null)
  if (orientations.length > 0) orientations[0] = 'upright'

  return {
    version: TRAINER_STATE_VERSION,
    mode: 'browse',
    previousMode: 'browse',
    shuffleEnabled: settings.shuffleEnabled === true,
    reversedEnabled: settings.reversedEnabled === true,
    deckOrderIds: [...cardIds],
    currentIndex: 0,
    orientations,
    studyRevealed: false,
    studyProgress: createEmptyStudyProgress(),
    studyProgressExpanded: false,
    journeyChapterIndex: 0,
    journeyHighestChapterIndex: 0,
    favoriteCardIds: [],
  }
}

export function parseTrainerState(
  raw: string,
  validCardIds: readonly string[],
): TrainerState | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value)) return null

    if (value.version === 1) {
      if (value.mode !== 'browse' && value.mode !== 'study') return null
      const fields = parseSessionFields(value, validCardIds, value.mode)
      if (!fields) return null

      return {
        version: TRAINER_STATE_VERSION,
        mode: value.mode,
        previousMode: value.mode,
        ...fields,
        studyProgressExpanded: false,
        journeyChapterIndex: 0,
        journeyHighestChapterIndex: 0,
        favoriteCardIds: [],
      }
    }

    if (value.version !== 2 && value.version !== TRAINER_STATE_VERSION) return null
    if (value.mode !== 'browse' && value.mode !== 'study' && value.mode !== 'journey') return null
    if (value.previousMode !== 'browse' && value.previousMode !== 'study') return null
    const fields = parseSessionFields(value, validCardIds, value.mode)
    if (!fields || typeof value.studyProgressExpanded !== 'boolean') return null
    if (
      typeof value.journeyChapterIndex !== 'number' ||
      !Number.isInteger(value.journeyChapterIndex) ||
      value.journeyChapterIndex < 0 ||
      value.journeyChapterIndex >= JOURNEY_CHAPTER_COUNT ||
      typeof value.journeyHighestChapterIndex !== 'number' ||
      !Number.isInteger(value.journeyHighestChapterIndex) ||
      value.journeyHighestChapterIndex < value.journeyChapterIndex ||
      value.journeyHighestChapterIndex >= JOURNEY_CHAPTER_COUNT
    ) {
      return null
    }

    // Migrace v2 -> v3 zachová celou relaci a přidá prázdné oblíbené.
    // Poškozené oblíbené ve v3 nesmí nepozorovaně zničit ostatní pokrok.
    const favoriteCardIds = value.version === 2
      ? []
      : isStringArray(value.favoriteCardIds) &&
          hasOnlyValidUniqueIds(value.favoriteCardIds, new Set(validCardIds))
        ? [...value.favoriteCardIds]
        : []

    return {
      version: TRAINER_STATE_VERSION,
      mode: value.mode,
      previousMode: value.previousMode,
      ...fields,
      studyProgressExpanded: value.studyProgressExpanded,
      journeyChapterIndex: value.journeyChapterIndex,
      journeyHighestChapterIndex: value.journeyHighestChapterIndex,
      favoriteCardIds,
    }
  } catch {
    return null
  }
}

function readLegacySettings(storage: StorageLike): InitialSettings {
  try {
    const raw = storage.getItem(LEGACY_SETTINGS_KEY)
    if (!raw) return {}

    const value: unknown = JSON.parse(raw)
    if (!isRecord(value)) return {}

    return {
      shuffleEnabled: value.shuffle === true,
      reversedEnabled: value.reversed === true,
    }
  } catch {
    return {}
  }
}

export function loadTrainerState(
  storage: StorageLike,
  validCardIds: readonly string[],
): TrainerState {
  try {
    const raw = storage.getItem(TRAINER_STATE_KEY)
    if (!raw) return createDefaultTrainerState(validCardIds, readLegacySettings(storage))

    const parsed = parseTrainerState(raw, validCardIds)
    if (parsed) return parsed

    storage.removeItem(TRAINER_STATE_KEY)
  } catch {
    // Výchozí stav zachová funkčnost i při nedostupném localStorage.
  }

  return createDefaultTrainerState(validCardIds, readLegacySettings(storage))
}

export function saveTrainerState(storage: StorageLike, state: TrainerState): boolean {
  try {
    storage.setItem(TRAINER_STATE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function changeTrainerMode(state: TrainerState, mode: TrainerMode): TrainerState {
  const previousMode: ClassicTrainerMode = mode === 'journey'
    ? state.mode === 'journey' ? state.previousMode : state.mode
    : mode
  return { ...state, mode, previousMode }
}

import type { JournalEntry, JournalState } from '../types/journal.ts'
import type { SpreadCardState } from '../types/spread.ts'
import type { DailyCardState } from '../types/dailyCard.ts'
import { DAILY_AREAS } from '../types/dailyCard.ts'
import { SPREAD_LAYOUT_IDS, type ThreeCardSpreadState } from '../types/spread.ts'
import type { StorageLike } from './trainerState.ts'

export const JOURNAL_KEY = 'tarot-trainer:journal'
export const JOURNAL_VERSION = 2
export const JOURNAL_LIMIT = 100
export const JOURNAL_NOTE_LIMIT = 2000
const validArea = (s: unknown): boolean => typeof s === 'string' && (DAILY_AREAS as readonly string[]).includes(s)
const validOrientation = (o: unknown): boolean => o === 'upright' || o === 'reversed'
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const newestFirst = (a: JournalEntry, b: JournalEntry): number => b.createdAt.localeCompare(a.createdAt)

export interface JournalMergeResult {
  state: JournalState
  added: number
  duplicates: number
  overflow: boolean
}

function validIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try { return new Date(value).toISOString() === value } catch { return false }
}

function validLocalDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year!, month! - 1, day!))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day
}

function migrateLegacySpreadId(id: string, createdAt: string): string {
  const input = `${id}\u0000${createdAt}`
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35]
  const parts = seeds.map((seed) => {
    let hash = seed
    for (let index = 0; index < input.length; index += 1) {
      hash = Math.imul(hash ^ input.charCodeAt(index), 0x01000193)
    }
    return (hash >>> 0).toString(16).padStart(8, '0')
  })
  return `spread:${parts.join('')}`
}

export function parseJournal(raw: string, ids: readonly string[]): JournalState | null {
  try {
    const data: unknown = JSON.parse(raw)
    if (!record(data) || (data.version !== 1 && data.version !== JOURNAL_VERSION)
      || !Array.isArray(data.entries) || data.entries.length > JOURNAL_LIMIT) return null
    const allowed = new Set(ids)
    const unique = new Set<string>()
    for (const entry of data.entries) {
      if (!record(entry) || typeof entry.id !== 'string' || !entry.id || entry.id.length > 100 || unique.has(entry.id)
        || !validIsoDate(entry.createdAt)
        || typeof entry.note !== 'string' || entry.note.length > JOURNAL_NOTE_LIMIT || !validArea(entry.area)) return null
      unique.add(entry.id)
      if (entry.type === 'daily') {
        if (!validLocalDate(entry.localDate)
          || entry.id !== `daily:${entry.localDate}`
          || typeof entry.cardId !== 'string' || !allowed.has(entry.cardId) || !validOrientation(entry.orientation)) return null
      } else if (entry.type === 'spread') {
        const validSpreadId = data.version === 1
          ? /^spread:(?:[a-f0-9]{1,8}|[a-f0-9]{32})$/.test(entry.id)
          : /^spread:[a-f0-9]{32}$/.test(entry.id)
        if (!validSpreadId
          || typeof entry.layoutId !== 'string' || !(SPREAD_LAYOUT_IDS as readonly string[]).includes(entry.layoutId)
          || typeof entry.question !== 'string' || entry.question.length > 280 || !Array.isArray(entry.cards) || entry.cards.length !== 3) return null
        const seen = new Set<string>()
        for (const card of entry.cards) {
          if (!record(card) || typeof card.cardId !== 'string' || !allowed.has(card.cardId) || seen.has(card.cardId)
            || !validOrientation(card.orientation) || card.revealed !== true || card.interpretationRevealed !== true) return null
          seen.add(card.cardId)
        }
      } else return null
    }
    const entries = (data.entries as JournalEntry[]).map((entry) => (
      data.version === 1 && entry.type === 'spread' && !/^spread:[a-f0-9]{32}$/.test(entry.id)
        ? { ...entry, id: migrateLegacySpreadId(entry.id, entry.createdAt) }
        : entry
    ))
    if (new Set(entries.map((entry) => entry.id)).size !== entries.length) return null
    return { version: JOURNAL_VERSION, entries: entries.sort(newestFirst) }
  } catch { return null }
}

export function readJournal(storage: StorageLike | null, ids: readonly string[]): JournalState {
  if (!storage) return { version: JOURNAL_VERSION, entries: [] }
  try {
    const raw = storage.getItem(JOURNAL_KEY)
    if (!raw) return { version: JOURNAL_VERSION, entries: [] }
    const parsed = parseJournal(raw, ids)
    if (!parsed) return { version: JOURNAL_VERSION, entries: [] }
    if ((JSON.parse(raw) as { version?: unknown }).version !== JOURNAL_VERSION) writeJournal(storage, parsed)
    return parsed
  } catch { return { version: JOURNAL_VERSION, entries: [] } }
}

export function writeJournal(storage: StorageLike | null, state: JournalState): boolean {
  if (!storage || state.version !== JOURNAL_VERSION || state.entries.length > JOURNAL_LIMIT) return false
  try { storage.setItem(JOURNAL_KEY, JSON.stringify(state)); return true } catch { return false }
}

export function addJournalEntry(state: JournalState, entry: JournalEntry): JournalState {
  const previous = state.entries.filter(item => item.id !== entry.id)
  if (previous.length >= JOURNAL_LIMIT) return state
  return { version: JOURNAL_VERSION, entries: [entry, ...previous].sort(newestFirst) }
}
export function updateJournalNote(state: JournalState, id: string, note: string): JournalState {
  return { ...state, entries: state.entries.map(entry => entry.id === id ? { ...entry, note: note.slice(0, JOURNAL_NOTE_LIMIT) } : entry) }
}
export function deleteJournalEntry(state: JournalState, id: string): JournalState {
  return { ...state, entries: state.entries.filter(entry => entry.id !== id) }
}
export function journalFromDaily(daily: DailyCardState): JournalEntry {
  return {
    id: `daily:${daily.localDate}`, type: 'daily', createdAt: new Date().toISOString(),
    note: '', area: daily.area, localDate: daily.localDate, cardId: daily.cardId, orientation: daily.orientation,
  }
}
export function journalFromSpread(spread: ThreeCardSpreadState): JournalEntry | null {
  if (!spread.readingId || !spread.dealtAt || spread.cards.length !== 3
    || spread.cards.some(c => !c.revealed || !c.interpretationRevealed)) return null
  return {
    id: spread.readingId, type: 'spread', createdAt: spread.dealtAt, note: '',
    area: spread.area, layoutId: spread.layoutId, question: spread.question,
    cards: spread.cards.map(c => ({ ...c })) as [SpreadCardState, SpreadCardState, SpreadCardState],
  }
}

export function mergeJournal(current: JournalState, incoming: JournalState): JournalMergeResult {
  const map = new Map(current.entries.map(e => [e.id, e]))
  const additions = incoming.entries.filter((entry) => !map.has(entry.id))
  if (map.size + additions.length > JOURNAL_LIMIT) {
    return {
      state: current,
      added: 0,
      duplicates: incoming.entries.length - additions.length,
      overflow: true,
    }
  }
  for (const entry of additions) map.set(entry.id, entry)
  return {
    state: { version: JOURNAL_VERSION, entries: [...map.values()].sort(newestFirst) },
    added: additions.length,
    duplicates: incoming.entries.length - additions.length,
    overflow: false,
  }
}

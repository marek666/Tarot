import type { JournalEntry, JournalState } from '../types/journal.ts'
import type { SpreadCardState } from '../types/spread.ts'
import type { DailyCardState } from '../types/dailyCard.ts'
import { DAILY_AREAS } from '../types/dailyCard.ts'
import { SPREAD_LAYOUT_IDS, type ThreeCardSpreadState } from '../types/spread.ts'
import type { StorageLike } from './trainerState.ts'

export const JOURNAL_KEY = 'tarot-trainer:journal'
export const JOURNAL_VERSION = 1
export const JOURNAL_LIMIT = 100
const NOTE_LIMIT = 2000
const validArea = (s: unknown): boolean => typeof s === 'string' && (DAILY_AREAS as readonly string[]).includes(s)
const validOrientation = (o: unknown): boolean => o === 'upright' || o === 'reversed'
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export function parseJournal(raw: string, ids: readonly string[]): JournalState | null {
  try {
    const data: unknown = JSON.parse(raw)
    if (!record(data) || data.version !== 1 || !Array.isArray(data.entries) || data.entries.length > JOURNAL_LIMIT) return null
    const allowed = new Set(ids)
    const unique = new Set<string>()
    for (const entry of data.entries) {
      if (!record(entry) || typeof entry.id !== 'string' || !entry.id || entry.id.length > 100 || unique.has(entry.id)
        || typeof entry.createdAt !== 'string' || !Number.isFinite(Date.parse(entry.createdAt))
        || typeof entry.note !== 'string' || entry.note.length > NOTE_LIMIT || !validArea(entry.area)) return null
      unique.add(entry.id)
      if (entry.type === 'daily') {
        if (typeof entry.localDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.localDate)
          || typeof entry.cardId !== 'string' || !allowed.has(entry.cardId) || !validOrientation(entry.orientation)) return null
      } else if (entry.type === 'spread') {
        if (typeof entry.layoutId !== 'string' || !(SPREAD_LAYOUT_IDS as readonly string[]).includes(entry.layoutId)
          || typeof entry.question !== 'string' || entry.question.length > 280 || !Array.isArray(entry.cards) || entry.cards.length !== 3) return null
        const seen = new Set<string>()
        for (const card of entry.cards) {
          if (!record(card) || typeof card.cardId !== 'string' || !allowed.has(card.cardId) || seen.has(card.cardId)
            || !validOrientation(card.orientation) || card.revealed !== true || card.interpretationRevealed !== true) return null
          seen.add(card.cardId)
        }
      } else return null
    }
    return data as unknown as JournalState
  } catch { return null }
}

export function readJournal(storage: StorageLike | null, ids: readonly string[]): JournalState {
  if (!storage) return { version: 1, entries: [] }
  try {
    const raw = storage.getItem(JOURNAL_KEY)
    if (!raw) return { version: 1, entries: [] }
    return parseJournal(raw, ids) ?? { version: 1, entries: [] }
  } catch { return { version: 1, entries: [] } }
}

export function writeJournal(storage: StorageLike | null, state: JournalState): boolean {
  if (!storage) return false
  try { storage.setItem(JOURNAL_KEY, JSON.stringify(state)); return true } catch { return false }
}

export function addJournalEntry(state: JournalState, entry: JournalEntry): JournalState {
  const previous = state.entries.filter(item => item.id !== entry.id)
  if (previous.length >= JOURNAL_LIMIT) return state
  return { version: 1, entries: [entry, ...previous] }
}
export function updateJournalNote(state: JournalState, id: string, note: string): JournalState {
  return { ...state, entries: state.entries.map(entry => entry.id === id ? { ...entry, note: note.slice(0, NOTE_LIMIT) } : entry) }
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
  if (spread.cards.length !== 3 || spread.cards.some(c => !c.revealed || !c.interpretationRevealed)) return null
  // Stabilní ID zabrání opakovanému uložení totožného výkladu.
  // Stejný los/otázka/rozložení znamená jeden historický záznam.
  const fingerprint = JSON.stringify([spread.layoutId,spread.area,spread.question,spread.cards.map(c=>[c.cardId,c.orientation])])
  let hash = 2166136261
  for (let i = 0; i < fingerprint.length; i++) hash = Math.imul(hash ^ fingerprint.charCodeAt(i),16777619)
  return {
    id: 'spread:' + (hash >>> 0).toString(16), type: 'spread', createdAt: new Date().toISOString(), note: '',
    area: spread.area, layoutId: spread.layoutId, question: spread.question,
    cards: spread.cards.map(c => ({ ...c })) as [SpreadCardState, SpreadCardState, SpreadCardState],
  }
}

export function mergeJournal(current: JournalState, incoming: JournalState): JournalState {
  const map = new Map(current.entries.map(e => [e.id, e]))
  for (const e of incoming.entries) if (!map.has(e.id)) map.set(e.id, e)
  return { version: 1, entries: [...map.values()].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,JOURNAL_LIMIT) }
}

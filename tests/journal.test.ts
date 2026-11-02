import assert from 'node:assert/strict'
import test from 'node:test'
import {
  JOURNAL_LIMIT,
  addJournalEntry,
  deleteJournalEntry,
  journalFromDaily,
  journalFromSpread,
  mergeJournal,
  parseJournal,
  readJournal,
  updateJournalNote,
  writeJournal,
} from '../src/lib/journal.ts'
import {
  createDefaultSpreadState,
  dealThreeCardSpread,
  revealAllSpreadCards,
} from '../src/lib/spreadState.ts'
import type { JournalEntry, JournalSpreadEntry, JournalState } from '../src/types/journal.ts'
import type { StorageLike } from '../src/lib/trainerState.ts'

const ids = ['major-00-fool', 'major-01-magician', 'major-02-high-priestess', 'cups-01']

class MemoryStorage implements StorageLike {
  values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
  removeItem(key: string): void { this.values.delete(key) }
}

const emptyJournal = (): JournalState => ({ version: 2, entries: [] })

function dailyEntry(localDate = '2026-11-02'): JournalEntry {
  return journalFromDaily({
    version: 1,
    localDate,
    cardId: ids[0]!,
    orientation: 'upright',
    area: 'general',
  })
}

function completedSpread(idCharacter: string, date = '2026-11-02T10:00:00.000Z') {
  const spread = dealThreeCardSpread(
    createDefaultSpreadState(),
    ids,
    () => 0,
    () => `spread:${idCharacter.repeat(32)}`,
    new Date(date),
  )
  return revealAllSpreadCards(spread)
}

test('deník uloží Kartu dne, obnoví ji a nemění ostatní lokální klíče', () => {
  const storage = new MemoryStorage()
  storage.setItem('tarot-trainer:state', 'unchanged')
  const entry = dailyEntry()
  const journal = addJournalEntry(emptyJournal(), entry)

  assert.equal(writeJournal(storage, journal), true)
  assert.deepEqual(readJournal(storage, ids), journal)
  assert.equal(storage.getItem('tarot-trainer:state'), 'unchanged')
})

test('poznámku lze změnit a záznam bezpečně odstranit', () => {
  const entry = dailyEntry()
  const journal = addJournalEntry(emptyJournal(), entry)
  const withNote = updateJournalNote(journal, entry.id, 'Moje interpretace')
  assert.equal(withNote.entries[0]?.note, 'Moje interpretace')
  assert.equal(deleteJournalEntry(withNote, entry.id).entries.length, 0)
})

test('dokončený spread má tři unikátní odkryté karty a stabilní ID relace', () => {
  const unfinished = dealThreeCardSpread(createDefaultSpreadState(), ids, () => 0)
  assert.equal(journalFromSpread(unfinished), null)

  const spread = completedSpread('a')
  const first = journalFromSpread(spread)
  const repeatedSave = journalFromSpread(spread)
  assert.equal(first?.id, 'spread:' + 'a'.repeat(32))
  assert.equal(first?.id, repeatedSave?.id)
  assert.ok(first?.type === 'spread')
  if (first?.type === 'spread') {
    assert.equal(first.cards.length, 3)
    assert.equal(new Set(first.cards.map((card) => card.cardId)).size, 3)
  }
})

test('stejné karty v novém vyložení dostanou jiné ID a lze uložit obě relace', () => {
  const first = journalFromSpread(completedSpread('a'))!
  const second = journalFromSpread(completedSpread('b', '2026-11-03T10:00:00.000Z'))!
  assert.notEqual(first.id, second.id)
  const journal = addJournalEntry(addJournalEntry(emptyJournal(), first), second)
  assert.equal(journal.entries.length, 2)
})

test('deduplikace importu zachová existující záznam a nic nepřepisuje', () => {
  const entry = { ...dailyEntry(), note: 'Původní poznámka' }
  const incoming = { ...entry, note: 'Importovaná poznámka' }
  const result = mergeJournal({ version: 2, entries: [entry] }, { version: 2, entries: [incoming] })
  assert.equal(result.added, 0)
  assert.equal(result.duplicates, 1)
  assert.equal(result.overflow, false)
  assert.equal(result.state.entries[0]?.note, 'Původní poznámka')
})

test('import nad limit je odmítnut bez tichého oříznutí', () => {
  const template = journalFromSpread(completedSpread('e')) as JournalSpreadEntry
  const currentEntries = Array.from({ length: JOURNAL_LIMIT }, (_, index): JournalSpreadEntry => ({
    ...template,
    id: `spread:${index.toString(16).padStart(32, '0')}`,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
  }))
  const current: JournalState = { version: 2, entries: currentEntries }
  const incoming: JournalState = { version: 2, entries: [journalFromSpread(completedSpread('f'))!] }
  const result = mergeJournal(current, incoming)
  assert.equal(result.overflow, true)
  assert.strictEqual(result.state, current)
  assert.equal(result.state.entries.length, JOURNAL_LIMIT)
})

test('export a následný import obnoví totožná data v pořadí od nejnovějších', () => {
  const older = { ...dailyEntry('2026-11-01'), createdAt: '2026-11-01T10:00:00.000Z', note: 'Starší' }
  const newer = journalFromSpread(completedSpread('c', '2026-11-02T10:00:00.000Z'))!
  const exported = JSON.stringify({ version: 2, entries: [older, newer] })
  const restored = parseJournal(exported, ids)
  assert.deepEqual(restored, { version: 2, entries: [newer, older] })
  assert.deepEqual(parseJournal(JSON.stringify(restored), ids), restored)
})

test('deník v1 s obsahovým hashem se migruje na stabilní schéma v2 bez ztráty dat', () => {
  const storage = new MemoryStorage()
  const spread = { ...journalFromSpread(completedSpread('a'))!, id: 'spread:1a2b3c4d', note: 'Historická poznámka' }
  storage.setItem('tarot-trainer:journal', JSON.stringify({ version: 1, entries: [spread] }))

  const migrated = readJournal(storage, ids)
  assert.equal(migrated.version, 2)
  assert.match(migrated.entries[0]?.id ?? '', /^spread:[a-f0-9]{32}$/)
  assert.equal(migrated.entries[0]?.note, 'Historická poznámka')
  assert.deepEqual(readJournal(storage, ids), migrated)
  assert.equal(JSON.parse(storage.getItem('tarot-trainer:journal')!).version, 2)
})

test('neplatná ID, duplicity a poškozený JSON jsou odmítnuty', () => {
  const entry = dailyEntry()
  assert.equal(parseJournal('not-json', ids), null)
  assert.equal(parseJournal(JSON.stringify({ version: 2, entries: [{ ...entry, cardId: 'unknown' }] }), ids), null)
  assert.equal(parseJournal(JSON.stringify({ version: 2, entries: [entry, entry] }), ids), null)
  assert.equal(parseJournal(JSON.stringify({ version: 2, entries: [{ ...entry, id: 'wrong' }] }), ids), null)
  assert.equal(parseJournal(JSON.stringify({ version: 2, entries: [{ ...entry, localDate: '2026-13-40', id: 'daily:2026-13-40' }] }), ids), null)
  const spread = journalFromSpread(completedSpread('a'))!
  assert.equal(parseJournal(JSON.stringify({ version: 2, entries: [{ ...spread, id: 'spread:not-random-enough' }] }), ids), null)
})

test('blokované nebo plné úložiště nevyvolá pád a aktivní spread zůstane nedotčený', () => {
  const unavailable: StorageLike = {
    getItem: () => { throw new Error('blocked') },
    setItem: () => { throw new Error('quota') },
    removeItem: () => { throw new Error('blocked') },
  }
  const spread = completedSpread('d')
  const before = JSON.stringify(spread)
  const journal = addJournalEntry(emptyJournal(), journalFromSpread(spread)!)

  assert.deepEqual(readJournal(unavailable, ids), emptyJournal())
  assert.equal(writeJournal(unavailable, journal), false)
  assert.equal(JSON.stringify(spread), before)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  JOURNAL_KEY, addJournalEntry, deleteJournalEntry, journalFromDaily,
  journalFromSpread, mergeJournal, parseJournal, readJournal,
  updateJournalNote, writeJournal,
} from '../src/lib/journal.ts'
import { createDefaultSpreadState, dealThreeCardSpread, revealAllSpreadCards } from '../src/lib/spreadState.ts'

const ids = ['major-00-fool','major-01-magician','major-02-high-priestess','cups-01']

class MemoryStorage {
  values = new Map<string,string>()
  getItem(key:string){ return this.values.get(key) ?? null }
  setItem(key:string,v:string){ this.values.set(key,v) }
  removeItem(key:string){ this.values.delete(key) }
}

test('deník ukládá kartu dne a poznámky, nerozbíjí ostatní klíče',()=>{
  const storage = new MemoryStorage()
  storage.setItem('tarot-trainer:state','unchanged')
  const entry = journalFromDaily({version:1,localDate:'2026-11-02',cardId:ids[0]!,orientation:'upright',area:'general'})
  let journal = addJournalEntry({version:1, entries:[]},entry)
  journal = updateJournalNote(journal,entry.id,'Moje interpretace')
  assert.equal(writeJournal(storage,journal),true)
  assert.deepEqual(readJournal(storage,ids),journal)
  assert.equal(storage.getItem('tarot-trainer:state'),'unchanged')
  assert.equal(deleteJournalEntry(journal,entry.id).entries.length,0)
})

test('uložený spread má tři unikátní odkryté karty a stabilní ID',()=>{
  let spread = dealThreeCardSpread(createDefaultSpreadState(),ids,()=>0)
  assert.equal(journalFromSpread(spread),null)
  spread = revealAllSpreadCards(spread)
  const one = journalFromSpread(spread)
  const two = journalFromSpread(spread)
  assert.equal(one?.id,two?.id)
  assert.ok(one && one.type==='spread')
  if(one?.type==='spread') {
    assert.equal(one.cards.length,3)
    assert.equal(new Set(one.cards.map(c=>c.cardId)).size,3)
  }
})

test('import slučuje podle ID a odmítá poškozený JSON',()=>{
  const entry = journalFromDaily({version:1,localDate:'2026-11-02',cardId:ids[0]!,orientation:'upright',area:'general'})
  const initial = {version:1 as const,entries:[entry]}
  assert.deepEqual(mergeJournal(initial,initial),initial)
  assert.deepEqual(parseJournal(JSON.stringify(initial),ids),initial)
  assert.equal(parseJournal('{"version":1,"entries":[{"bad":1}]}',ids),null)
  assert.equal(parseJournal(JSON.stringify({version:1, entries:[entry,entry]}),ids),null)
  const storage = new MemoryStorage()
  storage.setItem(JOURNAL_KEY,'bad')
  assert.deepEqual(readJournal(storage,ids).entries,[])
})

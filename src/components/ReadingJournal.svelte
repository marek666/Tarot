<script lang="ts">
  import { SPREAD_LAYOUTS } from '../data/spreadLayouts.ts'
  import { DAILY_AREA_LABELS } from '../data/dailyInterpretations.ts'
  import { getDailyInterpretation } from '../lib/dailyInterpretation.ts'
  import { getSpreadCardInterpretation, getCombinedSpreadInterpretation } from '../lib/spreadInterpretation.ts'
  import type { JournalEntry, JournalState } from '../types/journal.ts'
  import type { TarotCard } from '../types/tarot.ts'

  let {
    journal,
    cards,
    onNote,
    onDelete,
    onExport,
    onImport,
  }: {
    journal: JournalState
    cards: readonly TarotCard[]
    onNote: (id: string, note: string) => boolean
    onDelete: (id: string) => void
    onExport: () => void
    onImport: (text: string) => void
  } = $props()

  let selectedId = $state<string | null>(null)
  let filter = $state<'all' | 'daily' | 'spread'>('all')
  let draftNote = $state('')
  let message = $state('')
  let fileInput = $state<HTMLInputElement>()
  const cardById = new Map(cards.map(c => [c.id, c]))
  const visible = $derived(journal.entries.filter(e => filter === 'all' || e.type === filter))
  const selected = $derived(journal.entries.find(e => e.id === selectedId) ?? null)

  function select(entry: JournalEntry): void {
    selectedId = entry.id
    draftNote = entry.note
    message = ''
  }

  function saveNote(): void {
    if (!selected) return
    message = onNote(selected.id, draftNote) ? 'Poznámka uložena.' : 'Nepodařilo se uložit. Zkontrolujte volné místo.'
  }

  async function readImport(event: Event): Promise<void> {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) { message = 'Soubor je příliš velký (max. 1 MB).'; return }
    try { onImport(await file.text()) } catch { message = 'Import se nepodařil.' }
    if (fileInput) fileInput.value = ''
  }
</script>

<section class="journal" aria-labelledby="journal-title">
  <header class="journal-header">
    <div>
      <p>Soukromý offline deník</p>
      <h2 id="journal-title">Deník výkladů</h2>
    </div>
    <span>{journal.entries.length} / 100 záznamů</span>
  </header>
  <p class="muted">Výklady se ukládají jen do tohoto prohlížeče. Pro zachování při smazání dat použijte export.</p>

  <div class="journal-actions">
    <button type="button" onclick={onExport}>Export JSON</button>
    <button type="button" onclick={() => fileInput?.click()}>Import JSON</button>
    <input bind:this={fileInput} class="sr-only" type="file" accept=".json,application/json" aria-label="Importovat deník JSON" onchange={readImport} />
  </div>

  <div class="journal-filters" aria-label="Filtr deníku">
    <button type="button" class:active={filter==='all'} onclick={() => filter='all'}>Vše</button>
    <button type="button" class:active={filter==='daily'} onclick={() => filter='daily'}>Karta dne</button>
    <button type="button" class:active={filter==='spread'} onclick={() => filter='spread'}>Tři karty</button>
  </div>

  {#if !selected}
    {#if visible.length===0}
      <p class="empty">Zatím tu nejsou uložené výklady.</p>
    {:else}
      <ol class="journal-list">
        {#each visible as entry (entry.id)}
          <li>
            <button type="button" onclick={() => select(entry)}>
              <span class="journal-thumbs">
                {#each entry.type==='daily' ? [entry.cardId] : entry.cards.map(c=>c.cardId) as id}
                  {#if cardById.get(id)}<img src={cardById.get(id)!.image} alt="" width="44" height="76" loading="lazy" />{/if}
                {/each}
              </span>
              <span>
                <strong>{entry.type === 'daily' ? 'Karta dne' : SPREAD_LAYOUTS[entry.layoutId].title}</strong>
                <small>{new Date(entry.createdAt).toLocaleDateString('cs-CZ')} · {DAILY_AREA_LABELS[entry.area]}</small>
                {#if entry.type==='spread' && entry.question}<small>{entry.question}</small>{/if}
                {#if entry.note}<small>{entry.note.slice(0,90)}</small>{/if}
              </span>
            </button>
          </li>
        {/each}
      </ol>
    {/if}
  {:else}
    <button type="button" class="back" onclick={() => {selectedId=null; message=''}}>← Zpět do deníku</button>
    <h3>{selected.type === 'daily' ? 'Karta dne' : SPREAD_LAYOUTS[selected.layoutId].title}</h3>
    <p class="muted">{new Date(selected.createdAt).toLocaleString('cs-CZ')} · {DAILY_AREA_LABELS[selected.area]}</p>
    {#if selected.type === 'daily'}
      {@const card = cardById.get(selected.cardId)}
      {#if card}
        <div class="journal-card">
          <img src={card.image} alt={card.nameCs} width="135" height="234" />
          <div>
            <h4>{card.nameCs}</h4>
            <small>{selected.orientation === 'reversed' ? 'Obrácená' : 'Přímá'} · {selected.localDate}</small>
            <p>{getDailyInterpretation(card,selected.orientation,selected.area).summary}</p>
          </div>
        </div>
      {/if}
    {:else}
      {#if selected.question}<p class="question">{selected.question}</p>{/if}
      {#each selected.cards as saved, index}
        {@const card = cardById.get(saved.cardId)}
        {#if card}
          {@const interpretation = getSpreadCardInterpretation(card,saved.orientation,selected.layoutId,index,selected.area)}
          <div class="journal-card">
            <img src={card.image} alt={card.nameCs} width="100" height="174" />
            <div>
              <small>{interpretation.position.title} · {saved.orientation === 'reversed' ? 'Obrácená' : 'Přímá'}</small>
              <h4>{card.nameCs}</h4>
              <p>{interpretation.positionMeaning}</p>
              <p>{interpretation.areaConnection}</p>
            </div>
          </div>
        {/if}
      {/each}
      {#if selected.cards.every(c => cardById.has(c.cardId))}
        {@const resolved = selected.cards.map(c=>({state:c,card:cardById.get(c.cardId)!}))}
        {@const combined = getCombinedSpreadInterpretation(resolved,selected.layoutId,selected.question)}
        <div class="journal-combined">
          <h4>Společný výklad</h4>
          <p>{combined.pattern}</p>
          <p>{combined.finalQuestion}</p>
        </div>
      {/if}
    {/if}

    <label class="note-label" for="journal-note">Moje poznámky</label>
    <textarea id="journal-note" rows="5" maxlength="2000" bind:value={draftNote} placeholder="Co pro mě výklad znamená?"></textarea>
    {#if message}<p role="status">{message}</p>{/if}
    <div class="journal-actions">
      <button type="button" onclick={saveNote}>Uložit poznámku</button>
      <button type="button" class="danger" onclick={() => { if(selected && confirm('Opravdu odstranit tento výklad?')) { onDelete(selected.id); selectedId=null; } }}>Odstranit výklad</button>
    </div>
  {/if}
</section>

<style>
  .journal { width:min(100%,64rem); display:grid; gap:1rem; color:var(--text); }
  .journal-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; border-bottom:1px solid var(--border); padding-bottom:0.8rem; }
  .journal-header p { color:var(--gold); font-size:0.7rem; }
  h2,h3,h4 { font-family:Georgia,serif; font-weight:400; }
  h2 { font-size:1.7rem; }
  h3 { font-size:1.4rem; }
  h4 { font-size:1.15rem; margin:0 0 0.4rem; }
  .muted { color:var(--muted); font-size:0.82rem; }
  button { cursor:pointer; min-height:44px; }
  button:focus-visible,textarea:focus-visible { outline:3px solid var(--gold); outline-offset:2px; }
  .journal-actions,.journal-filters { display:flex; flex-wrap:wrap; gap:0.5rem; }
  .journal-actions button,.journal-filters button,.back { padding:0.65rem 0.85rem; background:var(--surface-light); color:var(--text); border:1px solid var(--border); border-radius:0.7rem; }
  .journal-filters .active { background:var(--gold); color:#111927; }
  .journal-actions .danger { color:#f2b3aa; }
  .journal-list { display:grid; gap:0.6rem; list-style:none; margin:0; padding:0; }
  .journal-list li button { width:100%; padding:0.7rem; display:flex; align-items:center; gap:1rem; text-align:left; background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:0.8rem; }
  .journal-list li button > span:last-child { min-width:0; display:grid; gap:0.35rem; }
  .journal-list small { color:var(--muted); overflow-wrap:anywhere; }
  .journal-thumbs { display:flex; flex-shrink:0; gap:0.2rem; }
  .journal-thumbs img { width:clamp(24px,7vw,44px); height:auto; max-height:76px; object-fit:contain; border-radius:0.25rem; }
  .journal-card { display:flex; align-items:start; gap:1rem; padding:0.85rem; background:var(--surface); border:1px solid var(--border); border-radius:0.8rem; }
  .journal-card img { width:min(28%,135px); height:auto; flex-shrink:0; }
  .journal-card p,.journal-combined p { margin-top:0.45rem; font-size:0.84rem; line-height:1.6; }
  .journal-card small { color:var(--gold); }
  .journal-combined { padding:1rem; background:var(--surface); border-radius:0.8rem; }
  .question { font-style:italic; }
  .note-label { color:var(--gold); font-weight:700; }
  textarea { width:100%; padding:0.8rem; color:var(--text); background:var(--surface); border:1px solid var(--border); border-radius:0.8rem; }
  .empty { padding:2rem; text-align:center; color:var(--muted); }
  .sr-only { position:absolute; width:1px; height:1px; opacity:0; overflow:hidden; }
  @media(max-width:359px){.journal-card{gap:0.6rem;padding:0.6rem;}.journal-header{flex-wrap:wrap;}}
</style>

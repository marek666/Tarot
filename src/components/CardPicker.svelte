<script lang="ts">
  import { onDestroy } from 'svelte'
  import {
    filterPickerCards,
    type CardGroupFilter,
    type CardStudyFilter,
  } from '../lib/cardPicker.ts'
  import type { TarotCard } from '../types/tarot.ts'
  import type { StudyProgress } from '../types/trainer.ts'

  let {
    cards,
    currentCardId,
    onSelect,
    triggerLabel = 'Vybrat kartu',
    dialogTitle = 'Vybrat kartu',
    wide = false,
    showStudyFilters = false,
    studyProgress = null,
  }: {
    cards: readonly TarotCard[]
    currentCardId: string
    onSelect: (cardId: string) => void
    triggerLabel?: string
    dialogTitle?: string
    wide?: boolean
    showStudyFilters?: boolean
    studyProgress?: StudyProgress | null
  } = $props()

  let dialog = $state<HTMLDialogElement>()
  let trigger = $state<HTMLButtonElement>()
  let searchInput = $state<HTMLInputElement>()
  let query = $state('')
  let group = $state<CardGroupFilter>('all')
  let study = $state<CardStudyFilter>('all')

  const filteredCards = $derived(filterPickerCards(cards, { query, group, study }, studyProgress))

  function openPicker(): void {
    query = ''
    group = 'all'
    study = 'all'
    dialog?.showModal()
    document.documentElement.classList.add('card-picker-open')
    window.requestAnimationFrame(() => searchInput?.focus())
  }

  function closePicker(): void {
    dialog?.close()
  }

  function handleClose(): void {
    document.documentElement.classList.remove('card-picker-open')
    window.requestAnimationFrame(() => trigger?.focus())
  }

  function selectCard(cardId: string): void {
    onSelect(cardId)
    closePicker()
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === dialog) closePicker()
  }

  function handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

    const buttons = Array.from(dialog?.querySelectorAll<HTMLButtonElement>('.picker-card') ?? [])
    if (buttons.length === 0) return

    const activeIndex = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const nextIndex = event.key === 'ArrowDown'
      ? Math.min(activeIndex + 1, buttons.length - 1)
      : activeIndex < 0
        ? buttons.length - 1
        : Math.max(activeIndex - 1, 0)

    event.preventDefault()
    buttons[nextIndex]?.focus()
  }

  onDestroy(() => document.documentElement.classList.remove('card-picker-open'))
</script>

<button
  bind:this={trigger}
  type="button"
  class="picker-trigger"
  class:wide
  aria-haspopup="dialog"
  onclick={openPicker}
>
  <span aria-hidden="true">⌕</span>
  {triggerLabel}
</button>

<dialog
  bind:this={dialog}
  class="card-picker-dialog"
  aria-labelledby="card-picker-title"
  aria-modal="true"
  onclose={handleClose}
  onclick={handleBackdropClick}
  onkeydown={handleDialogKeydown}
>
  <header>
    <div>
      <p>Rychlá navigace</p>
      <h2 id="card-picker-title">{dialogTitle}</h2>
    </div>
    <button type="button" class="close-button" aria-label="Zavřít výběr karet" onclick={closePicker}>×</button>
  </header>

  <div class="picker-controls">
    <label class="search-field">
      <span class="visually-hidden">Hledat podle názvu</span>
      <input
        bind:this={searchInput}
        bind:value={query}
        type="search"
        placeholder="Hledat česky nebo anglicky…"
        autocomplete="off"
        spellcheck="false"
      />
    </label>

    <div class:with-study={showStudyFilters} class="filter-row">
      <label>
        <span>Arkána a barva</span>
        <select bind:value={group} aria-label="Filtrovat arkánu nebo barvu">
          <option value="all">Všechny karty</option>
          <option value="major">Velká arkána</option>
          <option value="minor">Malá arkána</option>
          <option value="wands">Hole</option>
          <option value="cups">Poháry</option>
          <option value="swords">Meče</option>
          <option value="pentacles">Pentakly</option>
        </select>
      </label>

      {#if showStudyFilters}
        <label>
          <span>Studijní stav</span>
          <select bind:value={study} aria-label="Filtrovat podle studijního stavu">
            <option value="all">Všechny</option>
            <option value="known">Umím</option>
            <option value="practice">Procvičit</option>
            <option value="remaining">Zbývající</option>
          </select>
        </label>
      {/if}
    </div>

    <p class="result-count" aria-live="polite">{filteredCards.length} {filteredCards.length === 1 ? 'karta' : 'karet'}</p>
  </div>

  <div class="picker-list" tabindex="-1">
    {#if filteredCards.length === 0}
      <p class="empty-result">Žádná karta neodpovídá zadaným filtrům.</p>
    {:else}
      <ol>
        {#each filteredCards as card}
          {@const traditionalIndex = cards.findIndex((item) => item.id === card.id)}
          <li>
            <button
              type="button"
              class="picker-card"
              class:current={card.id === currentCardId}
              aria-current={card.id === currentCardId ? 'true' : undefined}
              data-card-id={card.id}
              onclick={() => selectCard(card.id)}
            >
              <img src={card.image} alt="" width="64" height="111" loading="lazy" />
              <span class="card-position">{traditionalIndex + 1}</span>
              <span class="card-names">
                <strong>{card.nameCs}</strong>
                <small>{card.nameEn}</small>
              </span>
              {#if card.id === currentCardId}<span class="current-label">Aktuální</span>{/if}
            </button>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</dialog>

<style>
  :global(html.card-picker-open) {
    overflow: hidden;
  }

  .picker-trigger {
    width: min(100%, 25rem);
    min-height: 44px;
    padding: 0.6rem 0.9rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    color: var(--gold);
    background: rgb(216 184 108 / 8%);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .picker-trigger > span {
    font-size: 1.1rem;
    line-height: 1;
  }

  .picker-trigger.wide {
    width: 100%;
  }

  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 2px;
  }

  .card-picker-dialog {
    width: min(calc(100% - 2rem), 42rem);
    max-height: min(84dvh, 48rem);
    margin: auto;
    padding: 0;
    color: var(--text);
    background: #091525;
    border: 1px solid rgb(216 184 108 / 38%);
    border-radius: 1rem;
    box-shadow: 0 1.5rem 5rem rgb(0 0 0 / 65%);
  }

  .card-picker-dialog[open] {
    display: flex;
    flex-direction: column;
  }

  .card-picker-dialog::backdrop {
    background: rgb(2 8 16 / 78%);
    backdrop-filter: blur(3px);
  }

  .card-picker-dialog > header {
    padding: 0.85rem 0.9rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--border);
  }

  header p {
    color: var(--gold);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0.18rem 0 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.35rem;
    font-weight: 400;
  }

  .close-button {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    color: var(--muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
  }

  .picker-controls {
    z-index: 1;
    padding: 0.8rem 0.9rem 0.7rem;
    background: #091525;
    border-bottom: 1px solid var(--border);
  }

  .search-field input,
  select {
    width: 100%;
    min-height: 44px;
    color: var(--text);
    background: #0d1a2b;
    border: 1px solid var(--border);
    border-radius: 0.65rem;
  }

  .search-field input {
    padding: 0.65rem 0.8rem;
  }

  .search-field input::placeholder {
    color: #7f8b9b;
  }

  .filter-row {
    margin-top: 0.65rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }

  .filter-row.with-study {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-row label > span {
    display: block;
    margin-bottom: 0.28rem;
    color: var(--muted);
    font-size: 0.62rem;
  }

  select {
    padding: 0.55rem 2rem 0.55rem 0.65rem;
    font-size: 0.74rem;
  }

  .result-count {
    margin: 0.55rem 0 0;
    color: #7f8b9b;
    font-size: 0.64rem;
    text-align: right;
  }

  .picker-list {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-color: var(--gold-soft) #0a1625;
  }

  .picker-list ol {
    margin: 0;
    padding: 0.65rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    list-style: none;
  }

  .picker-card {
    width: 100%;
    min-height: 76px;
    padding: 0.4rem;
    display: grid;
    grid-template-columns: 42px 1.5rem minmax(0, 1fr);
    align-items: center;
    gap: 0.45rem;
    color: var(--text);
    background: #0d1a2b;
    border: 1px solid transparent;
    border-radius: 0.7rem;
    cursor: pointer;
    text-align: left;
  }

  .picker-card:hover {
    border-color: var(--gold-soft);
  }

  .picker-card.current {
    background: rgb(216 184 108 / 12%);
    border-color: var(--gold);
  }

  .picker-card img {
    width: 42px;
    height: 66px;
    display: block;
    object-fit: contain;
    border-radius: 0.25rem;
  }

  .card-position {
    color: #738094;
    font-size: 0.65rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .card-names {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .card-names strong,
  .card-names small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-names strong {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.8rem;
    font-weight: 400;
  }

  .card-names small {
    color: var(--muted);
    font-size: 0.62rem;
  }

  .current-label {
    grid-column: 2 / -1;
    color: var(--gold);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .empty-result {
    padding: 2rem 1rem;
    color: var(--muted);
    font-size: 0.8rem;
    text-align: center;
  }

  @media (max-width: 699px) {
    .card-picker-dialog {
      width: 100%;
      max-width: none;
      max-height: calc(100dvh - max(env(safe-area-inset-top), 0.5rem));
      margin: auto 0 0;
      border-right: 0;
      border-bottom: 0;
      border-left: 0;
      border-radius: 1rem 1rem 0 0;
    }

    .picker-list ol {
      grid-template-columns: 1fr;
      padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
    }

    .picker-card {
      grid-template-columns: 42px 1.6rem minmax(0, 1fr) auto;
    }

    .current-label {
      grid-column: auto;
    }
  }

  @media (max-width: 359px) {
    .filter-row.with-study {
      grid-template-columns: 1fr;
    }
  }
</style>

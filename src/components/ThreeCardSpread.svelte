<script lang="ts">
  import { DAILY_AREA_LABELS } from '../data/dailyInterpretations.ts'
  import { SPREAD_LAYOUT_LIST, SPREAD_LAYOUTS } from '../data/spreadLayouts.ts'
  import { DAILY_AREAS, type DailyArea } from '../types/dailyCard.ts'
  import type { TarotCard } from '../types/tarot.ts'
  import type {
    CombinedSpreadInterpretation,
    SpreadCardInterpretation,
    SpreadLayoutId,
    ThreeCardSpreadState,
  } from '../types/spread.ts'
  import SpreadCard from './SpreadCard.svelte'

  let {
    state: spreadState,
    cards,
    interpretations,
    combined,
    onSettingsChange,
    onDeal,
    onReveal,
    onRevealAll,
    onRevealInterpretation,
    onNewSpread,
  }: {
    state: ThreeCardSpreadState
    cards: readonly TarotCard[]
    interpretations: readonly SpreadCardInterpretation[]
    combined: CombinedSpreadInterpretation | null
    onSettingsChange: (patch: Partial<Pick<ThreeCardSpreadState, 'layoutId' | 'area' | 'question' | 'reversedEnabled' | 'learningFirst'>>) => void
    onDeal: () => void
    onReveal: (index: number) => void
    onRevealAll: () => void
    onRevealInterpretation: (index: number) => void
    onNewSpread: () => void
  } = $props()

  let selectedIndex = $state(0)
  const layout = $derived(SPREAD_LAYOUTS[spreadState.layoutId])
  const hasReading = $derived(spreadState.cards.length === 3)
  const allRevealed = $derived(hasReading && spreadState.cards.every((card) => card.revealed))
  const allInterpretationsRevealed = $derived(
    hasReading && spreadState.cards.every((card) => card.interpretationRevealed),
  )
  const selectedState = $derived(spreadState.cards[selectedIndex])
  const selectedCard = $derived(cards[selectedIndex])
  const selectedInterpretation = $derived(interpretations[selectedIndex])

  $effect(() => {
    if (!hasReading) selectedIndex = 0
    else if (selectedIndex >= spreadState.cards.length) selectedIndex = 0
  })

  function activateCard(index: number): void {
    selectedIndex = index
    if (!spreadState.cards[index]?.revealed) onReveal(index)
  }

  function continueToNext(): void {
    if (!hasReading) return
    const nextIndex = (selectedIndex + 1) % 3
    selectedIndex = nextIndex
    if (!spreadState.cards[nextIndex]?.revealed) onReveal(nextIndex)
  }
</script>

<section class="spread" aria-labelledby="spread-title">
  <header class="spread-heading">
    <div>
      <p>Tříkaretní výklad</p>
      <h2 id="spread-title">Tři pohledy na jedno téma</h2>
    </div>
    <span>Výuková pomůcka, ne jistá předpověď</span>
  </header>

  {#if !hasReading}
    <form class="spread-setup" onsubmit={(event) => { event.preventDefault(); onDeal() }}>
      <label class="field">
        <span>Rozložení</span>
        <select
          value={spreadState.layoutId}
          onchange={(event) => onSettingsChange({ layoutId: event.currentTarget.value as SpreadLayoutId })}
        >
          {#each SPREAD_LAYOUT_LIST as option}
            <option value={option.id}>{option.title}</option>
          {/each}
        </select>
      </label>

      <div class="layout-explanation">
        <p>{layout.description}</p>
        <ol>
          {#each layout.positions as position}
            <li><strong>{position.title}</strong><span>{position.role}</span></li>
          {/each}
        </ol>
      </div>

      <fieldset class="area-picker">
        <legend>Tematická oblast</legend>
        <div>
          {#each DAILY_AREAS as area}
            <button
              type="button"
              class:active={spreadState.area === area}
              aria-pressed={spreadState.area === area}
              onclick={() => onSettingsChange({ area: area as DailyArea })}
            >
              {DAILY_AREA_LABELS[area]}
            </button>
          {/each}
        </div>
      </fieldset>

      <label class="field question-field">
        <span>Vlastní otázka <small>volitelné</small></span>
        <textarea
          rows="3"
          maxlength="280"
          placeholder="Například: Co potřebuji lépe pochopit v současné pracovní situaci?"
          value={spreadState.question}
          oninput={(event) => onSettingsChange({ question: event.currentTarget.value })}
        ></textarea>
      </label>

      <div class="spread-toggles">
        <label class:active={spreadState.reversedEnabled}>
          <span><strong>Reversed</strong><small>Každá karta má vlastní 50% šanci</small></span>
          <input
            type="checkbox"
            checked={spreadState.reversedEnabled}
            onchange={(event) => onSettingsChange({ reversedEnabled: event.currentTarget.checked })}
          />
        </label>
        <label class:active={spreadState.learningFirst}>
          <span><strong>Nejdřív vlastní výklad</strong><small>Vzorový text se ukáže až na žádost</small></span>
          <input
            type="checkbox"
            checked={spreadState.learningFirst}
            onchange={(event) => onSettingsChange({ learningFirst: event.currentTarget.checked })}
          />
        </label>
      </div>

      <button type="submit" class="deal-button">Zamíchat a vyložit</button>
    </form>
  {:else}
    <section class="reading-summary" aria-label="Nastavení aktuálního výkladu">
      <div>
        <p>{layout.title}</p>
        <span>{DAILY_AREA_LABELS[spreadState.area]} · {spreadState.reversedEnabled ? 'Reversed zapnuto' : 'Pouze přímé karty'}</span>
      </div>
      {#if spreadState.question}<blockquote>{spreadState.question}</blockquote>{/if}
    </section>

    <div class="spread-grid" aria-label="Tři pozice výkladu">
      {#each cards as card, index}
        <SpreadCard
          {card}
          state={spreadState.cards[index]!}
          position={layout.positions[index]}
          active={selectedIndex === index && spreadState.cards[index]!.revealed}
          onActivate={() => activateCard(index)}
        />
      {/each}
    </div>

    <div class="reading-actions">
      {#if !allRevealed}
        <button type="button" class="reveal-all" onclick={onRevealAll}>Odhalit všechny karty</button>
      {/if}
      <button type="button" class="new-spread" onclick={onNewSpread}>Nový výklad</button>
    </div>

    {#if selectedState?.revealed && selectedCard && selectedInterpretation}
      <article class="card-detail" aria-live="polite">
        <header>
          <div>
            <p>{selectedInterpretation.position.title} · {selectedState.orientation === 'reversed' ? 'Obrácená poloha' : 'Přímá poloha'}</p>
            <h3>{selectedCard.nameCs}</h3>
            <span>{selectedCard.nameEn}</span>
          </div>
          <button type="button" onclick={continueToNext}>
            {selectedIndex === 2 ? 'Zpět na první pozici' : spreadState.cards[selectedIndex + 1]?.revealed ? 'Další pozice' : 'Odhalit další pozici'} →
          </button>
        </header>

        <p class="position-role">{selectedInterpretation.position.role}</p>

        {#if spreadState.learningFirst && !selectedState.interpretationRevealed}
          <section class="own-reading">
            <h4>Nejdřív vlastní výklad</h4>
            <p>Prohlédněte si ilustraci, název a roli pozice. Zkuste vlastními slovy pojmenovat hlavní téma a teprve potom jej porovnejte se vzorovým čtením.</p>
            <button type="button" onclick={() => onRevealInterpretation(selectedIndex)}>
              Zobrazit vzorový výklad
            </button>
          </section>
        {:else}
          <div class="detail-content">
            <section>
              <h4>Klíčová slova</h4>
              <ul class="keywords">
                {#each selectedInterpretation.keywords as keyword}<li>{keyword}</li>{/each}
              </ul>
            </section>
            <section>
              <h4>Klasický význam</h4>
              <p>{selectedInterpretation.classicSummary}</p>
              <details>
                <summary>Podrobný klasický význam</summary>
                <p>{selectedInterpretation.classicDescription}</p>
              </details>
            </section>
            <section>
              <h4>Význam v pozici „{selectedInterpretation.position.title}“</h4>
              <p>{selectedInterpretation.positionMeaning}</p>
            </section>
            <section>
              <h4>Vztah k oblasti</h4>
              <p>{selectedInterpretation.areaConnection}</p>
            </section>
            <section class="reflection">
              <h4>Otázka k zamyšlení</h4>
              <p>{selectedInterpretation.reflectionQuestion}</p>
            </section>
          </div>
        {/if}
      </article>
    {:else}
      <p class="selection-hint">Klepnutím na rub odhalíte kartu a otevřete její detail.</p>
    {/if}

    {#if allRevealed && allInterpretationsRevealed && combined}
      <section class="combined-reading" aria-labelledby="combined-title">
        <h3 id="combined-title">Jak číst karty společně</h3>
        <p>{combined.overview}</p>
        <ul class="card-themes">
          {#each combined.cardThemes as theme}<li>{theme}</li>{/each}
        </ul>
        <p class="pattern">{combined.pattern}</p>
        <h4>Propojení pozic</h4>
        <ul>
          {#each combined.connectionQuestions as question}<li>{question}</li>{/each}
        </ul>
        <div class="final-question">
          <h4>Závěrečná reflexe</h4>
          <p>{combined.finalQuestion}</p>
        </div>
      </section>
    {/if}
  {/if}

  <p class="spread-note">Výklad nabízí strukturu pro přemýšlení. „Možný vývoj“ ani jiná pozice nepředstavují jistou budoucnost.</p>
</section>

<style>
  .spread {
    width: min(100%, 72rem);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .spread-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--border);
  }

  .spread-heading p,
  .card-detail header p {
    margin: 0;
    color: var(--gold);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .spread-heading h2 {
    margin: 0.2rem 0 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.4rem, 7vw, 2rem);
    font-weight: 400;
  }

  .spread-heading > span {
    display: none;
    color: var(--muted);
    font-size: 0.72rem;
  }

  .spread-setup {
    width: min(100%, 50rem);
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .field > span,
  .area-picker legend {
    display: block;
    margin-bottom: 0.4rem;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .field small { font-weight: 400; }

  select,
  textarea {
    width: 100%;
    min-height: 44px;
    padding: 0.7rem 0.8rem;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0.7rem;
  }

  textarea { min-height: 5.5rem; resize: vertical; line-height: 1.45; }

  .layout-explanation {
    padding: 0.85rem;
    background: rgb(13 26 43 / 68%);
    border: 1px solid var(--border);
    border-radius: 0.8rem;
  }

  .layout-explanation > p,
  .position-role,
  .selection-hint,
  .spread-note {
    margin: 0;
    color: var(--muted);
    font-size: 0.76rem;
    line-height: 1.55;
  }

  .layout-explanation ol {
    margin: 0.7rem 0 0;
    padding-left: 1.25rem;
  }

  .layout-explanation li { margin-top: 0.4rem; }
  .layout-explanation li::marker { color: var(--gold); }
  .layout-explanation strong { color: var(--gold); font-size: 0.78rem; }
  .layout-explanation span { display: block; margin-top: 0.12rem; color: var(--muted); font-size: 0.72rem; line-height: 1.4; }

  .area-picker { margin: 0; padding: 0; border: 0; }
  .area-picker > div { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem; }

  .area-picker button,
  .reading-actions button,
  .card-detail header button,
  .own-reading button {
    min-width: 0;
    min-height: 44px;
    color: var(--muted);
    background: #091525;
    border: 1px solid var(--border);
    border-radius: 0.65rem;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .area-picker button.active {
    color: #111927;
    background: var(--gold);
    border-color: var(--gold);
  }

  .spread-toggles { display: grid; grid-template-columns: 1fr; gap: 0.55rem; }

  .spread-toggles label {
    position: relative;
    min-height: 58px;
    padding: 0.7rem 0.8rem;
    display: flex;
    align-items: center;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    cursor: pointer;
  }

  .spread-toggles label.active { border-color: rgb(216 184 108 / 58%); background: var(--surface-light); }
  .spread-toggles label span { display: flex; flex-direction: column; gap: 0.15rem; }
  .spread-toggles strong { font-size: 0.78rem; }
  .spread-toggles small { color: var(--muted); font-size: 0.64rem; }
  .spread-toggles input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
  .spread-toggles label:has(input:focus-visible) { outline: 3px solid var(--gold); outline-offset: 3px; }

  .deal-button {
    min-height: 50px;
    color: #111927;
    background: var(--gold);
    border: 1px solid var(--gold);
    border-radius: 0.75rem;
    cursor: pointer;
    font-weight: 800;
  }

  .reading-summary {
    padding: 0.75rem 0.85rem;
    background: rgb(13 26 43 / 68%);
    border: 1px solid var(--border);
    border-radius: 0.8rem;
  }

  .reading-summary p { margin: 0; color: var(--gold); font-weight: 700; font-size: 0.82rem; }
  .reading-summary span { display: block; margin-top: 0.18rem; color: var(--muted); font-size: 0.68rem; }
  blockquote { margin: 0.65rem 0 0; padding-left: 0.7rem; color: var(--text); border-left: 2px solid var(--gold); font-size: 0.78rem; line-height: 1.45; }

  .spread-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(0.35rem, 2vw, 1rem);
  }

  .reading-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.55rem; }
  .reading-actions .reveal-all { color: #111927; background: var(--gold); border-color: var(--gold); }
  .reading-actions .new-spread:only-child { grid-column: 1 / -1; }

  .card-detail,
  .combined-reading {
    padding: 1rem;
    background: rgb(13 26 43 / 74%);
    border: 1px solid var(--border);
    border-radius: 0.9rem;
  }

  .card-detail header { display: flex; flex-direction: column; gap: 0.75rem; }
  .card-detail h3 { margin: 0.2rem 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 1.55rem; font-weight: 400; }
  .card-detail header span { color: var(--muted); font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; }
  .card-detail header button { padding-inline: 0.75rem; }
  .position-role { margin-top: 0.8rem; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border); }

  .own-reading { margin-top: 1rem; padding: 0.9rem; background: rgb(216 184 108 / 7%); border-left: 3px solid var(--gold); }
  .own-reading h4,
  .detail-content h4,
  .combined-reading h3,
  .combined-reading h4 { margin: 0; color: var(--gold); font-family: Georgia, 'Times New Roman', serif; font-weight: 400; }
  .own-reading p,
  .detail-content p,
  .combined-reading p,
  .combined-reading li { color: var(--text); font-size: 0.84rem; line-height: 1.62; }
  .own-reading button { margin-top: 0.7rem; padding-inline: 0.9rem; color: #111927; background: var(--gold); border-color: var(--gold); }

  .detail-content { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
  .detail-content section { min-width: 0; }
  .detail-content h4 { margin-bottom: 0.35rem; font-size: 1rem; }
  .detail-content p { margin: 0; overflow-wrap: anywhere; }
  details { margin-top: 0.6rem; }
  summary { min-height: 44px; display: flex; align-items: center; color: var(--gold); cursor: pointer; font-size: 0.72rem; }
  details p { padding-top: 0.45rem; }

  .keywords { margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.4rem; list-style: none; }
  .keywords li { padding: 0.3rem 0.55rem; color: #ead8a4; background: rgb(216 184 108 / 9%); border: 1px solid rgb(216 184 108 / 24%); border-radius: 999px; font-size: 0.68rem; }
  .reflection,
  .final-question { padding-left: 0.8rem; border-left: 3px solid var(--gold); }

  .combined-reading { display: flex; flex-direction: column; gap: 0.8rem; }
  .combined-reading h3 { font-size: 1.4rem; }
  .combined-reading ul { margin: 0; padding-left: 1.2rem; }
  .combined-reading li + li { margin-top: 0.35rem; }
  .combined-reading li::marker { color: var(--gold); }
  .combined-reading .pattern { padding: 0.75rem; background: rgb(216 184 108 / 7%); border-radius: 0.65rem; }
  .final-question p { margin: 0.3rem 0 0; }

  .selection-hint,
  .spread-note { text-align: center; }

  button:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  summary:focus-visible { outline: 3px solid var(--gold); outline-offset: 3px; }

  @media (min-width: 600px) {
    .spread-heading > span { display: inline; }
    .area-picker > div { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .spread-toggles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .card-detail header { flex-direction: row; align-items: center; justify-content: space-between; }
    .card-detail header button { max-width: 15rem; }
  }

  @media (min-width: 900px) {
    .spread-grid { width: min(100%, 52rem); margin-inline: auto; gap: 1.35rem; }
    .card-detail,
    .combined-reading { width: min(100%, 54rem); margin-inline: auto; padding: 1.25rem; }
    .detail-content { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem 2rem; }
    .detail-content .reflection { grid-column: 1 / -1; }
  }
</style>

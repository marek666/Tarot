<script lang="ts">
  import { DAILY_AREA_LABELS } from '../data/dailyInterpretations.ts'
  import { DAILY_AREAS, type DailyArea, type DailyCardState, type DailyInterpretation } from '../types/dailyCard.ts'
  import type { TarotCard } from '../types/tarot.ts'

  let {
    card,
    state,
    dateLabel,
    interpretation,
    favorite,
    onAreaChange,
    onToggleFavorite,
  }: {
    card: TarotCard
    state: DailyCardState
    dateLabel: string
    interpretation: DailyInterpretation
    favorite: boolean
    onAreaChange: (area: DailyArea) => void
    onToggleFavorite: () => void
  } = $props()

  const orientationLabel = $derived(
    state.orientation === 'reversed' ? 'Obrácená poloha' : 'Přímá poloha',
  )
  const classicMeaning = $derived(
    state.orientation === 'reversed' ? card.reversed : card.upright,
  )
</script>

<section
  class="daily-card"
  data-card-id={card.id}
  data-orientation={state.orientation}
  data-area={state.area}
  aria-labelledby="daily-card-title"
>
  <header class="daily-heading">
    <div>
      <p>Karta dne</p>
      <h2 id="daily-card-title">{dateLabel}</h2>
    </div>
    <span>Denní symbolický podnět</span>
  </header>

  <div class="daily-layout">
    <aside class="daily-visual">
      <div class="daily-card-name">
        <p>{orientationLabel}</p>
        <h3>{card.nameCs}</h3>
        <span>{card.nameEn}</span>
      </div>

      <figure>
        <img
          class:reversed={state.orientation === 'reversed'}
          src={card.image}
          alt={`Tarotová karta ${card.nameCs}, ${orientationLabel.toLocaleLowerCase('cs')}`}
          width="640"
          height="1110"
        />
      </figure>

      <button
        type="button"
        class="daily-favorite"
        aria-pressed={favorite}
        aria-label={favorite
          ? `Odebrat ${card.nameCs} z oblíbených`
          : `Přidat ${card.nameCs} do oblíbených`}
        onclick={onToggleFavorite}
      >
        <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
        {favorite ? 'V oblíbených' : 'Do oblíbených'}
      </button>
    </aside>

    <article class="daily-reading">
      <fieldset class="area-picker">
        <legend>Tematická oblast</legend>
        <div>
          {#each DAILY_AREAS as area}
            <button
              type="button"
              class:active={state.area === area}
              aria-pressed={state.area === area}
              onclick={() => onAreaChange(area)}
            >
              {DAILY_AREA_LABELS[area]}
            </button>
          {/each}
        </div>
      </fieldset>

      <section class="interpretation" aria-live="polite" aria-atomic="true">
        <p class="reading-label">{DAILY_AREA_LABELS[state.area]} · {orientationLabel}</p>

        <ul class="keywords" aria-label="Klíčová slova">
          {#each interpretation.keywords as keyword}<li>{keyword}</li>{/each}
        </ul>

        <h3>Výklad pro dnešek</h3>
        <p>{interpretation.summary}</p>

        <h3>Souvislost s tradičním významem</h3>
        <p>{interpretation.traditionalConnection}</p>

        <div class="reflection">
          <h3>Otázka k zamyšlení</h3>
          <p>{interpretation.reflectionQuestion}</p>
        </div>
      </section>

      <details class="classic-meaning">
        <summary>Otevřít klasický význam karty</summary>
        <div>
          <h3>{card.nameCs} — {orientationLabel.toLocaleLowerCase('cs')}</h3>
          <p>{classicMeaning.summary}</p>
          <p>{classicMeaning.description}</p>
        </div>
      </details>

      <p class="daily-note">
        Tarot není předpověď jisté budoucnosti. Karta dne nabízí symbolický pohled a otázku pro vlastní úvahu.
      </p>
    </article>
  </div>
</section>

<style>
  .daily-card {
    width: min(100%, 68rem);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .daily-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.8rem;
    border-bottom: 1px solid var(--border);
  }

  .daily-heading p,
  .reading-label {
    color: var(--gold);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .daily-heading h2 {
    margin: 0.2rem 0 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.4rem, 7vw, 2rem);
    font-weight: 400;
  }

  .daily-heading > span {
    display: none;
    color: var(--muted);
    font-size: 0.72rem;
  }

  .daily-layout,
  .daily-visual,
  .daily-reading {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .daily-layout { gap: 1.25rem; }
  .daily-visual { align-items: center; gap: 0.8rem; }
  .daily-reading { gap: 1rem; }

  .daily-card-name { text-align: center; }

  .daily-card-name p {
    color: var(--gold);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .daily-card-name h3 {
    margin: 0.2rem 0 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.7rem;
    font-weight: 400;
  }

  .daily-card-name span {
    color: var(--muted);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  figure {
    width: min(100%, 20rem);
    margin: 0;
    overflow: hidden;
    background: #050b13;
    border: 1px solid rgb(216 184 108 / 42%);
    border-radius: 0.85rem;
    box-shadow: 0 1.4rem 3.8rem rgb(0 0 0 / 34%);
  }

  figure img {
    width: 100%;
    height: auto;
    display: block;
  }

  figure img.reversed { transform: rotate(180deg); }

  .daily-favorite {
    min-width: 10rem;
    min-height: 44px;
    padding: 0.55rem 0.9rem;
    color: var(--gold);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 0.7rem;
    cursor: pointer;
    font-size: 0.78rem;
  }

  .daily-favorite[aria-pressed='true'] { background: rgb(216 184 108 / 12%); }

  .area-picker {
    margin: 0;
    padding: 0;
    border: 0;
  }

  .area-picker legend {
    margin-bottom: 0.45rem;
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 700;
  }

  .area-picker > div {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem;
  }

  .area-picker button {
    min-width: 0;
    min-height: 44px;
    padding: 0.55rem 0.45rem;
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

  .interpretation {
    padding: 1rem;
    background: rgb(13 26 43 / 74%);
    border: 1px solid var(--border);
    border-radius: 0.85rem;
  }

  .interpretation h3,
  .classic-meaning h3 {
    margin: 1.1rem 0 0.35rem;
    color: var(--gold);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.05rem;
    font-weight: 400;
  }

  .interpretation p,
  .classic-meaning p,
  .daily-note {
    overflow-wrap: anywhere;
    color: var(--text);
    font-size: 0.9rem;
    line-height: 1.65;
  }

  .keywords {
    margin: 0.8rem 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
  }

  .keywords li {
    padding: 0.3rem 0.55rem;
    color: #ead8a4;
    background: rgb(216 184 108 / 9%);
    border: 1px solid rgb(216 184 108 / 24%);
    border-radius: 999px;
    font-size: 0.68rem;
  }

  .reflection {
    margin-top: 1.1rem;
    padding: 0.15rem 0 0.15rem 0.85rem;
    border-left: 3px solid var(--gold);
  }

  .reflection h3 { margin-top: 0; }

  .classic-meaning {
    background: rgb(13 26 43 / 58%);
    border: 1px solid var(--border);
    border-radius: 0.8rem;
  }

  .classic-meaning summary {
    min-height: 44px;
    padding: 0.72rem 0.85rem;
    color: var(--gold);
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .classic-meaning > div {
    padding: 0 0.85rem 0.9rem;
    border-top: 1px solid var(--border);
  }

  .classic-meaning h3 { margin-top: 0.8rem; }
  .classic-meaning p + p { margin-top: 0.65rem; }

  .daily-note {
    color: var(--muted);
    font-size: 0.72rem;
    text-align: center;
  }

  button:focus-visible,
  summary:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 3px;
  }

  @media (min-width: 600px) {
    .daily-heading > span { display: inline; }
    .area-picker > div { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  @media (min-width: 900px) {
    .daily-layout {
      display: grid;
      grid-template-columns: minmax(17rem, 21rem) minmax(0, 1fr);
      align-items: start;
      gap: clamp(2rem, 5vw, 4rem);
    }

    .daily-visual {
      position: sticky;
      top: 1rem;
    }

    .daily-card-name h3 { font-size: 2rem; }
    .interpretation { padding: 1.25rem; }
  }

  @media (min-width: 900px) and (max-height: 820px) {
    .daily-visual { position: static; }
  }
</style>

<script lang="ts">
  import CardPicker from './CardPicker.svelte'
  import type { FoolsJourneyChapter, FoolsJourneySection } from '../types/foolsJourney.ts'
  import type { TarotCard } from '../types/tarot.ts'

  let {
    chapter,
    card,
    index,
    chapters,
    cards,
    onSelect,
    onPrevious,
    onNext,
    onStartOver,
    onExit,
    favoriteCardIds,
    favorite,
    onToggleFavorite,
  }: {
    chapter: FoolsJourneyChapter
    card: TarotCard
    index: number
    chapters: readonly FoolsJourneyChapter[]
    cards: readonly TarotCard[]
    onSelect: (index: number) => void
    onPrevious: () => void
    onNext: () => void
    onStartOver: () => void
    onExit: () => void
    favoriteCardIds: readonly string[]
    favorite: boolean
    onToggleFavorite: () => void
  } = $props()

  const sectionLabels: Record<FoolsJourneySection, string> = {
    intro: 'Úvod',
    outer: 'Část I — Vnější svět',
    inner: 'Část II — Vnitřní svět',
    transformation: 'Část III — Proměna',
  }
  const numerals = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
  let meaningOpen = $state(false)
  let meaningReturnScrollY = 0

  function selectJourneyCard(cardId: string): void {
    const chapterIndex = chapters.findIndex((item) => item.cardId === cardId)
    if (chapterIndex >= 0) onSelect(chapterIndex)
  }

  function toggleClassicMeaning(): void {
    if (!meaningOpen) {
      meaningReturnScrollY = window.scrollY
      meaningOpen = true
      return
    }

    meaningOpen = false
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: meaningReturnScrollY, behavior: 'auto' })
    })
  }
</script>

<section class="journey" aria-labelledby="journey-chapter-title">
  <header class="journey-overview">
    <div>
      <p class="journey-label">Cesta Blázna</p>
      <p class="journey-position">Kapitola {index + 1}/22 · {numerals[index]} {card.nameCs}</p>
    </div>

    <div class="journey-toolbar">
      <button type="button" class="quiet-button" onclick={onExit}>← Zpět</button>
      <button type="button" class="quiet-button" onclick={onStartOver} disabled={index === 0}>Od začátku</button>
    </div>
  </header>

  <details class="journey-introduction" open={index === 0}>
    <summary>Co je Cesta Blázna</summary>
    <p>
      Cesta Blázna je moderní výukový způsob, jak číst 22 Velkých arkán jako symbolický příběh lidského zrání. Není doloženým původním příběhem tarotu ani jediným správným výkladem. Pomáhá však spojit významy karet do souvislostí a lépe si pamatovat, jak na sebe jejich témata navazují.
    </p>
  </details>

  <CardPicker
    cards={cards}
    currentCardId={card.id}
    onSelect={selectJourneyCard}
    triggerLabel={`Vybrat kapitolu · ${index + 1}/22`}
    dialogTitle="Vybrat kapitolu Cesty Blázna"
    favoriteCardIds={favoriteCardIds}
    wide
  />

  <div id="journey-chapter-start" class="chapter-layout">
    <aside class="chapter-aside">
      <header class="card-meta">
        <p class="chapter-section">{sectionLabels[chapter.section]}</p>
        <p class="card-title"><span>{numerals[index]}</span> {card.nameCs}</p>
        <p class="chapter-number">Kapitola {index + 1} z 22</p>
        <button type="button" class="journey-favorite" aria-pressed={favorite} aria-label={favorite ? `Odebrat ${card.nameCs} z oblíbených` : `Přidat ${card.nameCs} do oblíbených`} onclick={onToggleFavorite}>
          <span aria-hidden="true">{favorite ? '★' : '☆'}</span> {favorite ? 'V oblíbených' : 'Do oblíbených'}
        </button>
      </header>

      <figure>
        <img src={card.image} alt={`Tarotová karta ${card.nameCs}`} width="640" height="1110" />
        <figcaption>{numerals[index]} — {card.nameCs}</figcaption>
      </figure>
    </aside>

    <article class="chapter-content">
      <header class="chapter-heading">
        <p>{sectionLabels[chapter.section]}</p>
        <h2 id="journey-chapter-title">{chapter.chapterTitle}</h2>
        <span>{numerals[index]} — {card.nameCs}</span>
      </header>

      <section class="story-section" aria-labelledby="journey-story-title">
        <h3 id="journey-story-title">Příběh</h3>
        <p class="story">{chapter.story}</p>
      </section>

      <section class="lesson" aria-labelledby="journey-lesson-title">
        <h3 id="journey-lesson-title">Co se Blázen naučil</h3>
        <p>{chapter.lesson}</p>
      </section>

      <section class="symbols" aria-labelledby="journey-symbols-title">
        <h3 id="journey-symbols-title">Symboly na kartě</h3>
        <dl>
          {#each chapter.symbols as symbol}
            <div>
              <dt>{symbol.name}</dt>
              <dd>{symbol.meaning}</dd>
            </div>
          {/each}
        </dl>
      </section>

      <section class="journey-keywords" aria-labelledby="journey-keywords-title">
        <h3 id="journey-keywords-title">Klíčová slova</h3>
        <ul>
          {#each chapter.keywords as keyword}<li>{keyword}</li>{/each}
        </ul>
      </section>

      <section class="connections" aria-labelledby="journey-connections-title">
        <h3 id="journey-connections-title">Návaznost</h3>
        <p><strong>Předchozí:</strong> {chapter.previousConnection}</p>
        <p><strong>Následující:</strong> {chapter.nextConnection}</p>
      </section>

      <section class="classic-meaning">
        <button
          type="button"
          aria-expanded={meaningOpen}
          aria-controls="classic-card-meaning"
          onclick={toggleClassicMeaning}
        >
          {meaningOpen ? 'Zpět k příběhu' : 'Otevřít klasický význam'}
          <span class:expanded={meaningOpen} aria-hidden="true">⌄</span>
        </button>
        {#if meaningOpen}
          <div id="classic-card-meaning">
            <h3>{card.nameCs} — přímá poloha</h3>
            <ul>
              {#each card.upright.keywords as keyword}<li>{keyword}</li>{/each}
            </ul>
            <p>{card.upright.summary}</p>
            <p>{card.upright.description}</p>
          </div>
        {/if}
      </section>
    </article>
  </div>

  <nav class="journey-navigation" aria-label="Procházení Cesty Blázna">
    <button type="button" onclick={onPrevious} disabled={index === 0}>← Předchozí</button>
    <button type="button" class="next" onclick={onNext} disabled={index === chapters.length - 1}>
      Další →
    </button>
  </nav>
</section>

<style>
  .journey {
    width: min(100%, 52rem);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .journey-overview {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .journey-label {
    color: var(--gold);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.25rem;
  }

  .journey-position {
    margin-top: 0.2rem;
    color: var(--muted);
    font-size: 0.68rem;
  }

  .journey-toolbar,
  .journey-navigation {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }

  button {
    min-height: 44px;
    cursor: pointer;
  }

  button:focus-visible,
  summary:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 3px;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .quiet-button {
    padding: 0.55rem 0.8rem;
    color: var(--muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 0.7rem;
  }

  .journey-introduction,
  .classic-meaning {
    background: rgb(13 26 43 / 78%);
    border: 1px solid var(--border);
    border-radius: 0.8rem;
  }

  details > summary,
  .classic-meaning > button {
    min-height: 44px;
    padding: 0.7rem 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    color: var(--gold);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 700;
    list-style: none;
  }

  details > summary::-webkit-details-marker {
    display: none;
  }

  details > summary::after {
    content: '+';
    font-size: 1rem;
    font-weight: 400;
  }

  details[open] > summary::after {
    content: '−';
  }

  .journey-introduction p {
    padding: 0 0.85rem 0.85rem;
    color: var(--muted);
    font-size: 0.78rem;
    line-height: 1.55;
  }

  .card-meta {
    text-align: center;
  }

  .journey-favorite {
    min-height: 44px;
    margin-top: 0.5rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.7rem;
    color: var(--gold);
    background: transparent;
    cursor: pointer;
  }

  .journey-favorite[aria-pressed='true'] { background: rgb(216 184 108 / 12%); }

  .chapter-section {
    color: var(--gold);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .chapter-number {
    margin-top: 0.35rem;
    color: var(--muted);
    font-size: 0.7rem;
  }

  .card-title {
    margin-top: 0.3rem;
    color: var(--text);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.25rem;
  }

  .card-title span {
    color: var(--gold);
  }

  h2 {
    margin: 0.35rem 0 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.6rem, 8vw, 2.35rem);
    font-weight: 400;
    line-height: 1.1;
  }

  .chapter-layout {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    scroll-margin-top: 1rem;
  }

  .chapter-aside,
  .chapter-content {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  figure {
    width: min(100%, 17rem);
    margin: 0 auto;
  }

  figure img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 0.8rem;
    outline: 1px solid rgb(216 184 108 / 40%);
    box-shadow: 0 1.2rem 3rem rgb(0 0 0 / 34%);
  }

  figcaption {
    margin-top: 0.45rem;
    color: var(--muted);
    font-size: 0.68rem;
    text-align: center;
  }

  .story-section {
    display: grid;
    gap: 0.65rem;
  }

  .chapter-heading {
    padding-bottom: 0.9rem;
    border-bottom: 1px solid var(--border);
  }

  .chapter-heading > p {
    color: var(--gold);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .chapter-heading > span {
    margin-top: 0.45rem;
    display: block;
    color: var(--muted);
    font-size: 0.72rem;
  }

  .story {
    max-width: 72ch;
    color: var(--text);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1rem, 4.5vw, 1.12rem);
    line-height: 1.72;
  }

  h3 {
    margin: 0;
    color: var(--gold);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1rem;
    font-weight: 400;
  }

  .lesson,
  .symbols,
  .connections {
    padding: 0.95rem 0;
    border-top: 1px solid var(--border);
  }

  .lesson {
    padding: 0.9rem 1rem;
    background: rgb(216 184 108 / 7%);
    border: 0;
    border-left: 3px solid var(--gold-soft);
    border-radius: 0 0.6rem 0.6rem 0;
  }

  .lesson p,
  .connections p,
  .classic-meaning p {
    margin: 0.55rem 0 0;
    color: var(--muted);
    font-size: 0.8rem;
    line-height: 1.55;
  }

  .symbols dl {
    margin: 0.65rem 0 0;
    display: grid;
    gap: 0.7rem;
  }

  .symbols dl > div {
    padding-top: 0.65rem;
    border-top: 1px solid var(--border);
  }

  .symbols dl > div:first-child {
    padding-top: 0;
    border-top: 0;
  }

  .symbols dt {
    color: var(--text);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .symbols dd {
    margin: 0.2rem 0 0;
    color: var(--muted);
    font-size: 0.76rem;
    line-height: 1.5;
  }

  .journey-keywords {
    text-align: center;
  }

  .journey-keywords ul,
  .classic-meaning ul {
    margin: 0.65rem 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
    list-style: none;
  }

  .journey-keywords li,
  .classic-meaning li {
    padding: 0.32rem 0.58rem;
    color: #ead8ad;
    background: rgb(216 184 108 / 9%);
    border: 1px solid rgb(216 184 108 / 25%);
    border-radius: 999px;
    font-size: 0.7rem;
  }

  .connections p + p {
    padding-top: 0.65rem;
    border-top: 1px solid var(--border);
  }

  .connections strong {
    color: var(--text);
  }

  .classic-meaning > button {
    width: 100%;
    color: var(--gold);
    background: transparent;
    border: 0;
    text-align: left;
  }

  .classic-meaning > button span {
    transition: transform 160ms ease;
  }

  .classic-meaning > button span.expanded {
    transform: rotate(180deg);
  }

  #classic-card-meaning {
    padding: 0 0.9rem 0.9rem;
  }

  .journey-navigation button {
    min-width: 0;
    padding: 0.7rem 0.8rem;
    color: var(--text);
    background: var(--surface-light);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    font-weight: 700;
  }

  .journey-navigation .next {
    color: #101722;
    background: var(--gold);
    border-color: var(--gold);
  }

  @media (min-width: 601px) {
    .journey {
      width: 100%;
      gap: 1.1rem;
    }

    .journey-overview {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .journey-toolbar {
      width: min(22rem, 52%);
    }

    figure {
      width: min(100%, 18rem);
    }

    .chapter-content {
      gap: 1.15rem;
    }
  }

  @media (min-width: 900px) {
    .chapter-layout {
      display: grid;
      grid-template-columns: minmax(16rem, 18rem) minmax(0, 1fr);
      align-items: start;
      gap: clamp(2rem, 4vw, 3rem);
    }

    figure {
      width: 100%;
    }

    .card-meta {
      text-align: left;
    }

    .symbols dl {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 1.25rem;
    }

    .symbols dl > div:nth-child(2) {
      padding-top: 0;
      border-top: 0;
    }

    .journey-keywords {
      text-align: left;
    }

    .journey-keywords ul,
    .classic-meaning ul {
      justify-content: flex-start;
    }
  }

  @media (min-width: 1100px) {
    .journey {
      width: min(100%, 80rem);
      gap: 1.15rem;
    }

    .chapter-layout {
      grid-template-columns: minmax(20rem, 24rem) minmax(0, 1fr);
      gap: clamp(2rem, 4vw, 3.75rem);
    }

    .chapter-aside {
      align-self: start;
    }

    .chapter-content {
      width: 100%;
      max-width: 50rem;
      gap: 1.25rem;
    }

    h2 {
      font-size: clamp(2.1rem, 3vw, 3rem);
    }

    figure {
      width: min(100%, 22rem);
      margin-left: 0;
    }

    .story {
      font-size: 1.12rem;
    }

  }

  @media (min-width: 1100px) and (min-height: 900px) {
    .chapter-aside {
      position: sticky;
      top: 1rem;
    }
  }
</style>

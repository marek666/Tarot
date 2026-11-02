<script lang="ts">
  import type { SpreadCardState, SpreadPositionDefinition } from '../types/spread.ts'
  import type { TarotCard } from '../types/tarot.ts'

  let {
    card,
    state,
    position,
    active,
    onActivate,
  }: {
    card: TarotCard
    state: SpreadCardState
    position: SpreadPositionDefinition
    active: boolean
    onActivate: () => void
  } = $props()

  const orientationLabel = $derived(
    state.orientation === 'reversed' ? 'obrácená poloha' : 'přímá poloha',
  )
</script>

<article
  class="spread-card"
  class:active
  data-card-id={card.id}
  data-orientation={state.orientation}
  data-revealed={state.revealed}
>
  <header>
    <h3>{position.shortTitle}</h3>
    <p>{state.revealed ? card.nameCs : 'Skrytá karta'}</p>
  </header>

  <button
    type="button"
    class="card-stage"
    aria-pressed={active}
    aria-label={state.revealed
      ? `${position.title}: ${card.nameCs}, ${orientationLabel}. Zobrazit detail.`
      : `${position.title}: odhalit kartu`}
    onclick={onActivate}
  >
    <span class="card-inner" class:revealed={state.revealed}>
      <span class="card-face card-back" aria-hidden={state.revealed}>
        <span class="back-border"><span>✦</span></span>
      </span>
      <span class="card-face card-front" aria-hidden={!state.revealed}>
        <img
          class:reversed={state.orientation === 'reversed'}
          src={card.image}
          alt=""
          width="640"
          height="1110"
          draggable="false"
        />
      </span>
    </span>
  </button>

  <p class="position-state">
    {state.revealed
      ? state.orientation === 'reversed' ? 'Obrácená' : 'Přímá'
      : 'Klepnutím odhalit'}
  </p>
</article>

<style>
  .spread-card {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.35rem;
  }

  header {
    min-height: 2.5rem;
    text-align: center;
  }

  h3 {
    margin: 0;
    overflow-wrap: anywhere;
    color: var(--gold);
    font-size: clamp(0.62rem, 2.8vw, 0.82rem);
    line-height: 1.15;
  }

  header p,
  .position-state {
    margin: 0.18rem 0 0;
    overflow-wrap: anywhere;
    color: var(--muted);
    font-size: clamp(0.52rem, 2.4vw, 0.68rem);
    line-height: 1.2;
  }

  .card-stage {
    width: 100%;
    min-width: 0;
    aspect-ratio: 640 / 1110;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0.65rem;
    perspective: 70rem;
    cursor: pointer;
    touch-action: manipulation;
  }

  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    display: block;
    transform-style: preserve-3d;
    transition: transform 560ms cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  .card-inner.revealed { transform: rotateY(180deg); }

  .card-face {
    position: absolute;
    inset: 0;
    display: block;
    overflow: hidden;
    background: #081321;
    border: 1px solid rgb(216 184 108 / 42%);
    border-radius: 0.65rem;
    box-shadow: 0 0.8rem 2rem rgb(0 0 0 / 28%);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .card-front { transform: rotateY(180deg); }

  .card-front img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }

  .card-front img.reversed { transform: rotate(180deg); }

  .card-back {
    padding: 0.35rem;
    background:
      radial-gradient(circle at center, rgb(216 184 108 / 18%), transparent 42%),
      repeating-linear-gradient(45deg, #0b1a2d 0 8px, #0e2239 8px 16px);
  }

  .back-border {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--gold);
    border: 1px solid rgb(216 184 108 / 52%);
    border-radius: 0.42rem;
  }

  .back-border span {
    width: clamp(1.5rem, 45%, 4rem);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border: 1px solid rgb(216 184 108 / 55%);
    border-radius: 50%;
    font-size: clamp(0.8rem, 5vw, 1.6rem);
  }

  .spread-card.active .card-face {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px rgb(216 184 108 / 20%), 0 0.8rem 2rem rgb(0 0 0 / 32%);
  }

  .card-stage:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 3px;
  }

  .position-state {
    min-height: 1.4rem;
    margin-top: 0;
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .card-inner { transition-duration: 0.01ms; }
  }
</style>

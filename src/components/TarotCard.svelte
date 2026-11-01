<script lang="ts">
  import { onDestroy } from 'svelte'
  import { getMeaningForOrientation } from '../lib/studyProgress.ts'
  import { getSwipeDirection, type SwipeDirection } from '../lib/swipeGesture.ts'
  import type { TarotCard as TarotCardData } from '../types/tarot.ts'
  import type { CardOrientation } from '../types/trainer.ts'

  let {
    card,
    orientation,
    onNavigate,
    studyMode = false,
    revealed = false,
  }: {
    card: TarotCardData
    orientation: CardOrientation
    onNavigate: (direction: SwipeDirection) => void
    studyMode?: boolean
    revealed?: boolean
  } = $props()

  const meaning = $derived(getMeaningForOrientation(card, orientation))
  const orientationLabel = $derived(orientation === 'reversed' ? 'Obrácená poloha' : 'Přímá poloha')

  let isFlipped = $state(false)
  let isAnimating = $state(false)
  let frontButton: HTMLButtonElement | undefined
  let backButton: HTMLButtonElement | undefined
  let unlockTimer: number | undefined
  let suppressClickTimer: number | undefined
  let suppressNextClick = false
  let gestureStart:
    | {
        pointerId: number
        x: number
        y: number
        time: number
        currentX: number
        currentY: number
        currentTime: number
      }
    | undefined

  function unlockFlip(): void {
    isAnimating = false
    if (unlockTimer !== undefined) {
      window.clearTimeout(unlockTimer)
      unlockTimer = undefined
    }
  }

  function setFlipped(nextFlipped: boolean): void {
    if (isAnimating || isFlipped === nextFlipped) return

    isAnimating = true
    isFlipped = nextFlipped

    if (!studyMode) {
      window.requestAnimationFrame(() => {
        const visibleButton = isFlipped ? backButton : frontButton
        visibleButton?.focus({ preventScroll: true })
      })
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.requestAnimationFrame(unlockFlip)
      return
    }

    unlockTimer = window.setTimeout(unlockFlip, 750)
  }

  function flipCard(event: MouseEvent): void {
    if (suppressNextClick) {
      event.preventDefault()
      suppressNextClick = false
      return
    }

    if (studyMode) return
    setFlipped(!isFlipped)
  }

  function finishAnimation(event: TransitionEvent): void {
    if (event.target === event.currentTarget && event.propertyName === 'transform') {
      unlockFlip()
    }
  }

  function handlePointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.pointerType === 'mouse') return

    const stage = event.currentTarget as HTMLElement
    stage.setPointerCapture(event.pointerId)

    gestureStart = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
      currentX: event.clientX,
      currentY: event.clientY,
      currentTime: event.timeStamp,
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!gestureStart || gestureStart.pointerId !== event.pointerId) return

    gestureStart.currentX = event.clientX
    gestureStart.currentY = event.clientY
    gestureStart.currentTime = event.timeStamp
  }

  function finishGesture(stage: HTMLElement, x: number, y: number, time: number): boolean {
    if (!gestureStart) return false

    const direction = getSwipeDirection({
      deltaX: x - gestureStart.x,
      deltaY: y - gestureStart.y,
      durationMs: time - gestureStart.time,
      surfaceWidth: stage.getBoundingClientRect().width,
    })
    gestureStart = undefined

    if (!direction) return false

    suppressNextClick = true
    if (suppressClickTimer !== undefined) window.clearTimeout(suppressClickTimer)
    suppressClickTimer = window.setTimeout(() => {
      suppressNextClick = false
      suppressClickTimer = undefined
    }, 450)
    onNavigate(direction)
    return true
  }

  function handlePointerUp(event: PointerEvent): void {
    if (!gestureStart || gestureStart.pointerId !== event.pointerId) return

    const stage = event.currentTarget as HTMLElement
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId)
    if (finishGesture(stage, event.clientX, event.clientY, event.timeStamp)) event.preventDefault()
  }

  function cancelGesture(event: PointerEvent): void {
    if (!gestureStart || gestureStart.pointerId !== event.pointerId) return

    const stage = event.currentTarget as HTMLElement
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId)
    finishGesture(
      stage,
      gestureStart.currentX,
      gestureStart.currentY,
      gestureStart.currentTime,
    )
  }

  $effect(() => {
    if (studyMode && revealed) setFlipped(true)
  })

  onDestroy(() => {
    if (unlockTimer !== undefined) window.clearTimeout(unlockTimer)
    if (suppressClickTimer !== undefined) window.clearTimeout(suppressClickTimer)
  })
</script>

<article class="tarot-card" aria-label={`${card.nameCs}, ${card.nameEn}, ${orientationLabel}`}>
  <header class="card-title" aria-live="polite">
    <h2>{card.nameCs}</h2>
    <p>{card.nameEn}</p>
  </header>

  <div
    class="card-stage"
    role="group"
    aria-label="Dotyková plocha karty; přejetím vlevo nebo vpravo listujete balíčkem"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={cancelGesture}
  >
    <div
      class:flipped={isFlipped}
      class:animating={isAnimating}
      class="card-inner"
      aria-busy={isAnimating}
      ontransitionend={finishAnimation}
      ontransitioncancel={unlockFlip}
    >
      <button
        bind:this={frontButton}
        type="button"
        class:study-front={studyMode}
        class="card-face card-front"
        aria-label={studyMode
          ? `Karta ${card.nameCs}, ${orientationLabel.toLocaleLowerCase('cs')}; význam odhalíte tlačítkem pod kartou`
          : `Otočit kartu ${card.nameCs}, ${orientationLabel.toLocaleLowerCase('cs')}, a zobrazit význam`}
        aria-hidden={isFlipped}
        aria-disabled={studyMode}
        disabled={isFlipped}
        onclick={flipCard}
      >
        <img
          class:reversed={orientation === 'reversed'}
          src={card.image}
          alt={`Tarotová karta ${card.nameCs}, ${orientationLabel.toLocaleLowerCase('cs')}`}
          width="640"
          height="1110"
          draggable="false"
        />
      </button>

      <section class="card-face card-back" aria-hidden={!isFlipped} inert={!isFlipped}>
        <button
          bind:this={backButton}
          type="button"
          class="back-flip-target"
          aria-label={`Otočit kartu ${card.nameCs} zpět na ilustraci`}
          disabled={!isFlipped || studyMode}
          onclick={flipCard}
        ></button>

        <div class="meaning-content">
          <p class="meaning-label">{orientationLabel}</p>
          <h3>{card.nameCs}</h3>

          <ul class="keywords" aria-label="Klíčová slova">
            {#each meaning.keywords as keyword}
              <li>{keyword}</li>
            {/each}
          </ul>

          <p class="meaning-summary">{meaning.summary}</p>

          <details>
            <summary>Podrobný výklad</summary>
            <p>{meaning.description}</p>
          </details>

          {#if !studyMode}
            <p class="flip-hint" aria-hidden="true">Klepnutím mimo výklad otočíte zpět</p>
          {/if}
        </div>
      </section>
    </div>
  </div>
</article>

<style>
  .tarot-card {
    width: min(100%, 21rem);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.7rem;
  }

  .card-title {
    min-width: 0;
    text-align: center;
  }

  .card-title h2 {
    margin: 0;
    overflow-wrap: anywhere;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.35rem, 6vw, 1.7rem);
    font-weight: 400;
    line-height: 1.1;
  }

  .card-title p {
    margin: 0.22rem 0 0;
    color: var(--muted);
    font-size: 0.66rem;
    letter-spacing: 0.12em;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .card-stage {
    width: 100%;
    aspect-ratio: 640 / 1110;
    perspective: 90rem;
    touch-action: pan-y;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 650ms cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  .card-inner.flipped {
    transform: rotateY(180deg);
  }

  .card-face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    color: var(--text);
    background: #0b1727;
    border: 0;
    border-radius: 0.85rem;
    outline: 1px solid rgb(216 184 108 / 44%);
    box-shadow: 0 1.4rem 3.8rem rgb(0 0 0 / 36%);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  button.card-face,
  .back-flip-target {
    padding: 0;
    cursor: pointer;
    appearance: none;
  }

  button.card-face:disabled,
  .back-flip-target:disabled {
    cursor: default;
  }

  .card-front {
    display: block;
  }

  .card-front.study-front {
    cursor: default;
  }

  .card-front img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    user-select: none;
  }

  .card-front img.reversed {
    transform: rotate(180deg);
  }

  .card-back {
    transform: rotateY(180deg);
    background:
      radial-gradient(circle at 50% 0%, rgb(41 70 104 / 64%), transparent 42%),
      #0b1727;
  }

  .card-back::before {
    position: absolute;
    inset: 0.55rem;
    content: '';
    pointer-events: none;
    border: 1px solid rgb(216 184 108 / 24%);
    border-radius: 0.7rem;
  }

  .back-flip-target {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    min-width: 44px;
    min-height: 44px;
    color: inherit;
    background: transparent;
    border: 0;
  }

  .meaning-content {
    position: absolute;
    inset: 0;
    z-index: 2;
    padding: clamp(1.3rem, 6vw, 2rem) clamp(1.15rem, 6vw, 1.8rem) 1.25rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    text-align: center;
    scrollbar-width: thin;
    pointer-events: none;
    overflow-wrap: anywhere;
  }

  .meaning-label {
    color: var(--gold);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  h3 {
    margin: 0.5rem 0 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1.65rem, 8vw, 2.1rem);
    font-weight: 400;
    line-height: 1.1;
  }

  .keywords {
    margin: 1rem 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.42rem;
    list-style: none;
  }

  .keywords li {
    padding: 0.32rem 0.58rem;
    color: #ead8ad;
    background: rgb(216 184 108 / 9%);
    border: 1px solid rgb(216 184 108 / 25%);
    border-radius: 999px;
    font-size: 0.72rem;
    line-height: 1.25;
  }

  .meaning-summary {
    margin: 1.1rem 0 0;
    color: var(--text);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(1rem, 4.6vw, 1.16rem);
    line-height: 1.55;
  }

  details {
    position: relative;
    z-index: 3;
    margin-top: 1.05rem;
    text-align: left;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    pointer-events: auto;
  }

  summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    color: var(--gold);
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: '+';
    font-size: 1rem;
    font-weight: 400;
  }

  details[open] summary::after {
    content: '−';
  }

  details p {
    margin: 0 0 0.9rem;
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.55;
  }

  .flip-hint {
    margin: 1rem 0 0;
    color: #728095;
    font-size: 0.68rem;
    line-height: 1.4;
  }

  .card-front:focus-visible,
  .back-flip-target:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 4px;
  }

  .card-inner.animating .card-face {
    pointer-events: none;
  }

  @media (max-width: 359px) {
    .tarot-card {
      width: min(100%, 17.5rem);
    }

    .card-title h2 {
      font-size: 1.35rem;
    }

    .meaning-content {
      padding: 1.15rem 1rem 1rem;
    }

    .keywords {
      margin-top: 0.75rem;
      gap: 0.32rem;
    }

    .meaning-summary {
      margin-top: 0.85rem;
      font-size: 0.96rem;
      line-height: 1.45;
    }

    details {
      margin-top: 0.8rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-inner {
      transition-duration: 0.01ms;
    }
  }
</style>

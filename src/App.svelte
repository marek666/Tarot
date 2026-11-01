<script lang="ts">
  import { onMount } from 'svelte'
  import AppHeader from './components/AppHeader.svelte'
  import PwaUpdatePrompt from './components/PwaUpdatePrompt.svelte'
  import TarotCard from './components/TarotCard.svelte'
  import { tarotDeck } from './data/tarotDeck.ts'
  import {
    chooseCardOrientation,
    createDeckOrder,
    type CardOrientation,
  } from './lib/deckModes.ts'
  import { getNextIndex, getPreviousIndex } from './lib/deckNavigation.ts'
  import type { SwipeDirection } from './lib/swipeGesture.ts'
  import type { TarotSuit } from './types/tarot.ts'

  const SETTINGS_KEY = 'tarot-trainer:settings'
  const suitLabels: Record<TarotSuit, string> = {
    wands: 'Hole',
    cups: 'Poháry',
    swords: 'Meče',
    pentacles: 'Pentakly',
  }

  let shuffleEnabled = $state(false)
  let reversedEnabled = $state(false)
  let deckOrder = $state([...tarotDeck])
  let orientations = $state<CardOrientation[]>(['upright'])
  let currentIndex = $state(0)
  let cardViewKey = $state(0)

  const currentCard = $derived(deckOrder[currentIndex]!)
  const currentOrientation = $derived(orientations[currentIndex] ?? 'upright')
  const progress = $derived(`${currentIndex + 1}/${deckOrder.length}`)
  const groupLabel = $derived(
    currentCard.arcana === 'major' ? 'Velká arkána' : suitLabels[currentCard.suit!],
  )
  const shuffleComplete = $derived(shuffleEnabled && currentIndex === deckOrder.length - 1)

  function readSettings(): { shuffle: boolean; reversed: boolean } {
    try {
      const stored = window.localStorage.getItem(SETTINGS_KEY)
      if (!stored) return { shuffle: false, reversed: false }

      const value = JSON.parse(stored) as Record<string, unknown>
      return {
        shuffle: value.shuffle === true,
        reversed: value.reversed === true,
      }
    } catch {
      return { shuffle: false, reversed: false }
    }
  }

  function saveSettings(): void {
    try {
      window.localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ shuffle: shuffleEnabled, reversed: reversedEnabled }),
      )
    } catch {
      // Aplikace zůstává funkční i při blokovaném localStorage.
    }
  }

  function beginTraversal(): void {
    deckOrder = createDeckOrder(tarotDeck, shuffleEnabled)
    orientations = [chooseCardOrientation(reversedEnabled)]
    currentIndex = 0
    cardViewKey += 1
  }

  function updateShuffle(enabled: boolean): void {
    shuffleEnabled = enabled
    saveSettings()
    beginTraversal()
  }

  function updateReversed(enabled: boolean): void {
    reversedEnabled = enabled
    saveSettings()
    beginTraversal()
  }

  function showPrevious(): void {
    if (shuffleEnabled) return

    const previousIndex = getPreviousIndex(currentIndex)
    if (previousIndex === currentIndex) return

    currentIndex = previousIndex
    cardViewKey += 1
  }

  function showNext(): void {
    if (currentIndex === deckOrder.length - 1) {
      if (shuffleEnabled) beginTraversal()
      return
    }

    const nextIndex = getNextIndex(currentIndex, deckOrder.length)
    if (orientations[nextIndex] === undefined) {
      orientations[nextIndex] = chooseCardOrientation(reversedEnabled)
    }
    currentIndex = nextIndex
    cardViewKey += 1
  }

  function navigateBySwipe(direction: SwipeDirection): void {
    if (direction === 'next') showNext()
    else showPrevious()
  }

  function handleKeyboardNavigation(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return

    const target = event.target as HTMLElement | null
    if (target?.closest('details, input, textarea, select')) return

    if (event.key === 'ArrowLeft' && !shuffleEnabled && currentIndex > 0) {
      event.preventDefault()
      showPrevious()
    }

    if (
      event.key === 'ArrowRight' &&
      (shuffleEnabled || currentIndex < deckOrder.length - 1)
    ) {
      event.preventDefault()
      showNext()
    }
  }

  onMount(() => {
    const settings = readSettings()
    shuffleEnabled = settings.shuffle
    reversedEnabled = settings.reversed
    beginTraversal()
  })
</script>

<svelte:head>
  <meta
    name="description"
    content="Tarot Trainer je jednoduchá mobilní aplikace pro postupné učení tarotových karet."
  />
</svelte:head>

<svelte:window onkeydown={handleKeyboardNavigation} />

<div class="app-shell">
  <AppHeader {progress} />

  <main class="trainer">
    <fieldset class="mode-controls">
      <legend class="visually-hidden">Režimy procházení balíčku</legend>

      <label class:active={shuffleEnabled} class="mode-toggle">
        <span class="mode-copy">
          <strong>Shuffle</strong>
          <small>{shuffleEnabled ? 'Zamícháno' : 'Tradiční pořadí'}</small>
        </span>
        <input
          type="checkbox"
          checked={shuffleEnabled}
          onchange={(event) => updateShuffle(event.currentTarget.checked)}
        />
        <span class="switch" aria-hidden="true"></span>
      </label>

      <label class:active={reversedEnabled} class="mode-toggle">
        <span class="mode-copy">
          <strong>Reversed</strong>
          <small>{reversedEnabled ? '50 % obráceně' : 'Jen přímé karty'}</small>
        </span>
        <input
          type="checkbox"
          checked={reversedEnabled}
          onchange={(event) => updateReversed(event.currentTarget.checked)}
        />
        <span class="switch" aria-hidden="true"></span>
      </label>
    </fieldset>

    <div class="card-context" aria-live="polite">
      <p>{groupLabel}</p>
      <span>{currentOrientation === 'reversed' ? 'Obrácená poloha' : 'Přímá poloha'}</span>
    </div>

    {#key cardViewKey}
      <TarotCard
        card={currentCard}
        orientation={currentOrientation}
        onNavigate={navigateBySwipe}
      />
    {/key}

    <nav class="deck-navigation" aria-label="Procházení tarotového balíčku">
      <button
        type="button"
        disabled={shuffleEnabled || currentIndex === 0}
        onclick={showPrevious}
      >
        <span aria-hidden="true">←</span>
        Předchozí
      </button>
      <button
        type="button"
        class="next-button"
        disabled={!shuffleEnabled && currentIndex === deckOrder.length - 1}
        onclick={showNext}
      >
        {shuffleComplete ? 'Zamíchat znovu' : 'Další'}
        <span aria-hidden="true">{shuffleComplete ? '↻' : '→'}</span>
      </button>
    </nav>

    {#if shuffleComplete}
      <p class="completion-message" role="status">
        Prošli jste všech 78 karet. Dalším klepnutím vytvoříte nové pořadí.
      </p>
    {:else}
      <p class="keyboard-hint">
        Klepnutím otočíte · přejetím nebo šipkami listujete
      </p>
    {/if}
  </main>
</div>

<PwaUpdatePrompt />

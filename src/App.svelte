<script lang="ts">
  import { onMount } from 'svelte'
  import AppHeader from './components/AppHeader.svelte'
  import CardPicker from './components/CardPicker.svelte'
  import FoolsJourney from './components/FoolsJourney.svelte'
  import IosInstallHint from './components/IosInstallHint.svelte'
  import PwaUpdatePrompt from './components/PwaUpdatePrompt.svelte'
  import StudyProgressPanel from './components/StudyProgressPanel.svelte'
  import TarotCard from './components/TarotCard.svelte'
  import { foolsJourney } from './data/foolsJourney.ts'
  import { tarotDeck } from './data/tarotDeck.ts'
  import {
    applyReversedSetting,
    chooseCardOrientation,
    createDeckOrder,
  } from './lib/deckModes.ts'
  import { getNextIndex, getPreviousIndex } from './lib/deckNavigation.ts'
  import {
    applyStudyRating,
    createEmptyStudyProgress,
    createStudyOrder,
    getStudyProgressSummary,
    resetStudyProgress,
  } from './lib/studyProgress.ts'
  import type { SwipeDirection } from './lib/swipeGesture.ts'
  import {
    TRAINER_STATE_KEY,
    TRAINER_STATE_VERSION,
    loadTrainerState,
    saveTrainerState,
  } from './lib/trainerState.ts'
  import type { TarotCard as TarotCardData, TarotSuit } from './types/tarot.ts'
  import type {
    CardOrientation,
    ClassicTrainerMode,
    StudyProgress,
    StudyRating,
    TrainerMode,
    TrainerState,
  } from './types/trainer.ts'

  const deckIds = tarotDeck.map((card) => card.id)
  const cardsById = new Map(tarotDeck.map((card) => [card.id, card]))
  const journeyCards = foolsJourney.map((chapter) => cardsById.get(chapter.cardId)!)
  const suitLabels: Record<TarotSuit, string> = {
    wands: 'Hole',
    cups: 'Poháry',
    swords: 'Meče',
    pentacles: 'Pentakly',
  }

  let mode = $state<TrainerMode>('browse')
  let previousMode = $state<ClassicTrainerMode>('browse')
  let shuffleEnabled = $state(false)
  let reversedEnabled = $state(false)
  let deckOrder = $state<TarotCardData[]>([...tarotDeck])
  let orientations = $state<Array<CardOrientation | null>>([
    'upright',
    ...Array<CardOrientation | null>(tarotDeck.length - 1).fill(null),
  ])
  let studyProgress = $state<StudyProgress>(createEmptyStudyProgress())
  let currentIndex = $state(0)
  let cardViewKey = $state(0)
  let studyRevealed = $state(false)
  let studyProgressExpanded = $state(false)
  let journeyChapterIndex = $state(0)
  let journeyHighestChapterIndex = $state(0)
  let sessionReady = $state(false)
  let storageReady = false
  let revealButton = $state<HTMLButtonElement>()
  let practiceButton = $state<HTMLButtonElement>()

  const currentCard = $derived(deckOrder[currentIndex]!)
  const currentOrientation = $derived(orientations[currentIndex] ?? 'upright')
  const traversalProgress = $derived(`${currentIndex + 1}/${deckOrder.length}`)
  const headerProgress = $derived(
    mode === 'journey' ? `${journeyChapterIndex + 1}/${foolsJourney.length}` : traversalProgress,
  )
  const currentJourneyChapter = $derived(foolsJourney[journeyChapterIndex]!)
  const currentJourneyCard = $derived(journeyCards[journeyChapterIndex]!)
  const groupLabel = $derived(
    currentCard.arcana === 'major' ? 'Velká arkána' : suitLabels[currentCard.suit!],
  )
  const isLastCard = $derived(currentIndex === deckOrder.length - 1)
  const shuffleComplete = $derived(
    mode === 'browse' && shuffleEnabled && isLastCard,
  )
  const studySummary = $derived(
    getStudyProgressSummary(studyProgress, tarotDeck.length),
  )

  function createSnapshot(): TrainerState {
    return {
      version: TRAINER_STATE_VERSION,
      mode,
      previousMode,
      shuffleEnabled,
      reversedEnabled,
      deckOrderIds: deckOrder.map((card) => card.id),
      currentIndex,
      orientations: [...orientations],
      studyRevealed,
      studyProgress: {
        knownCardIds: [...studyProgress.knownCardIds],
        practiceCardIds: [...studyProgress.practiceCardIds],
        orientationProgress: { ...studyProgress.orientationProgress },
      },
      studyProgressExpanded,
      journeyChapterIndex,
      journeyHighestChapterIndex,
    }
  }

  function persistSession(): void {
    if (!storageReady) return
    saveTrainerState(window.localStorage, createSnapshot())
  }

  function resetCardView(): void {
    studyRevealed = false
    cardViewKey += 1
  }

  function beginTraversal(lastCardId: string | null = null): void {
    const orderedIds =
      mode === 'study'
        ? createStudyOrder(
            deckIds,
            studyProgress.practiceCardIds,
            shuffleEnabled,
            lastCardId,
          )
        : createDeckOrder(deckIds, shuffleEnabled)

    deckOrder = orderedIds.map((id) => cardsById.get(id)!)
    orientations = Array<CardOrientation | null>(orderedIds.length).fill(null)
    orientations[0] = chooseCardOrientation(reversedEnabled)
    currentIndex = 0
    resetCardView()
    persistSession()
  }

  function updateMode(nextMode: TrainerMode): void {
    if (mode === nextMode) return

    if (nextMode === 'journey') {
      previousMode = mode === 'journey' ? previousMode : mode
      mode = 'journey'
      persistSession()
      return
    }

    if (mode === 'journey') {
      mode = nextMode
      previousMode = nextMode
      if (nextMode === 'browse') studyRevealed = false
      cardViewKey += 1
      persistSession()
      return
    }

    mode = nextMode
    previousMode = nextMode
    resetCardView()
    persistSession()
  }

  function exitJourney(): void {
    if (mode !== 'journey') return
    mode = previousMode
    cardViewKey += 1
    persistSession()
  }

  function selectJourneyChapter(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= foolsJourney.length) return
    journeyChapterIndex = index
    journeyHighestChapterIndex = Math.max(journeyHighestChapterIndex, index)
    persistSession()
    window.requestAnimationFrame(() => {
      document.getElementById('journey-chapter-start')?.scrollIntoView({
        block: 'start',
        behavior: 'auto',
      })
    })
  }

  function showPreviousJourneyChapter(): void {
    selectJourneyChapter(Math.max(0, journeyChapterIndex - 1))
  }

  function showNextJourneyChapter(): void {
    selectJourneyChapter(Math.min(foolsJourney.length - 1, journeyChapterIndex + 1))
  }

  function toggleStudyProgress(): void {
    studyProgressExpanded = !studyProgressExpanded
    persistSession()
  }

  function updateShuffle(enabled: boolean): void {
    shuffleEnabled = enabled
    beginTraversal()
  }

  function updateReversed(enabled: boolean): void {
    reversedEnabled = enabled
    orientations = applyReversedSetting(orientations, currentIndex, enabled)
    persistSession()
  }

  function assignOrientationIfNeeded(index: number): void {
    if (orientations[index] !== null) return
    const updatedOrientations = [...orientations]
    updatedOrientations[index] = chooseCardOrientation(reversedEnabled)
    orientations = updatedOrientations
  }

  function showPrevious(): void {
    if (shuffleEnabled) return

    const previousIndex = getPreviousIndex(currentIndex)
    if (previousIndex === currentIndex) return

    assignOrientationIfNeeded(previousIndex)
    currentIndex = previousIndex
    resetCardView()
    persistSession()
  }

  function showNext(): void {
    if (isLastCard) {
      if (mode === 'study') beginTraversal(currentCard.id)
      else if (shuffleEnabled) beginTraversal()
      return
    }

    const nextIndex = getNextIndex(currentIndex, deckOrder.length)
    assignOrientationIfNeeded(nextIndex)
    currentIndex = nextIndex
    resetCardView()
    persistSession()
  }

  function selectCard(cardId: string): void {
    const selectedIndex = deckOrder.findIndex((card) => card.id === cardId)
    if (selectedIndex < 0) return

    assignOrientationIfNeeded(selectedIndex)
    currentIndex = selectedIndex
    resetCardView()
    persistSession()
  }

  function revealStudyMeaning(): void {
    if (studyRevealed) return
    studyRevealed = true
    persistSession()
    window.requestAnimationFrame(() => practiceButton?.focus())
  }

  function recordStudyResult(rating: StudyRating): void {
    studyProgress = applyStudyRating(studyProgress, currentCard.id, rating)
    persistSession()
    showNext()
    window.requestAnimationFrame(() => revealButton?.focus())
  }

  function confirmProgressReset(): void {
    const confirmed = window.confirm(
      'Opravdu chcete vymazat naučené karty a seznam k procvičení? Nastavení a aktuální karta zůstanou zachované.',
    )
    if (!confirmed) return

    studyProgress = resetStudyProgress()
    persistSession()
  }

  function navigateBySwipe(direction: SwipeDirection): void {
    if (direction === 'next') showNext()
    else showPrevious()
  }

  function handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!sessionReady || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return

    const target = event.target as HTMLElement | null
    if (target?.closest('details, input, textarea, select')) return

    if (mode === 'journey') {
      if (event.key === 'ArrowLeft' && journeyChapterIndex > 0) {
        event.preventDefault()
        showPreviousJourneyChapter()
      }
      if (event.key === 'ArrowRight' && journeyChapterIndex < foolsJourney.length - 1) {
        event.preventDefault()
        showNextJourneyChapter()
      }
      return
    }

    if (event.key === 'ArrowLeft' && !shuffleEnabled && currentIndex > 0) {
      event.preventDefault()
      showPrevious()
    }

    if (event.key === 'ArrowRight' && (mode === 'study' || shuffleEnabled || !isLastCard)) {
      event.preventDefault()
      showNext()
    }
  }

  onMount(() => {
    let hadStoredState = false
    try {
      hadStoredState = window.localStorage.getItem(TRAINER_STATE_KEY) !== null
    } catch {
      // Nedostupné úložiště nesmí zabránit spuštění aplikace.
    }

    const restored = loadTrainerState(window.localStorage, deckIds)
    mode = restored.mode
    previousMode = restored.previousMode
    shuffleEnabled = restored.shuffleEnabled
    reversedEnabled = restored.reversedEnabled
    deckOrder = restored.deckOrderIds.map((id) => cardsById.get(id)!)
    orientations = [...restored.orientations]
    currentIndex = restored.currentIndex
    studyRevealed = restored.studyRevealed
    studyProgress = restored.studyProgress
    studyProgressExpanded = restored.studyProgressExpanded
    journeyChapterIndex = restored.journeyChapterIndex
    journeyHighestChapterIndex = restored.journeyHighestChapterIndex
    storageReady = true

    if (!hadStoredState) {
      beginTraversal()
    } else {
      cardViewKey += 1
      persistSession()
    }

    sessionReady = true
  })
</script>

<svelte:head>
  <meta
    name="description"
    content="Tarot Trainer je jednoduchá mobilní aplikace pro postupné učení tarotových karet."
  />
</svelte:head>

<svelte:window onkeydown={handleKeyboardNavigation} />

{#if sessionReady}
<div class="app-shell" class:journey-mode={mode === 'journey'}>
  <AppHeader
    progress={headerProgress}
    progressLabel={mode === 'journey' ? 'Kapitola' : 'Pořadí karty'}
  />

  <main class="trainer">
    <div class="trainer-mode-switch" role="group" aria-label="Režim aplikace">
      <button
        type="button"
        class:active={mode === 'browse'}
        aria-pressed={mode === 'browse'}
        onclick={() => updateMode('browse')}
      >
        Prohlížení
      </button>
      <button
        type="button"
        class:active={mode === 'study'}
        aria-pressed={mode === 'study'}
        onclick={() => updateMode('study')}
      >
        Učení
      </button>
      <button
        type="button"
        class:active={mode === 'journey'}
        aria-pressed={mode === 'journey'}
        onclick={() => updateMode('journey')}
      >
        Cesta Blázna
      </button>
    </div>

    <IosInstallHint />

    {#if mode === 'journey'}
      {#key journeyChapterIndex}
        <FoolsJourney
          chapter={currentJourneyChapter}
          card={currentJourneyCard}
          index={journeyChapterIndex}
          chapters={foolsJourney}
          cards={journeyCards}
          onSelect={selectJourneyChapter}
          onPrevious={showPreviousJourneyChapter}
          onNext={showNextJourneyChapter}
          onStartOver={() => selectJourneyChapter(0)}
          onExit={exitJourney}
        />
      {/key}
    {:else}
      {#if mode === 'study'}
        <StudyProgressPanel
          summary={studySummary}
          expanded={studyProgressExpanded}
          onToggle={toggleStudyProgress}
          onReset={confirmProgressReset}
        />
      {/if}

      <CardPicker
        cards={tarotDeck}
        currentCardId={currentCard.id}
        onSelect={selectCard}
        showStudyFilters={mode === 'study'}
        studyProgress={mode === 'study' ? studyProgress : null}
      />

    <fieldset class="mode-controls">
      <legend class="visually-hidden">Nastavení pořadí a orientace karet</legend>

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
        studyMode={mode === 'study'}
        revealed={studyRevealed}
      />
    {/key}

    {#if mode === 'study'}
      <section class="study-actions" aria-label="Vyhodnocení karty">
        {#if !studyRevealed}
          <p>Nejdřív si zkuste vybavit význam karty.</p>
          <button
            bind:this={revealButton}
            type="button"
            class="reveal-button"
            onclick={revealStudyMeaning}
          >
            Odhalit význam
          </button>
        {:else}
          <p>Jak dobře jste si význam vybavili?</p>
          <div>
            <button
              bind:this={practiceButton}
              type="button"
              class="practice-button"
              onclick={() => recordStudyResult('practice')}
            >
              Procvičit
            </button>
            <button
              type="button"
              class="known-button"
              onclick={() => recordStudyResult('known')}
            >
              Umím
            </button>
          </div>
        {/if}
      </section>
    {/if}

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
        disabled={mode === 'browse' && !shuffleEnabled && isLastCard}
        onclick={showNext}
      >
        {mode === 'study' && isLastCard
          ? 'Další kolo'
          : shuffleComplete
            ? 'Zamíchat znovu'
            : 'Další'}
        <span aria-hidden="true">{isLastCard ? '↻' : '→'}</span>
      </button>
    </nav>

    {#if mode === 'study' && isLastCard}
      <p class="completion-message" role="status">
        Další kolo začne kartami označenými k procvičení.
      </p>
    {:else if shuffleComplete}
      <p class="completion-message" role="status">
        Prošli jste všech 78 karet. Dalším klepnutím vytvoříte nové pořadí.
      </p>
    {:else}
      <p class="keyboard-hint">
        {mode === 'browse'
          ? 'Klepnutím otočíte · přejetím nebo šipkami listujete'
          : 'Význam odhalíte tlačítkem · přejetím nebo šipkami listujete'}
      </p>
    {/if}
    {/if}
  </main>
</div>
{/if}

<PwaUpdatePrompt />

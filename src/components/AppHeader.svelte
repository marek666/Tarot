<script lang="ts">
  import type { TrainerMode } from '../types/trainer.ts'

  let {
    progress,
    mode,
    onModeChange,
    progressLabel = 'Pořadí karty',
  }: {
    progress: string
    mode: TrainerMode
    onModeChange: (nextMode: TrainerMode) => void
    progressLabel?: string
  } = $props()

  const modes: ReadonlyArray<{ id: TrainerMode; label: string }> = [
    { id: 'browse', label: 'Prohlížení' },
    { id: 'study', label: 'Učení' },
    { id: 'journey', label: 'Cesta Blázna' },
    { id: 'daily', label: 'Výklady' },
  ]
  let mobileDialog = $state<HTMLDialogElement>()
  let mobileTrigger = $state<HTMLButtonElement>()
  let menuOpen = $state(false)
  const currentLabel = $derived(modes.find((item) => item.id === mode)?.label ?? 'Prohlížení')

  function openMenu(): void {
    if (!mobileDialog || mobileDialog.open) return
    mobileDialog.showModal()
    menuOpen = true
  }

  function closeMenu(): void {
    mobileDialog?.close()
  }

  function handleDialogClose(): void {
    menuOpen = false
    requestAnimationFrame(() => mobileTrigger?.focus())
  }

  function chooseMode(next: TrainerMode): void {
    closeMenu()
    onModeChange(next)
  }

  function closeOnBackdrop(event: MouseEvent): void {
    if (event.target === mobileDialog) closeMenu()
  }
</script>

<header class="site-header">
  <h1 class="brand">
    <span class="brand-mark" aria-hidden="true">✦</span>
    <span>Tarot Trainer</span>
  </h1>

  <nav class="desktop-nav" aria-label="Režim aplikace">
    {#each modes as item}
      <button
        type="button"
        class:active={mode === item.id}
        aria-pressed={mode === item.id}
        onclick={() => onModeChange(item.id)}
      >{item.label}</button>
    {/each}
  </nav>

  <div class="header-actions">
    <span class="progress" aria-label={`${progressLabel} ${progress}`}>{progress}</span>
    <button
      bind:this={mobileTrigger}
      type="button"
      class="mobile-menu-trigger"
      aria-label="Otevřít menu"
      aria-haspopup="dialog"
      aria-expanded={menuOpen}
      aria-controls="mobile-navigation"
      onclick={openMenu}
    ><span aria-hidden="true">☰</span></button>
  </div>
</header>

<dialog
  bind:this={mobileDialog}
  id="mobile-navigation"
  class="mobile-menu-dialog"
  aria-label="Navigace Tarot Trainer"
  aria-modal="true"
  onclose={handleDialogClose}
  onclick={closeOnBackdrop}
>
  <div class="mobile-menu-content">
    <div class="mobile-menu-heading">
      <div>
        <small>Aktuální režim</small>
        <strong>{currentLabel}</strong>
      </div>
      <button type="button" class="mobile-menu-close" aria-label="Zavřít menu" onclick={closeMenu}>×</button>
    </div>
    <nav class="mobile-nav" aria-label="Režim aplikace">
      {#each modes as item}
        <button
          type="button"
          class:active={mode === item.id}
          aria-pressed={mode === item.id}
          onclick={() => chooseMode(item.id)}
        >{item.label}{#if mode === item.id}<span aria-hidden="true">✓</span>{/if}</button>
      {/each}
    </nav>
  </div>
</dialog>

<style>
  .desktop-nav { display: flex; align-items: center; gap: 0.22rem; min-width: 0; }
  .desktop-nav button {
    min-height: 44px; padding: 0.5rem 0.7rem; border: 1px solid transparent;
    border-radius: 0.65rem; background: transparent; color: var(--muted);
    font-size: 0.75rem; font-weight: 700; cursor: pointer; white-space: nowrap;
  }
  .desktop-nav button.active { background: var(--gold); color: #101722; }
  .header-actions { display: flex; align-items: center; gap: 0.45rem; }
  .mobile-menu-trigger { display: none; }
  .mobile-menu-dialog {
    width: min(calc(100% - 1rem), 22rem); max-height: min(80dvh, 28rem);
    margin: calc(4rem + env(safe-area-inset-top)) max(0.5rem, env(safe-area-inset-right)) auto auto;
    padding: 0; color: var(--text); background: #0c1929;
    border: 1px solid var(--border); border-radius: 1rem;
    box-shadow: 0 1rem 3rem rgb(0 0 0 / 55%);
  }
  .mobile-menu-dialog::backdrop { background: rgb(2 8 16 / 68%); }
  .mobile-menu-content { padding: 0.8rem; }
  .mobile-menu-heading { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.6rem; }
  .mobile-menu-heading > div { display: grid; gap: 0.2rem; }
  .mobile-menu-heading small { color: var(--muted); font-size: 0.7rem; }
  .mobile-menu-heading strong { color: var(--gold); }
  .mobile-menu-close { width: 44px; height: 44px; color: var(--text); background: transparent; border: 0; font-size: 1.6rem; cursor: pointer; }
  .mobile-nav { display: grid; gap: 0.3rem; }
  .mobile-nav button {
    min-height: 48px; padding: 0.7rem 0.9rem; display: flex; justify-content: space-between;
    align-items: center; background: var(--surface-light); color: var(--text);
    border: 1px solid var(--border); border-radius: 0.65rem; font-weight: 700; cursor: pointer;
    text-align: left;
  }
  .mobile-nav button.active { background: rgb(216 184 108 / 15%); border-color: var(--gold); color: var(--gold); }
  button:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }

  @media (max-width: 839px) {
    .desktop-nav { display: none; }
    .mobile-menu-trigger {
      width: 44px; height: 44px; padding: 0;
      display: grid; place-items: center; background: transparent; color: var(--gold);
      border: 1px solid var(--border); border-radius: 0.7rem; cursor: pointer;
    }
    .mobile-menu-trigger span { font-size: 1.25rem; line-height: 1; }
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte'
  import {
    rememberIosInstallHint,
    shouldShowIosInstallHint,
  } from '../lib/pwaInstall.ts'

  let visible = $state(false)

  function dismiss(): void {
    visible = false
    rememberIosInstallHint(window.localStorage)
  }

  onMount(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    visible = shouldShowIosInstallHint(navigator, displayMode, window.localStorage)

    // Jednorázové zobrazení je dostatečné; uživatele neobtěžujeme při každé návštěvě.
    if (visible) rememberIosInstallHint(window.localStorage)
  })
</script>

{#if visible}
  <aside class="ios-install-hint" aria-label="Instalace na iPhone">
    <div>
      <strong>Přidat na iPhone</strong>
      <p>V Safari klepněte na Sdílet a potom na Přidat na plochu.</p>
    </div>
    <button type="button" aria-label="Zavřít instalační nápovědu" onclick={dismiss}>×</button>
  </aside>
{/if}

<style>
  .ios-install-hint {
    width: min(100%, 25rem);
    padding: 0.75rem 0.7rem 0.75rem 0.9rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    color: var(--text);
    background: rgb(18 34 56 / 94%);
    border: 1px solid var(--border);
    border-radius: 0.8rem;
  }

  .ios-install-hint div {
    min-width: 0;
  }

  strong {
    color: var(--gold);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.92rem;
    font-weight: 400;
  }

  p {
    margin-top: 0.2rem;
    color: var(--muted);
    font-size: 0.75rem;
    line-height: 1.45;
  }

  button {
    width: 44px;
    min-width: 44px;
    height: 44px;
    padding: 0;
    color: var(--muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.3rem;
    line-height: 1;
  }

  button:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 3px;
  }
</style>

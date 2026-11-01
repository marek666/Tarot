<script lang="ts">
  import { onDestroy } from 'svelte'
  import { useRegisterSW } from 'virtual:pwa-register/svelte'

  const UPDATE_INTERVAL_MS = 60 * 60 * 1000

  let registration: ServiceWorkerRegistration | undefined
  let updateTimer: number | undefined
  let registrationFailed = $state(false)

  function checkForUpdate(): void {
    if (!registration || !navigator.onLine || registration.installing) return
    void registration.update().catch(() => {
      // Další automatická kontrola proběhne později; aplikace zůstává dostupná offline.
    })
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') checkForUpdate()
  }

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_serviceWorkerUrl, serviceWorkerRegistration) {
      registration = serviceWorkerRegistration
      if (!registration) return

      updateTimer = window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS)
      window.addEventListener('online', checkForUpdate)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    },
    onRegisterError() {
      registrationFailed = true
    },
  })

  function closePrompt(): void {
    offlineReady.set(false)
    needRefresh.set(false)
    registrationFailed = false
  }

  onDestroy(() => {
    if (updateTimer !== undefined) window.clearInterval(updateTimer)
    window.removeEventListener('online', checkForUpdate)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
</script>

{#if $offlineReady || $needRefresh || registrationFailed}
  <aside class="pwa-notice" role="status" aria-live="polite" aria-atomic="true">
    <div class="pwa-copy">
      <strong>
        {#if $needRefresh}
          Je dostupná nová verze
        {:else if $offlineReady}
          Aplikace je připravená offline
        {:else}
          Offline režim se nepodařilo aktivovat
        {/if}
      </strong>
      <span>
        {#if $needRefresh}
          Aktualizací načtete nejnovější obsah.
        {:else if $offlineReady}
          Karty a jejich významy lze nyní používat bez internetu.
        {:else}
          Zkontrolujte připojení a načtěte stránku znovu.
        {/if}
      </span>
    </div>

    <div class="pwa-actions">
      {#if $needRefresh}
        <button class="primary" type="button" onclick={() => void updateServiceWorker(true)}>
          Aktualizovat
        </button>
      {/if}
      <button type="button" onclick={closePrompt}>
        {$needRefresh ? 'Později' : 'Zavřít'}
      </button>
    </div>
  </aside>
{/if}

<style>
  .pwa-notice {
    position: fixed;
    right: max(1rem, env(safe-area-inset-right));
    bottom: max(1rem, env(safe-area-inset-bottom));
    left: max(1rem, env(safe-area-inset-left));
    z-index: 20;
    width: min(26rem, calc(100% - 2rem));
    margin-inline: auto;
    padding: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.9rem;
    color: var(--text);
    background: #122238;
    border: 1px solid rgb(216 184 108 / 52%);
    border-radius: 0.9rem;
    box-shadow: 0 1rem 3rem rgb(0 0 0 / 48%);
  }

  .pwa-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    line-height: 1.35;
  }

  .pwa-copy strong {
    color: var(--gold);
    font-size: 0.82rem;
  }

  .pwa-copy span {
    color: var(--muted);
    font-size: 0.7rem;
  }

  .pwa-actions {
    display: flex;
    flex: 0 0 auto;
    gap: 0.45rem;
  }

  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0.6rem 0.75rem;
    color: var(--text);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 0.65rem;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 700;
  }

  button.primary {
    color: #101722;
    background: var(--gold);
    border-color: var(--gold);
  }

  button:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 3px;
  }

  @media (max-width: 420px) {
    .pwa-notice {
      align-items: stretch;
      flex-direction: column;
    }

    .pwa-actions {
      width: 100%;
    }

    button {
      flex: 1;
    }
  }
</style>

<script lang="ts">
  let {
    progress,
    progressLabel = 'Pořadí karty',
  }: {
    progress: string
    progressLabel?: string
  } = $props()
</script>

<header class="site-header">
  <h1 class="brand">
    <span class="brand-mark" aria-hidden="true">✦</span>
    <span>Tarot Trainer</span>
  </h1>
  <span class="progress" aria-label={`${progressLabel} ${progress}`}>{progress}</span>
</header>

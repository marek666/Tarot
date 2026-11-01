<script lang="ts">
  let { progress }: { progress: string } = $props()
</script>

<header class="site-header">
  <h1 class="brand">
    <span class="brand-mark" aria-hidden="true">✦</span>
    <span>Tarot Trainer</span>
  </h1>
  <span class="progress" aria-label={`Pořadí karty ${progress}`}>{progress}</span>
</header>

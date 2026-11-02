<script lang="ts">
  import type { StudyProgressSummary } from '../lib/studyProgress.ts'

  let {
    summary,
    expanded,
    onToggle,
    onReset,
  }: {
    summary: StudyProgressSummary
    expanded: boolean
    onToggle: () => void
    onReset: () => void
  } = $props()

  const progressPercent = $derived(Math.round((summary.known / summary.total) * 100))
</script>

<section class="study-progress" aria-label="Studijní pokrok">
  <button
    type="button"
    class="progress-toggle"
    aria-expanded={expanded}
    aria-controls="study-progress-details"
    onclick={onToggle}
  >
    <span>Pokrok v učení — {summary.known}/{summary.total}</span>
    <span class:expanded class="progress-chevron" aria-hidden="true">⌄</span>
  </button>

  {#if expanded}
    <div id="study-progress-details" class="progress-details">
      <dl>
        <div>
          <dt>Naučené</dt>
          <dd>{summary.known}</dd>
        </div>
        <div>
          <dt>Procvičit</dt>
          <dd>{summary.practice}</dd>
        </div>
        <div>
          <dt>Zbývá</dt>
          <dd>{summary.remaining}</dd>
        </div>
      </dl>
      <div
        class="progress-bar"
        role="progressbar"
        aria-label="Podíl naučených karet"
        aria-valuemin="0"
        aria-valuemax={summary.total}
        aria-valuenow={summary.known}
      >
        <span style={`width: ${progressPercent}%`}></span>
      </div>
      <button type="button" class="reset-progress" onclick={onReset}>Resetovat pokrok</button>
    </div>
  {/if}
</section>

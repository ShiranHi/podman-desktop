<script lang="ts">
import {
  HEALTH_SCENARIO_LABELS,
  type HealthScenario,
  readHealthScenarioFromUrl,
  setHealthScenario,
} from '/@/mock-health-scenarios';

let selected = $state<HealthScenario>(readHealthScenarioFromUrl());

function onScenarioChange(event: Event): void {
  const value = (event.currentTarget as HTMLSelectElement).value as HealthScenario;
  selected = value;
  setHealthScenario(value);
}
</script>

<div
  class="flex-shrink-0 flex flex-col gap-1 border-b border-dashed border-[var(--pd-content-divider)] bg-[var(--pd-content-card-carousel-card-bg)] px-4 py-2"
  aria-label="Prototype health scenario">
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <label for="health-scenario" class="text-xs font-semibold text-[var(--pd-content-text-sub)] shrink-0">
      Prototype scenario (GitLab Pages)
    </label>
    <select
      id="health-scenario"
      class="min-w-[16rem] max-w-xl flex-1 rounded-md border border-[var(--pd-input-field-stroke)] bg-[var(--pd-content-card-bg)] px-2 py-1.5 text-sm text-[var(--pd-content-card-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-action-button-primary-bg)]"
      value={selected}
      onchange={onScenarioChange}>
      {#each Object.entries(HEALTH_SCENARIO_LABELS) as [value, label] (value)}
        <option value={value}>{label}</option>
      {/each}
    </select>
  </div>
  <p class="text-xs text-[var(--pd-content-text-sub)]">
    Switch scenarios to preview all health card states for design review.
  </p>
</div>

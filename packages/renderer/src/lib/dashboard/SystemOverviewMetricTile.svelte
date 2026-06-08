<script lang="ts">
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@podman-desktop/ui-svelte/icons';

interface Props {
  label: string;
  count: number;
  activeCount?: number;
  icon: IconDefinition;
  onNavigate?: () => void;
  statusNote?: string;
}

let { label, count, activeCount, icon, onNavigate, statusNote }: Props = $props();

function handleClick(): void {
  onNavigate?.();
}
</script>

<button
  type="button"
  class="flex w-full flex-col gap-2 p-3 rounded-lg cursor-pointer bg-[var(--pd-content-card-carousel-card-bg)] hover:bg-[var(--pd-content-card-carousel-card-hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-action-button-primary-bg)] text-left transition-colors"
  onclick={handleClick}
  aria-label="View {label}: {statusNote ?? (activeCount !== undefined ? `${activeCount} running, ` : '') + `${count} total`}">
  <div class="flex items-center gap-2">
    <Icon {icon} class="text-[var(--pd-content-text-sub)] shrink-0" size="sm" />
    <span class="text-sm font-semibold text-[var(--pd-content-card-header-text)]">{label}</span>
  </div>
  {#if statusNote}
    <div class="text-sm font-semibold text-[var(--pd-status-stopped)]">{statusNote}</div>
  {:else}
    <div class="flex gap-5">
      {#if activeCount !== undefined}
        <div>
          <div class="text-xs text-[var(--pd-content-text-sub)]">Running</div>
          <div class="text-2xl font-semibold leading-none text-[var(--pd-content-card-text)]">{activeCount}</div>
        </div>
      {/if}
      <div>
        <div class="text-xs text-[var(--pd-content-text-sub)]">Total</div>
        <div class="text-2xl font-semibold leading-none text-[var(--pd-content-card-text)]">{count}</div>
      </div>
    </div>
  {/if}
</button>

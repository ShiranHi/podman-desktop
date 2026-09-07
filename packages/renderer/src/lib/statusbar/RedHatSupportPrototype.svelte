<script lang="ts">
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { Link } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';

import { currentScreen } from '/@/stores/prototype';

let show = $derived($currentScreen === 'status-bar');
let tooltipVisible = $state(false);

function hideTooltip(): void {
  tooltipVisible = false;
}

function showTooltip(): void {
  tooltipVisible = true;
}

$effect(() => {
  if (!show) tooltipVisible = false;
});

async function openRedHatDesktop(): Promise<void> {
  await window.openExternal('https://www.redhat.com/en/products/desktop');
}
</script>

{#if show}
  <div
    class="group relative flex h-full items-center"
    style="-webkit-app-region: none;"
    onmouseenter={showTooltip}
    onmouseleave={hideTooltip}>
    <button
      class="flex h-full items-center gap-1 px-1 py-px hover:bg-[var(--pd-statusbar-hover-bg)]"
      aria-label="Red Hat Build">
      <span>Red Hat Build</span>
    </button>
    <div
      class="invisible pointer-events-auto absolute bottom-full left-1/2 z-50 w-72 -translate-x-1/2 rounded-[9px] border border-[var(--pd-tooltip-outer-border)] bg-[var(--pd-tooltip-bg)] p-1 text-[12px] leading-[16px] text-[var(--pd-tooltip-text)] opacity-0 shadow-[0_4px_12px_var(--pd-shadow-color)] backdrop-blur-sm transition-opacity"
      class:visible={tooltipVisible}
      class:opacity-100={tooltipVisible}
      >
      <div class="rounded-[9px] border border-[var(--pd-tooltip-inner-border)] px-2 pb-1 pt-1 text-[var(--pd-tooltip-text)]">
        <div class="font-semibold">Red Hat Build</div>
        <div class="mt-1 opacity-70">Enterprise-grade support for your container development workflow.</div>
      <Link class="pointer-events-auto mt-2 inline-flex items-center text-[var(--pd-tooltip-text)] underline" onclick={openRedHatDesktop}>
        Learn more <Icon class="ml-1" icon={faArrowUpRightFromSquare} />
      </Link>
      </div>
    </div>
  </div>
{/if}

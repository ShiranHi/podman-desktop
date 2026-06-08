<script lang="ts">
import { SYSTEM_OVERVIEW_EXPANDED } from '@podman-desktop/core-api';
import { Expandable, Tooltip } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';

import SystemOverviewContent from '/@/lib/dashboard/SystemOverviewContent.svelte';
import { ExpandableState } from '/@/lib/ui/expandable-state.svelte';
import { systemOverviewInfos } from '/@/stores/dashboard/system-overview.svelte';

import { getSystemOverviewDisplayText, STATUS_TEXT_CLASS } from './system-overview-utils.svelte';

const expandableState = new ExpandableState(SYSTEM_OVERVIEW_EXPANDED);

let statusDisplayText = $derived(
  getSystemOverviewDisplayText($systemOverviewInfos.status.status, $systemOverviewInfos.text),
);

let tooltipText = $derived.by(() => {
  const status = $systemOverviewInfos.status.status;
  const text = $systemOverviewInfos.text;

  switch (status) {
    case 'healthy':
      return 'All container engines and connections are running normally';
    case 'stable':
      if (text.includes('warning')) {
        return text; // Show the actual warning message
      }
      return 'Some container engines or Kubernetes connections are stopped. Start them to run workloads.';
    case 'progressing':
      return text.includes('Starting')
        ? 'Container engine or connection is starting up'
        : 'Container engine or connection is shutting down';
    case 'critical':
      return text.includes('Multiple')
        ? 'Multiple container engines or connections have errors. Check the details below.'
        : 'A container engine or connection has encountered an error. Check the details below.';
    default:
      return text;
  }
});
</script>

<div class="flex flex-1 flex-col bg-[var(--pd-content-card-bg)] p-5 rounded-lg [&_.flex.flex-col.w-full.gap-2]:gap-4 [&_button>div]:flex-nowrap">
  <Expandable bind:initialized={expandableState.initialized} bind:expanded={expandableState.expanded} onclick={expandableState.toggle.bind(expandableState)}>
    {#snippet title()}
      <div class="flex items-center gap-2 flex-nowrap whitespace-nowrap min-w-0 overflow-hidden">
        <span class="text-lg font-semibold text-[var(--pd-content-card-header-text)] shrink-0">System Overview</span>
        <Tooltip tip={tooltipText} class="inline-flex items-center gap-1.5 shrink-0">
          <span
            class="inline-flex items-center gap-1.5"
            aria-live="polite"
            aria-atomic="true"
            aria-label="System status: {$systemOverviewInfos.text}">
            {#key $systemOverviewInfos.status.status}
              <Icon
                class="shrink-0 {STATUS_TEXT_CLASS[$systemOverviewInfos.status.status]}"
                icon={$systemOverviewInfos.status.icon}
                size={$systemOverviewInfos.status.status === 'progressing' ? '1.25em' : 'sm'} />
            {/key}
            <span class="text-lg font-semibold shrink-0 {STATUS_TEXT_CLASS[$systemOverviewInfos.status.status]}">
              {statusDisplayText}
            </span>
          </span>
        </Tooltip>
      </div>
    {/snippet}
    <SystemOverviewContent />
  </Expandable>
</div>

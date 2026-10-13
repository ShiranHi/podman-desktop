<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';

import NetworkIcon from '/@/lib/images/NetworkIcon.svelte';
import NetworkActions from '/@/lib/network/NetworkActions.svelte';
import NetworkDetailsInspect from '/@/lib/network/NetworkDetailsInspect.svelte';
import NetworkDetailsSummary from '/@/lib/network/NetworkDetailsSummary.svelte';
import { DEMO_ENGINE_ID } from '/@/stores/layout/layout-mock-data';
import { markTabStale } from '/@/stores/layout/layout-store.svelte';
import type { NetworkSubView } from '/@/stores/layout/layout-types';
import { networksListInfo } from '/@/stores/networks';

import DemoResourceContent from './DemoResourceContent.svelte';
import StaleTabPlaceholder from './StaleTabPlaceholder.svelte';
import WorkspaceDetailsFrame from './WorkspaceDetailsFrame.svelte';

interface Props {
  tabId: string;
  networkName: string;
  engineId: string;
  subView?: NetworkSubView;
}

let { tabId, networkName, engineId, subView = 'summary' }: Props = $props();
let network = $derived($networksListInfo.find(item => item.name === networkName && item.engineId === engineId));

$effect(() => markTabStale(tabId, !network));
</script>

{#if network}
  <WorkspaceDetailsFrame {tabId} title={network.name} subtitle={network.shortId}>
    {#snippet icon()}<StatusIcon icon={NetworkIcon} size={24} status={network.status} />{/snippet}
    {#snippet actions()}<div inert={network.engineId === DEMO_ENGINE_ID}><NetworkActions object={network} detailed /></div>{/snippet}

  <div class="h-full min-h-0 overflow-auto">
    {#if subView === 'inspect'}
      {#if import.meta.env.DEV && network.engineId === DEMO_ENGINE_ID}
        <DemoResourceContent content={JSON.stringify({
          Name: network.name,
          Id: network.id,
          Driver: network.driver,
          Created: network.created,
          Scope: 'local',
          Internal: false,
          EnableIPv6: network.ipv6_enabled,
          IPAM: { Config: network.subnets?.map(Subnet => ({ Subnet })) ?? [] },
          Containers: Object.fromEntries(network.containers.map(container => [container.id, { Name: container.name }])),
          Labels: network.labels,
        }, undefined, 2)} />
      {:else}
        <NetworkDetailsInspect {network} />
      {/if}
    {:else}
      <NetworkDetailsSummary {network} />
    {/if}
  </div>
  </WorkspaceDetailsFrame>
{:else}
  <StaleTabPlaceholder resourceLabel="Network" {tabId} />
{/if}

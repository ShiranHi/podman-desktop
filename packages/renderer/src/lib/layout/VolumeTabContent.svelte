<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';

import VolumeIcon from '/@/lib/images/VolumeIcon.svelte';
import VolumeActions from '/@/lib/volume/VolumeActions.svelte';
import VolumeDetailsInspect from '/@/lib/volume/VolumeDetailsInspect.svelte';
import VolumeDetailsSummary from '/@/lib/volume/VolumeDetailsSummary.svelte';
import { DEMO_ENGINE_ID } from '/@/stores/layout/layout-mock-data';
import { markTabStale } from '/@/stores/layout/layout-store.svelte';
import type { VolumeSubView } from '/@/stores/layout/layout-types';
import { volumeListInfos } from '/@/stores/volumes';

import DemoResourceContent from './DemoResourceContent.svelte';
import StaleTabPlaceholder from './StaleTabPlaceholder.svelte';
import WorkspaceDetailsFrame from './WorkspaceDetailsFrame.svelte';

interface Props {
  tabId: string;
  volumeName: string;
  engineId: string;
  subView?: VolumeSubView;
}

let { tabId, volumeName, engineId, subView = 'summary' }: Props = $props();
let volume = $derived($volumeListInfos.find(item => item.name === volumeName && item.engineId === engineId));

$effect(() => markTabStale(tabId, !volume));
</script>

{#if volume}
  <WorkspaceDetailsFrame {tabId} title={volume.shortName} subtitle={volume.humanSize}>
    {#snippet icon()}<StatusIcon icon={VolumeIcon} size={24} status={volume.status} />{/snippet}
    {#snippet actions()}<div inert={volume.engineId === DEMO_ENGINE_ID}><VolumeActions volume={volume} detailed /></div>{/snippet}

  <div class="h-full min-h-0 overflow-auto">
    {#if subView === 'inspect'}
      {#if import.meta.env.DEV && volume.engineId === DEMO_ENGINE_ID}
        <DemoResourceContent content={JSON.stringify({
          Name: volume.name,
          Driver: volume.driver,
          Mountpoint: volume.mountPoint,
          CreatedAt: volume.created,
          Scope: volume.scope,
          Options: volume.options ?? {},
          Labels: volume.labels ?? {},
          UsageData: { RefCount: volume.containersUsage.length, Size: volume.size },
        }, undefined, 2)} />
      {:else}
        <VolumeDetailsInspect {volume} />
      {/if}
    {:else}
      <VolumeDetailsSummary {volume} />
    {/if}
  </div>
  </WorkspaceDetailsFrame>
{:else}
  <StaleTabPlaceholder resourceLabel="Volume" {tabId} />
{/if}

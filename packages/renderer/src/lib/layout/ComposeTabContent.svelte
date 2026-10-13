<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';

import ComposeActions from '/@/lib/compose/ComposeActions.svelte';
import ComposeDetailsInspect from '/@/lib/compose/ComposeDetailsInspect.svelte';
import ComposeDetailsKube from '/@/lib/compose/ComposeDetailsKube.svelte';
import ComposeDetailsLogs from '/@/lib/compose/ComposeDetailsLogs.svelte';
import ComposeDetailsSummary from '/@/lib/compose/ComposeDetailsSummary.svelte';
import type { ComposeInfoUI } from '/@/lib/compose/ComposeInfoUI';
import ComposeIcon from '/@/lib/images/PodIcon.svelte';
import { containersInfos } from '/@/stores/containers';
import { demoOutput } from '/@/stores/layout/demo-output';
import { DEMO_ENGINE_ID } from '/@/stores/layout/layout-mock-data';
import { markTabStale } from '/@/stores/layout/layout-store.svelte';
import type { ComposeSubView } from '/@/stores/layout/layout-types';

import DemoResourceContent from './DemoResourceContent.svelte';
import StaleTabPlaceholder from './StaleTabPlaceholder.svelte';
import WorkspaceDetailsFrame from './WorkspaceDetailsFrame.svelte';

interface Props {
  tabId: string;
  composeName: string;
  engineId: string;
  subView?: ComposeSubView;
}

let { tabId, composeName, engineId, subView = 'summary' }: Props = $props();
let compose = $derived.by((): ComposeInfoUI | undefined => {
  const containers = $containersInfos.filter(
    container => container.labels['com.docker.compose.project'] === composeName,
  );
  if (containers.length === 0) return undefined;
  return {
    name: composeName,
    engineId,
    engineType: containers[0].engineType,
    status: containers.every(container => container.state === 'RUNNING') ? 'RUNNING' : 'STOPPED',
    containers,
  };
});

$effect(() => markTabStale(tabId, !compose));
</script>

{#if compose}
  <WorkspaceDetailsFrame {tabId} title={compose.name} subtitle="">
    {#snippet icon()}<StatusIcon icon={ComposeIcon} size={24} status={compose.status} />{/snippet}
    {#snippet actions()}<div inert={compose.engineId === DEMO_ENGINE_ID}><ComposeActions compose={compose} detailed /></div>{/snippet}

  <div class="h-full min-h-0 overflow-auto">
    {#if subView === 'inspect'}
      {#if import.meta.env.DEV && compose.engineId === DEMO_ENGINE_ID}
        <DemoResourceContent content={JSON.stringify({
          project: compose.name,
          engine: compose.engineType,
          status: compose.status,
          services: compose.containers.map(container => ({ name: container.name, image: container.image, state: container.state, ports: container.ports })),
        }, undefined, 2)} />
      {:else}
        <ComposeDetailsInspect {compose} />
      {/if}
    {:else if subView === 'logs'}
      {#if import.meta.env.DEV && compose.engineId === DEMO_ENGINE_ID}
        <DemoResourceContent language="plaintext" content={demoOutput(compose.name, 'logs')} />
      {:else}
        <ComposeDetailsLogs {compose} />
      {/if}
    {:else if subView === 'kube'}
      {#if import.meta.env.DEV && compose.engineId === DEMO_ENGINE_ID}
<DemoResourceContent language="yaml" content={demoOutput(compose.name, subView)} />
{:else}
<ComposeDetailsKube {compose} />
{/if}
    {:else}
      <ComposeDetailsSummary {compose} />
    {/if}
  </div>
  </WorkspaceDetailsFrame>
{:else}
  <StaleTabPlaceholder resourceLabel="Compose" {tabId} />
{/if}

<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';

import SecretIcon from '/@/lib/images/SecretIcon.svelte';
import SecretActions from '/@/lib/secrets/components/SecretActions.svelte';
import SecretDetailsInspect from '/@/lib/secrets/tabs/SecretDetailsInspect.svelte';
import SecretDetailsSummary from '/@/lib/secrets/tabs/SecretDetailsSummary.svelte';
import { DEMO_ENGINE_ID } from '/@/stores/layout/layout-mock-data';
import { markTabStale } from '/@/stores/layout/layout-store.svelte';
import type { SecretSubView } from '/@/stores/layout/layout-types';
import { secretsInfo } from '/@/stores/secrets';

import StaleTabPlaceholder from './StaleTabPlaceholder.svelte';
import WorkspaceDetailsFrame from './WorkspaceDetailsFrame.svelte';

interface Props {
  tabId: string;
  secretId: string;
  engineId: string;
  subView?: SecretSubView;
}

let { tabId, secretId, engineId, subView = 'summary' }: Props = $props();
let secret = $derived($secretsInfo.find(item => item.Id === secretId && item.engineId === engineId));

$effect(() => markTabStale(tabId, !secret));
</script>

{#if secret}
  <WorkspaceDetailsFrame {tabId} title={secret.Name} subtitle={secret.Id}>
    {#snippet icon()}<StatusIcon icon={SecretIcon} size={24}  />{/snippet}
    {#snippet actions()}<div inert={secret.engineId === DEMO_ENGINE_ID}><SecretActions object={secret} detailed /></div>{/snippet}

  <div class="h-full min-h-0 overflow-auto">
    {#if subView === 'inspect'}
      <SecretDetailsInspect {secret} />
    {:else}
      <SecretDetailsSummary {secret} />
    {/if}
  </div>
  </WorkspaceDetailsFrame>
{:else}
  <StaleTabPlaceholder resourceLabel="Secret" {tabId} />
{/if}

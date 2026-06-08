<script lang="ts">
import {
  NavigationPage,
  type ProviderConnectionInfo,
  type ProviderContainerConnectionInfo,
  type ProviderInfo,
} from '@podman-desktop/core-api';
import { Button } from '@podman-desktop/ui-svelte';

import SystemOverviewNestedConnectionRow from '/@/lib/dashboard/SystemOverviewNestedConnectionRow.svelte';
import SystemOverviewProviderCardBase from '/@/lib/dashboard/SystemOverviewProviderCardBase.svelte';
import SystemOverviewResourceUsage from '/@/lib/dashboard/SystemOverviewResourceUsage.svelte';
import { handleNavigation } from '/@/navigation';
import { getConnectionDisplayName, getSystemOverviewStatus } from '/@/stores/dashboard/system-overview.svelte';

import {
  getConnectionStatusConfig,
  hasStartLifecycle,
  startConnection,
  STATUS_TEXT_CLASS,
  WARNING_TEXT_CLASS,
} from './system-overview-utils.svelte';

export type ChildConnection = {
  connection: ProviderConnectionInfo;
  provider: ProviderInfo;
};

interface Props {
  connection: ProviderConnectionInfo;
  provider: ProviderInfo;
  childConnections?: ChildConnection[];
}

let { connection, provider, childConnections = [] }: Props = $props();
let errorMessage = $state<string | undefined>(undefined);
let actionInProgress = $state(false);

let connectionStatus = $derived(getSystemOverviewStatus(connection.status, connection.error));
let statusConfig = $derived(getConnectionStatusConfig(connection.status, provider, connection.error));
let displayName = $derived(getConnectionDisplayName(connection));
let hasWarningsOnly = $derived(provider.warnings.length > 0 && !connection.error && !errorMessage);

let vmType = $derived.by((): string | undefined => {
  if (connection.connectionType === 'container') {
    return connection.vmType?.name;
  }
  return undefined;
});

let showInlineNestedConnections = $derived(
  connection.connectionType === 'container' && connection.status === 'started' && childConnections.length > 0,
);

function nestedSectionLabel(children: ChildConnection[]): string {
  const types = new Set(children.map(child => child.connection.connectionType));
  if (types.size === 1) {
    const [type] = types;
    if (type === 'kubernetes') return 'Kubernetes';
    if (type === 'vm') return 'Virtual machines';
  }
  return 'Related connections';
}

function navigateToConnection(): void {
  switch (connection.connectionType) {
    case 'container': {
      handleNavigation({
        page: NavigationPage.CONTAINER_CONNECTION,
        parameters: {
          provider: provider.internalId,
          name: connection.name,
          socketPath: connection.endpoint.socketPath,
        },
      });
      break;
    }
    case 'kubernetes': {
      handleNavigation({
        page: NavigationPage.KUBERNETES_CONNECTION,
        parameters: {
          provider: provider.internalId,
          apiURL: connection.endpoint.apiURL,
        },
      });
      break;
    }
    case 'vm':
      handleNavigation({
        page: NavigationPage.VM_CONNECTION,
        parameters: {
          provider: provider.internalId,
          name: connection.name,
        },
      });
      break;
  }
}

async function handleActionButtonClick(): Promise<void> {
  try {
    errorMessage = undefined;
    const canStart = (connection.status === 'stopped' || !!connection.error) && hasStartLifecycle(provider);
    if (canStart) {
      actionInProgress = true;
      await startConnection(provider.internalId, $state.snapshot(connection));
      await window.telemetryTrack('dashboard.healthCard.provider.started', { providerName: provider.name });
    } else {
      navigateToConnection();
    }
  } catch (error: unknown) {
    console.error(`Error handling action button click: ${error}`);
    errorMessage = error instanceof Error ? error.message : String(error);
  } finally {
    actionInProgress = false;
  }
}
</script>

<SystemOverviewProviderCardBase {provider} {connection} name={displayName} version={provider.version} {vmType}>
  {#snippet subtitle()}
    <div class="flex items-center gap-1.5">
      <span class="text-sm {STATUS_TEXT_CLASS[connectionStatus.status]}" aria-label="Connection status">{statusConfig.label}</span>
      {#if connectionStatus.status === 'stable'}
        <span class="text-sm text-[var(--pd-content-text-sub)]">
          ·
          {#if connection.connectionType === 'container'}
            Required to run containers and pods
          {:else if connection.connectionType === 'kubernetes'}
            Start to deploy Kubernetes workloads locally
          {:else}
            Not running
          {/if}
        </span>
      {/if}
    </div>
  {/snippet}

  {#snippet actions()}
    {#if connection.connectionType === 'container' && connection.status === 'started'}
      <div class="pt-2 border-t border-[var(--pd-content-divider)]">
        <div class="flex flex-col lg:flex-row lg:items-start gap-3">
          <SystemOverviewResourceUsage
            {provider}
            connection={connection as ProviderContainerConnectionInfo}
            variant="inline" />

          {#if showInlineNestedConnections}
            <div
              class="flex flex-col gap-1 min-w-0 lg:flex-1 lg:border-l lg:pl-4 border-[var(--pd-content-divider)]">
              <span class="text-xs text-[var(--pd-content-text-sub)]">{nestedSectionLabel(childConnections)}</span>
              {#each childConnections as { connection: childConnection, provider: childProvider } (childProvider.id + ':' + childConnection.name)}
                <SystemOverviewNestedConnectionRow connection={childConnection} provider={childProvider} />
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {:else if connection.error ?? (connection.status !== 'starting' && connection.status !== 'stopping')}
      <div class="pt-2 border-t border-[var(--pd-content-divider)]">
        <Button type={statusConfig.buttonType} inProgress={actionInProgress} onclick={handleActionButtonClick}>
          {statusConfig.buttonText}
        </Button>
      </div>
    {/if}
  {/snippet}

  {#if provider.warnings.length || (connection.error ?? errorMessage)}
    {#if hasWarningsOnly}
      <div
        class="flex items-center gap-1.5 text-sm {WARNING_TEXT_CLASS}"
        aria-label="Connection warning"
        role="status">
        {#each provider.warnings as warning, index (index)}
          {warning.details ?? warning.name}
        {/each}
      </div>
    {:else}
      <div class="flex items-center gap-1.5 text-sm text-[var(--pd-status-terminated)]" aria-label="Connection error">
        {#each provider.warnings as warning, index (index)}
          {warning.details ?? warning.name}
        {/each}
        {#if connection.error}
          {connection.error}
        {:else if errorMessage}
          {errorMessage}
        {/if}
      </div>
    {/if}
  {/if}

  {#if childConnections.length > 0 && !showInlineNestedConnections}
    <div class="flex flex-col gap-1.5 pt-2 border-t border-[var(--pd-content-divider)]">
      <span class="text-xs text-[var(--pd-content-text-sub)]">{nestedSectionLabel(childConnections)}</span>
      <div class="flex flex-col gap-1">
        {#each childConnections as { connection: childConnection, provider: childProvider } (childProvider.id + ':' + childConnection.name)}
          <SystemOverviewNestedConnectionRow connection={childConnection} provider={childProvider} />
        {/each}
      </div>
    </div>
  {/if}
</SystemOverviewProviderCardBase>

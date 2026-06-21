<script lang="ts">
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { NavigationPage, type ProviderConnectionInfo, type ProviderInfo } from '@podman-desktop/core-api';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { router } from 'tinro';

import SystemOverviewConnectionIcon from '/@/lib/dashboard/SystemOverviewConnectionIcon.svelte';
import { handleNavigation } from '/@/navigation';
import { getConnectionDisplayName, getSystemOverviewStatus } from '/@/stores/dashboard/system-overview.svelte';

import { getConnectionStatusConfig, getStatusDotClass, getStatusTextClass } from './system-overview-utils.svelte';

interface Props {
  connection: ProviderConnectionInfo;
  provider: ProviderInfo;
}

let { connection, provider }: Props = $props();

let connectionStatus = $derived(getSystemOverviewStatus(connection.status, connection.error));
let statusConfig = $derived(getConnectionStatusConfig(connection.status, provider, connection.error));
let connectionName = $derived(getConnectionDisplayName(connection));

let typeLabel = $derived(
  connection.connectionType === 'kubernetes'
    ? 'Kubernetes context'
    : connection.connectionType === 'vm'
      ? 'Virtual machine'
      : 'Connection',
);

let stoppedSubtext = $derived.by(() => {
  if (connectionStatus.status !== 'stable') {
    return undefined;
  }
  if (connection.connectionType === 'kubernetes') {
    return 'Start to deploy Kubernetes workloads locally';
  }
  if (connection.connectionType === 'vm') {
    return 'Not running';
  }
  return undefined;
});

function navigateToConnection(): void {
  switch (connection.connectionType) {
    case 'container':
      handleNavigation({
        page: NavigationPage.CONTAINER_CONNECTION,
        parameters: {
          provider: provider.internalId,
          name: connection.name,
          socketPath: connection.endpoint.socketPath,
        },
      });
      break;
    case 'kubernetes': {
      const apiURL = connection.endpoint.apiURL;
      if (apiURL) {
        handleNavigation({
          page: NavigationPage.KUBERNETES_CONNECTION,
          parameters: {
            provider: provider.internalId,
            apiURL,
          },
        });
      } else {
        router.goto('/kubernetes/pods');
      }
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
</script>

<button
  type="button"
  class="flex items-center gap-3 w-full px-3 py-2.5 rounded-md bg-[var(--pd-content-card-bg)] hover:bg-[var(--pd-content-card-carousel-card-hover-bg)] transition-colors text-left"
  onclick={navigateToConnection}
  aria-label="Open {connectionName}{stoppedSubtext ? `, ${statusConfig.label}, ${stoppedSubtext}` : `, ${statusConfig.label}`}">
  <div class="relative flex-shrink-0">
    <span
      class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full {getStatusDotClass(connectionStatus.status, connection.status)} z-10"
      aria-hidden="true"></span>
    <div
      class="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--pd-content-card-carousel-card-bg)] border border-[var(--pd-content-divider)]">
      <SystemOverviewConnectionIcon {provider} {connection} class="max-w-5 max-h-5 object-contain" />
    </div>
  </div>

  <div class="flex-1 min-w-0">
    <div class="text-sm font-medium text-[var(--pd-content-card-text)] truncate">{connectionName}</div>
    <div class="text-xs text-[var(--pd-content-text-sub)]">
      {#if stoppedSubtext}
        <span class="{getStatusTextClass(connectionStatus.status, connection.status)}">{statusConfig.label}</span>
        <span aria-hidden="true"> · </span>
        {stoppedSubtext}
      {:else}
        {typeLabel}
      {/if}
    </div>
  </div>

  <span class="text-sm shrink-0 {getStatusTextClass(connectionStatus.status, connection.status)}" aria-label="Connection status">
    {statusConfig.label}
  </span>

  <Icon icon={faChevronRight} size="sm" class="shrink-0 text-[var(--pd-content-text-sub)]" />
</button>

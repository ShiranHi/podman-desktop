<script lang="ts">
import {
  type ProviderConnectionInfo,
  type ProviderContainerConnectionInfo,
  type ProviderInfo,
} from '@podman-desktop/core-api';
import { onMount } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import SystemOverviewComposeStatus from '/@/lib/dashboard/SystemOverviewComposeStatus.svelte';
import SystemOverviewProviderCardCompact from '/@/lib/dashboard/SystemOverviewProviderCardCompact.svelte';
import SystemOverviewProviderCardDetailed from '/@/lib/dashboard/SystemOverviewProviderCardDetailed.svelte';
import SystemOverviewProviderSetup from '/@/lib/dashboard/SystemOverviewProviderSetup.svelte';
import SystemOverviewResourceTiles from '/@/lib/dashboard/SystemOverviewResourceTiles.svelte';
import { containersInfos } from '/@/stores/containers';
import { providerInfos } from '/@/stores/providers';

// Container connections (shown as detailed cards)
let containerConnectionsWithProvider = $derived.by(() => {
  const result: Array<{ connection: ProviderContainerConnectionInfo; provider: ProviderInfo }> = [];
  for (const provider of $providerInfos) {
    for (const conn of provider.containerConnections) {
      result.push({ connection: conn, provider });
    }
  }
  return result;
});

// Non-container connections (Kubernetes + VM, always shown as minimal cards)
let nonContainerConnectionsWithProvider = $derived.by(() => {
  const result: Array<{ connection: ProviderConnectionInfo; provider: ProviderInfo }> = [];
  for (const provider of $providerInfos) {
    for (const connection of provider.kubernetesConnections) {
      result.push({ connection, provider });
    }
    for (const connection of provider.vmConnections) {
      result.push({ connection, provider });
    }
  }
  return result;
});

onMount(async () => {
  const allConnections = [
    ...containerConnectionsWithProvider.map(c => c.connection),
    ...nonContainerConnectionsWithProvider.map(c => c.connection),
  ];
  await window.telemetryTrack('dashboard.healthCard.viewed', {
    itemCount: allConnections.length,
    healthyCount: allConnections.filter(c => c.status === 'started' && !c.error).length,
    issueCount: allConnections.filter(c => c.error).length,
  });
});

// Go through all containers and find the matching label to a connection name.
function resolveKubernetesOwnerEngineId(connectionName: string): string | undefined {
  return $containersInfos.find(c => c.Labels && Object.values(c.Labels).includes(connectionName))?.engineId;
}

// Go through all containers and find the matching engineName to a connection name.
function resolveVmOwnerEngineId(connectionName: string): string | undefined {
  return $containersInfos.find(c => c.engineName === connectionName)?.engineId;
}

// Map engineId (= containerConnection.name) -> non-container connections that run on that engine
let childConnectionsByEngineId = $derived.by(() => {
  const map = new SvelteMap<string, { connection: ProviderConnectionInfo; provider: ProviderInfo }[]>();

  for (const provider of $providerInfos) {
    for (const conn of provider.kubernetesConnections) {
      const engineId = resolveKubernetesOwnerEngineId(conn.name);
      if (engineId !== undefined) {
        const list = map.get(engineId) ?? [];
        list.push({ connection: conn, provider });
        map.set(engineId, list);
      }
    }
    for (const conn of provider.vmConnections) {
      const engineId = resolveVmOwnerEngineId(conn.name);
      if (engineId !== undefined) {
        const list = map.get(engineId) ?? [];
        list.push({ connection: conn, provider });
        map.set(engineId, list);
      }
    }
  }

  return map;
});

// Track which non-container connections are already nested inside a container connection
let groupedConnectionKeys = $derived.by(() => {
  const keys = new SvelteSet<string>();
  for (const children of childConnectionsByEngineId.values()) {
    for (const { connection, provider } of children) {
      keys.add(`${provider.id}:${connection.name}`);
    }
  }
  return keys;
});

// Container connections with their grouped Kubernetes/VM children.
let containerConnectionsWithChildren = $derived(
  containerConnectionsWithProvider.map(({ connection, provider }) => ({
    connection,
    provider,
    childConnections: childConnectionsByEngineId.get(`${provider.id}.${connection.name}`) ?? [],
  })),
);

// Non-container connections not grouped under any container connection (standalone minimal cards)
let standaloneConnections = $derived(
  nonContainerConnectionsWithProvider.filter(
    ({ connection, provider }) => !groupedConnectionKeys.has(`${provider.id}:${connection.name}`),
  ),
);

// Only show not-installed/installed/configured states for container providers
let containerProviders = $derived(
  $providerInfos.filter(p => p.containerProviderConnectionCreation || p.containerProviderConnectionInitialization),
);

let providersNeedingSetup = $derived(
  containerProviders.filter(
    p =>
      p.status === 'not-installed' ||
      p.status === 'installed' ||
      (p.status === 'configured' &&
        !p.containerConnections.length &&
        !p.kubernetesConnections.length &&
        !p.vmConnections.length),
  ),
);
</script>

<div class="pt-2 flex flex-col gap-4" aria-label="System Overview">
  <SystemOverviewResourceTiles />
  <SystemOverviewComposeStatus />

  <div>
    <div class="text-md font-semibold text-[var(--pd-content-card-header-text)]">Connections</div>
    <div class="flex flex-col gap-2 pt-2">
    {#each providersNeedingSetup as provider (provider.id)}
      <SystemOverviewProviderSetup {provider} />
    {/each}

    <!-- Container providers as detailed cards (started, error, or progressing) -->
    {#each containerConnectionsWithChildren as { connection, provider, childConnections } (provider.id + ':' + connection.name)}
      <SystemOverviewProviderCardDetailed {connection} {provider} {childConnections} />
    {/each}

    <!-- Standalone K8s/VM connections as stacked minimal cards -->
    {#if standaloneConnections.length > 0}
      <div class="flex flex-wrap items-center gap-2">
        {#each standaloneConnections as { connection, provider } (provider.id + ':' + connection.name)}
          <SystemOverviewProviderCardCompact {connection} {provider} />
        {/each}
      </div>
    {/if}
    </div>
  </div>
</div>

<script lang="ts">
import { faBox, faCompactDisc, faCubes, faLayerGroup, faServer } from '@fortawesome/free-solid-svg-icons';
import {
  NavigationPage,
  type ProviderConnectionInfo,
  type ProviderContainerConnectionInfo,
  type ProviderInfo,
} from '@podman-desktop/core-api';
import { onMount } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { router } from 'tinro';

import SystemOverviewComposeStatus from '/@/lib/dashboard/SystemOverviewComposeStatus.svelte';
import SystemOverviewMetricTile from '/@/lib/dashboard/SystemOverviewMetricTile.svelte';
import SystemOverviewProviderCardCompact from '/@/lib/dashboard/SystemOverviewProviderCardCompact.svelte';
import SystemOverviewProviderCardDetailed from '/@/lib/dashboard/SystemOverviewProviderCardDetailed.svelte';
import SystemOverviewProviderSetup from '/@/lib/dashboard/SystemOverviewProviderSetup.svelte';
import { handleNavigation } from '/@/navigation';
import { containersInfos } from '/@/stores/containers';
import { imagesInfos } from '/@/stores/images';
import { kubernetesResourcesCount } from '/@/stores/kubernetes-resources-count';
import { podsInfos } from '/@/stores/pods';
import { providerInfos } from '/@/stores/providers';

import {
  getConnectionSortPriority,
  getContainerConnectionEngineId,
  resolveKubernetesOwnerEngineId,
  resolveVmOwnerEngineId,
} from './system-overview-utils.svelte';

let runningContainers = $derived($containersInfos.filter(c => c.State === 'running').length);
let runningPods = $derived($podsInfos.filter(p => p.Status === 'Running').length);
let kubernetesPodCount = $derived($kubernetesResourcesCount.find(r => r.resourceName === 'pods')?.count ?? 0);

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

let machineCount = $derived(containerConnectionsWithProvider.length);
let runningMachines = $derived(
  containerConnectionsWithProvider.filter(({ connection }) => connection.status === 'started').length,
);

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

let hasStoppedKubernetesCluster = $derived(
  nonContainerConnectionsWithProvider.some(
    ({ connection }) =>
      connection.connectionType === 'kubernetes' && connection.status === 'stopped' && !connection.error,
  ),
);

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

// Map engineId -> non-container connections that run on that engine
let childConnectionsByEngineId = $derived.by(() => {
  const map = new SvelteMap<string, { connection: ProviderConnectionInfo; provider: ProviderInfo }[]>();

  for (const provider of $providerInfos) {
    for (const conn of provider.kubernetesConnections) {
      const engineId = resolveKubernetesOwnerEngineId(conn.name, provider, $containersInfos);
      if (engineId !== undefined) {
        const list = map.get(engineId) ?? [];
        list.push({ connection: conn, provider });
        map.set(engineId, list);
      }
    }
    for (const conn of provider.vmConnections) {
      const engineId = resolveVmOwnerEngineId(conn.name, provider, $containersInfos);
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

// Container connections with their grouped Kubernetes/VM children, sorted by severity.
let containerConnectionsWithChildren = $derived(
  containerConnectionsWithProvider
    .map(({ connection, provider }) => ({
      connection,
      provider,
      childConnections: childConnectionsByEngineId.get(getContainerConnectionEngineId(provider, connection)) ?? [],
    }))
    .toSorted((a, b) => {
      const aPriority = getConnectionSortPriority(
        a.connection.status,
        a.connection.error,
        (a.provider.warnings?.length ?? 0) > 0,
      );
      const bPriority = getConnectionSortPriority(
        b.connection.status,
        b.connection.error,
        (b.provider.warnings?.length ?? 0) > 0,
      );
      return aPriority - bPriority;
    }),
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

function navigateToContainers(): void {
  router.goto('/containers');
}

function navigateToPods(): void {
  router.goto('/pods');
}

function navigateToImages(): void {
  router.goto('/images');
}

function navigateToKubernetesPods(): void {
  router.goto('/kubernetes/pods');
}

function navigateToMachines(): void {
  handleNavigation({ page: NavigationPage.RESOURCES });
}
</script>

<div class="flex flex-col gap-6 pt-5" aria-label="System Overview">
  <section aria-label="Resource Overview" class="pt-1">
    <h3 class="text-md font-semibold text-[var(--pd-content-card-header-text)] mb-1">Resource Overview</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
      <SystemOverviewMetricTile
        label="Containers"
        count={$containersInfos.length}
        activeCount={runningContainers}
        icon={faBox}
        onNavigate={navigateToContainers} />
      <SystemOverviewMetricTile
        label="Pods"
        count={$podsInfos.length}
        activeCount={runningPods}
        icon={faLayerGroup}
        onNavigate={navigateToPods} />
      <SystemOverviewMetricTile
        label="Images"
        count={$imagesInfos.length}
        icon={faCompactDisc}
        onNavigate={navigateToImages} />
      <SystemOverviewMetricTile
        label="Machines"
        count={machineCount}
        activeCount={machineCount > 0 ? runningMachines : undefined}
        icon={faServer}
        onNavigate={navigateToMachines} />
      <SystemOverviewMetricTile
        label="Kubernetes Pods"
        count={kubernetesPodCount}
        icon={faCubes}
        statusNote={hasStoppedKubernetesCluster ? 'Cluster stopped' : undefined}
        onNavigate={navigateToKubernetesPods} />
    </div>
  </section>

  <SystemOverviewComposeStatus />

  <section aria-label="Connections" class="pt-2">
    <h3 class="text-md font-semibold text-[var(--pd-content-card-header-text)] mb-1">Connections</h3>
    <div class="flex flex-col gap-2">
      {#each providersNeedingSetup as provider (provider.id)}
        <SystemOverviewProviderSetup {provider} />
      {/each}

      <div class="grid grid-cols-1 gap-2">
        {#each containerConnectionsWithChildren as { connection, provider, childConnections } (provider.id + ':' + connection.name)}
          <SystemOverviewProviderCardDetailed {connection} {provider} {childConnections} />
        {/each}
      </div>

      {#if standaloneConnections.length > 0}
        <h4 class="text-sm font-semibold text-[var(--pd-content-card-header-text)] pt-1">Other Connections</h4>
        <div class="rounded-lg p-3 bg-[var(--pd-content-card-carousel-card-bg)]">
          <div class="flex flex-wrap items-center gap-2">
            {#each standaloneConnections as { connection, provider } (provider.id + ':' + connection.name)}
              <SystemOverviewProviderCardCompact {connection} {provider} />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </section>
</div>

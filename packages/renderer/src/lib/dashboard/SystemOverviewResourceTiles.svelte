<script lang="ts">
import { faBox, faDesktop, faDharmachakra, faFileImage, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { NavigationPage } from '@podman-desktop/core-api';
import { Icon } from '@podman-desktop/ui-svelte/icons';

import { handleNavigation } from '/@/navigation';
import { containersInfos } from '/@/stores/containers';
import { imagesInfos } from '/@/stores/images';
import { kubernetesCurrentContextState } from '/@/stores/kubernetes-contexts-state';
import { podsInfos } from '/@/stores/pods';
import { providerInfos } from '/@/stores/providers';

let containerStats = $derived.by(() => {
  const total = $containersInfos.length;
  const running = $containersInfos.filter(c => c.State === 'running').length;
  return { running, total };
});

let podStats = $derived.by(() => {
  const total = $podsInfos.length;
  const running = $podsInfos.filter(p => p.Status === 'Running').length;
  return { running, total };
});

let imageCount = $derived($imagesInfos.length);

let machineStats = $derived.by(() => {
  const machines = $providerInfos.flatMap(p => p.containerConnections.filter(c => c.type === 'podman'));
  const total = machines.length;
  const running = machines.filter(m => m.status === 'started').length;
  return { running, total };
});

let kubernetesPodCount = $derived($kubernetesCurrentContextState.resources?.pods ?? 0);

interface TileProps {
  icon: typeof faBox;
  label: string;
  stats: { running?: number; total: number };
  page: NavigationPage;
}

let tiles: TileProps[] = $derived([
  { icon: faBox, label: 'Containers', stats: containerStats, page: NavigationPage.CONTAINERS },
  { icon: faLayerGroup, label: 'Pods', stats: podStats, page: NavigationPage.PODMAN_PODS },
  { icon: faFileImage, label: 'Images', stats: { total: imageCount }, page: NavigationPage.IMAGES },
  { icon: faDesktop, label: 'Machines', stats: machineStats, page: NavigationPage.RESOURCES },
  {
    icon: faDharmachakra,
    label: 'Kubernetes Pods',
    stats: { total: kubernetesPodCount },
    page: NavigationPage.RESOURCES,
  },
]);

function navigateToPage(page: NavigationPage): void {
  handleNavigation({ page });
}
</script>

<div class="grid grid-cols-5 gap-3">
    {#each tiles as tile (tile.label)}
      <button
        class="flex flex-col gap-2 p-3 rounded-lg bg-[var(--pd-content-card-carousel-card-bg)] border border-transparent hover:border-[var(--pd-button-primary-bg)] hover:bg-[var(--pd-content-card-carousel-card-hover-bg)] transition-all cursor-pointer text-left"
        onclick={(): void => navigateToPage(tile.page)}
        aria-label="Navigate to {tile.label}">
        <div class="flex items-center gap-2 text-[var(--pd-content-text)]">
          <Icon icon={tile.icon} size="sm" />
          <span class="text-sm font-medium">{tile.label}</span>
        </div>
        <div class="flex items-baseline gap-3 text-[var(--pd-content-text)]">
          {#if tile.stats.running !== undefined}
            <div class="flex flex-col">
              <span class="text-xs text-[var(--pd-content-text-sub)]">Running</span>
              <span class="text-2xl font-semibold">{tile.stats.running}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-[var(--pd-content-text-sub)]">Total</span>
              <span class="text-2xl font-semibold">{tile.stats.total}</span>
            </div>
          {:else}
            <div class="flex flex-col">
              <span class="text-xs text-[var(--pd-content-text-sub)]">Total</span>
              <span class="text-2xl font-semibold">{tile.stats.total}</span>
            </div>
          {/if}
        </div>
      </button>
    {/each}
</div>

<script lang="ts">
import { faBox, faChevronRight, faDesktop, faFileImage, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { NavigationPage } from '@podman-desktop/core-api';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { filesize } from 'filesize';

import { handleNavigation } from '/@/navigation';
import { containersInfos } from '/@/stores/containers';
import { imagesInfos } from '/@/stores/images';
import { podsInfos } from '/@/stores/pods';
import { providerInfos } from '/@/stores/providers';

interface ResourceTile {
  icon: typeof faBox;
  label: string;
  total: number;
  page: NavigationPage;
  running?: number;
  stopped?: number;
  detail?: string;
}

let containerStats = $derived.by(() => {
  const total = $containersInfos.length;
  const running = $containersInfos.filter(container => container.State === 'running').length;
  return { total, running, stopped: total - running };
});

let podStats = $derived.by(() => {
  const total = $podsInfos.length;
  const running = $podsInfos.filter(pod => pod.Status === 'Running').length;
  return { total, running, stopped: total - running };
});

let imageStats = $derived.by(() => {
  const total = $imagesInfos.length;
  const totalBytes = $imagesInfos.reduce((sum, image) => sum + (image.Size ?? 0), 0);
  const detail =
    totalBytes > 0
      ? filesize(totalBytes, {
          roundingMethod: 'round',
          base: 2,
          standard: 'jedec',
        })
      : undefined;
  return { total, detail };
});

let machineStats = $derived.by(() => {
  const machines = $providerInfos.flatMap(provider =>
    provider.containerConnections.filter(connection => connection.type === 'podman'),
  );
  const total = machines.length;
  const running = machines.filter(machine => machine.status === 'started').length;
  return { total, running, stopped: total - running };
});

let tiles: ResourceTile[] = $derived([
  {
    icon: faBox,
    label: 'Containers',
    total: containerStats.total,
    running: containerStats.running,
    stopped: containerStats.stopped,
    page: NavigationPage.CONTAINERS,
  },
  {
    icon: faLayerGroup,
    label: 'Pods',
    total: podStats.total,
    running: podStats.running,
    stopped: podStats.stopped,
    page: NavigationPage.PODMAN_PODS,
  },
  {
    icon: faFileImage,
    label: 'Images',
    total: imageStats.total,
    detail: imageStats.detail,
    page: NavigationPage.IMAGES,
  },
  {
    icon: faDesktop,
    label: 'Machines',
    total: machineStats.total,
    running: machineStats.running,
    stopped: machineStats.stopped,
    page: NavigationPage.RESOURCES,
  },
]);

function navigateToTile(tile: ResourceTile): void {
  handleNavigation({ page: tile.page });
}

function openManageResources(): void {
  handleNavigation({ page: NavigationPage.RESOURCES });
}
</script>

<section aria-label="Resources">
  <div class="mb-1.5 flex items-center justify-between gap-3">
    <div class="text-lg font-semibold text-[var(--pd-content-card-header-text)]">Resources</div>
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm font-medium text-[var(--pd-button-primary-bg)] hover:underline"
      onclick={openManageResources}
      aria-label="Manage Resources">
      Manage Resources
      <Icon icon={faChevronRight} size="xs" />
    </button>
  </div>

  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {#each tiles as tile (tile.label)}
      <button
        type="button"
        class="flex min-h-[132px] flex-col gap-3 rounded-lg border border-transparent bg-[var(--pd-content-card-carousel-card-bg)] p-4 text-left transition-colors hover:border-[var(--pd-button-primary-bg)] hover:bg-[var(--pd-content-card-carousel-card-hover-bg)]"
        onclick={(): void => navigateToTile(tile)}
        aria-label="View {tile.label}">
        <div class="flex items-center gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--pd-content-card-bg)] text-[var(--pd-content-text-sub)]">
            <Icon icon={tile.icon} size="sm" />
          </div>
          <span class="text-3xl font-semibold leading-none text-[var(--pd-content-card-header-text)]">{tile.total}</span>
        </div>

        <div class="text-sm font-medium text-[var(--pd-content-card-text)]">{tile.label}</div>

        <div class="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--pd-content-text-sub)]">
          {#if tile.detail}
            <span>{tile.detail}</span>
          {:else if tile.running !== undefined}
            {#if tile.running > 0}
              <span class="inline-flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full bg-[var(--pd-status-running)]"
                  aria-hidden="true"></span>
                {tile.running} running
              </span>
            {/if}
            {#if tile.stopped !== undefined && tile.stopped > 0}
              <span class="inline-flex items-center gap-1.5">
                <span
                  class="h-1.5 w-1.5 rounded-full bg-[var(--pd-status-stopped)]"
                  aria-hidden="true"></span>
                {tile.stopped} stopped
              </span>
            {/if}
            {#if tile.running === 0 && tile.stopped === 0}
              <span>No resources</span>
            {/if}
          {/if}
        </div>
      </button>
    {/each}
  </div>
</section>

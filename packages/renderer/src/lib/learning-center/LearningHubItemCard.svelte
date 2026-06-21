<script lang="ts">
import { faFileLines, faPlay, faRocket, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';

import type { LearningHubItem } from './learning-hub-utils';

interface Props {
  item: LearningHubItem;
  width?: number;
  height?: number;
  onOpen?: (item: LearningHubItem) => void | Promise<void>;
}

let { item, width = 300, height = 300, onOpen }: Props = $props();

const iconByKind = {
  video: faPlay,
  article: faFileLines,
  release: faRocket,
  community: faUsers,
} as const;

async function openItem(): Promise<void> {
  await onOpen?.(item);
  await window.openExternal(item.url);
}
</script>

<div
  class="relative flex min-h-[{height}px] min-w-[{width}px] flex-1 flex-col rounded-lg bg-[var(--pd-content-card-carousel-card-bg)] pb-4 hover:bg-[var(--pd-content-card-carousel-card-hover-bg)]">
  {#if item.isNew}
    <div
      aria-label="New content"
      class="absolute right-3 top-3 h-[6px] w-[6px] rounded-full bg-[var(--pd-notification-dot)]"></div>
  {/if}

  <div class="flex flex-col pt-4">
    <div class="px-4">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--pd-content-card-bg)] text-[var(--pd-content-text-sub)]">
        <Icon icon={iconByKind[item.kind]} size="lg" />
      </div>
    </div>
    <div class="text-nowrap px-4 pt-4 font-semibold text-[var(--pd-content-card-carousel-card-header-text)]">
      {item.title}
    </div>
    <p class="line-clamp-4 px-4 pt-4 text-[var(--pd-content-card-carousel-card-text)]">{item.subtitle}</p>
  </div>

  <div class="flex flex-1 items-end justify-center pt-4">
    <Button class="justify-self-center self-end" on:click={(): Promise<void> => openItem()} title="Get started"
      >Get started</Button>
  </div>
</div>

<script lang="ts">
import type { Guide } from '@podman-desktop/core-api/learning-center';
import { Button } from '@podman-desktop/ui-svelte';

interface Props {
  guide: Guide;
  width?: number;
  height?: number;
  isNew?: boolean;
  onViewed?: () => void | Promise<void>;
}

let { guide, width = 300, height = 300, isNew = false, onViewed }: Props = $props();

async function openGuide(guide: Guide): Promise<void> {
  await onViewed?.();
  await window.telemetryTrack('openLearningCenterGuide', {
    guideId: guide.id,
  });
  await window.openExternal(guide.url);
}
</script>

<div
  class="flex flex-col flex-1 relative bg-[var(--pd-content-card-carousel-card-bg)] pb-4 rounded-lg hover:bg-[var(--pd-content-card-carousel-card-hover-bg)] min-w-[{width}px] min-h-[{height}px]">
  {#if isNew}
    <div
      aria-label="New guide"
      class="absolute top-3 right-3 w-[6px] h-[6px] bg-[var(--pd-notification-dot)] rounded-full"></div>
  {/if}
  <div class="pt-4 flex flex-col">
    <div class="px-4">
      <img src={`data:image/png;base64,${guide.icon}`} class="h-[48px]" alt={guide.id} />
    </div>
    <div class="px-4 pt-4 text-nowrap text-[var(--pd-content-card-carousel-card-header-text)] font-semibold">
      {guide.title}
    </div>
    <p class="line-clamp-4 px-4 pt-4 text-[var(--pd-content-card-carousel-card-text)]">{guide.description}</p>
  </div>
  <div class="flex justify-center items-end flex-1 pt-4">
    <Button class="justify-self-center self-end" on:click={(): Promise<void> => openGuide(guide)} title="Get started"
      >Get started</Button>
  </div>
</div>

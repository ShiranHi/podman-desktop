<script lang="ts">
import { ContextMenu, type OpenMode } from '@podman-desktop/ui-svelte';

import {
  buildOpenContextMenuActions,
  openImageInWorkspace,
  openManifestInWorkspace,
} from '/@/lib/layout/resource-open-actions';
import Badge from '/@/lib/ui/Badge.svelte';

import type { ImageInfoUI } from './ImageInfoUI';

interface Props {
  object: ImageInfoUI;
}

let { object }: Props = $props();

let contextMenu: { x: number; y: number } | undefined = $state();

function onClick(_event: MouseEvent): void {
  if (object.isManifest) {
    openManifestInWorkspace(object, 'newTab');
    return;
  }
  openImageInWorkspace(object, 'newTab');
}

function onContextMenu(event: MouseEvent): void {
  event.preventDefault();
  contextMenu = { x: event.clientX, y: event.clientY };
}

function openInMode(mode: OpenMode): void {
  if (object.isManifest) {
    openManifestInWorkspace(object, mode);
  } else {
    openImageInWorkspace(object, mode);
  }
}
</script>

<button class="flex flex-col max-w-full" onclick={onClick} oncontextmenu={onContextMenu}>
  <div class="flex flex-row gap-1 items-center max-w-full">
    <div class="text-[var(--pd-table-body-text-highlight)] overflow-hidden text-ellipsis">
      {object.name}
      {object.isManifest ? ' (manifest)' : ''}
    </div>
    {#if object.badges.length}
      {#each object.badges as badge, index (index)}
        <Badge color={badge.color} label={badge.label} />
      {/each}
    {/if}
  </div>
  <div class="flex flex-row text-sm gap-1 w-full">
    <div class="text-[var(--pd-table-body-text-sub-secondary)]">{object.shortId}</div>
    <div class="font-extra-light text-[var(--pd-table-body-text)] overflow-hidden text-ellipsis">{object.tag}</div>
  </div>
</button>

{#if contextMenu}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    actions={buildOpenContextMenuActions(openInMode)}
    onClose={(): void => {
      contextMenu = undefined;
    }} />
{/if}

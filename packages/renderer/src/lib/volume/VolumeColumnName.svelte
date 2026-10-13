<script lang="ts">
import { ContextMenu } from '@podman-desktop/ui-svelte';

import { buildOpenContextMenuActions, openVolumeInWorkspace } from '/@/lib/layout/resource-open-actions';
import { activatePageTab } from '/@/stores/layout/layout-store.svelte';
import { linkOpenMode } from '/@/stores/layout/tab-preferences.svelte';

import type { VolumeInfoUI } from './VolumeInfoUI';

interface Props {
  object: VolumeInfoUI;
}

let { object }: Props = $props();

let contextMenu: { x: number; y: number } | undefined = $state();

function onClick(event: MouseEvent): void {
  activatePageTab();
  openVolumeInWorkspace(object, linkOpenMode(event));
}

function onContextMenu(event: MouseEvent): void {
  event.preventDefault();
  contextMenu = { x: event.clientX, y: event.clientY };
}
</script>

<button
  class="hover:cursor-pointer flex text-[var(--pd-table-body-text-highlight)] max-w-full overflow-hidden text-ellipsis"
  onclick={onClick}
  oncontextmenu={onContextMenu}>
  {object.shortName}
</button>

{#if contextMenu}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    actions={buildOpenContextMenuActions((mode): void => openVolumeInWorkspace(object, mode))}
    onClose={(): void => {
      contextMenu = undefined;
    }} />
{/if}

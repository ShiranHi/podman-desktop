<script lang="ts">
import { ContextMenu } from '@podman-desktop/ui-svelte';

import { buildOpenContextMenuActions, openPodInWorkspace } from '/@/lib/layout/resource-open-actions';

import type { PodInfoUI } from './PodInfoUI';

interface Props {
  object: PodInfoUI;
}

let { object }: Props = $props();

let contextMenu: { x: number; y: number } | undefined;

// A plain click opens straight into the workspace as a new tab alongside whatever's
// already open - no intermediate detail route/flash, and existing tabs are never removed.
function onClick(_event: MouseEvent): void {
  openPodInWorkspace(object, 'newTab');
}

function onContextMenu(event: MouseEvent): void {
  event.preventDefault();
  contextMenu = { x: event.clientX, y: event.clientY };
}
</script>

<button class="hover:cursor-pointer flex flex-col max-w-full text-left" onclick={onClick} oncontextmenu={onContextMenu}>
  <div class="text-[var(--pd-table-body-text-highlight)] max-w-full overflow-hidden text-ellipsis">
    {object.name}
  </div>
  <div class="flex flex-row text-sm gap-1">
    <div class="text-[var(--pd-table-body-text)]">
      {object.shortId}
    </div>
  </div>
</button>

{#if contextMenu}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    actions={buildOpenContextMenuActions((mode): void => openPodInWorkspace(object, mode))}
    onClose={(): void => {
      contextMenu = undefined;
    }} />
{/if}

<script lang="ts">
import { ContextMenu } from '@podman-desktop/ui-svelte';

import { buildOpenContextMenuActions, openContainerInWorkspace } from '/@/lib/layout/resource-open-actions';

import type { ContainerInfoUI } from './ContainerInfoUI';

interface Props {
  object: ContainerInfoUI;
}

let { object }: Props = $props();

let contextMenu: { x: number; y: number } | undefined = $state();

// A plain click opens straight into the workspace as a new tab alongside whatever's
// already open - no intermediate detail route/flash, and existing tabs are never removed.
function onClick(_event: MouseEvent): void {
  openContainerInWorkspace(object, 'newTab');
}

function onContextMenu(event: MouseEvent): void {
  event.preventDefault();
  contextMenu = { x: event.clientX, y: event.clientY };
}
</script>

<button
  class="flex flex-col whitespace-nowrap max-w-full"
  onclick={onClick}
  oncontextmenu={onContextMenu}>
  <div class="flex items-center max-w-full">
    <div class="max-w-full">
      <div class="flex flex-nowrap max-w-full">
        <div
          class="text-[var(--pd-table-body-text-highlight)] overflow-hidden text-ellipsis group-hover:text-[var(--pd-link)]"
          title={object.name}>
          {object.name}
        </div>
      </div>
      <div class="flex flex-nowrap text-xs font-extra-light text-[var(--pd-table-body-text)] items-center max-w-full">
        <div>{object.state}</div>
        <div class="pl-2 max-w-fit overflow-hidden text-ellipsis">{object.displayPort}</div>
      </div>
    </div>
  </div>
</button>

{#if contextMenu}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    actions={buildOpenContextMenuActions((mode): void => openContainerInWorkspace(object, mode))}
    onClose={(): void => {
      contextMenu = undefined;
    }} />
{/if}

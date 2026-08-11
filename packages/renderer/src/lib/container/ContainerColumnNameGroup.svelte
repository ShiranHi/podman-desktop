<script lang="ts">
import { ContextMenu, type OpenMode } from '@podman-desktop/ui-svelte';

import {
  buildOpenContextMenuActions,
  openComposeInWorkspace,
  openPodInWorkspace,
} from '/@/lib/layout/resource-open-actions';

import type { ContainerGroupInfoUI } from './ContainerInfoUI';
import { ContainerGroupInfoTypeUI } from './ContainerInfoUI';

interface Props {
  object: ContainerGroupInfoUI;
}

let { object }: Props = $props();

let contextMenu: { x: number; y: number } | undefined = $state();

function displayContainersCount(containerGroup: ContainerGroupInfoUI): string {
  let result = containerGroup.allContainersCount + ' container' + (containerGroup.allContainersCount > 1 ? 's' : '');
  if (containerGroup.containers.length !== containerGroup.allContainersCount) {
    result += ` (${containerGroup.allContainersCount - containerGroup.containers.length} filtered)`;
  }
  return result;
}

function onClick(_event: MouseEvent): void {
  if (!object.engineId) return;
  if (object.type === ContainerGroupInfoTypeUI.POD) {
    openPodInWorkspace({ name: object.name, engineId: object.engineId }, 'newTab');
  } else {
    openComposeInWorkspace({ name: object.name, engineId: object.engineId }, 'newTab');
  }
}

function onContextMenu(event: MouseEvent): void {
  if (!object.engineId) return;
  event.preventDefault();
  contextMenu = { x: event.clientX, y: event.clientY };
}

function openInMode(mode: OpenMode): void {
  if (!object.engineId) return;
  if (object.type === ContainerGroupInfoTypeUI.POD) {
    openPodInWorkspace({ name: object.name, engineId: object.engineId }, mode);
  } else {
    openComposeInWorkspace({ name: object.name, engineId: object.engineId }, mode);
  }
}
</script>

<button
  class="flex flex-col text-[var(--pd-table-body-text-highlight)] max-w-full text-left"
  title={object.type}
  onclick={onClick}
  oncontextmenu={onContextMenu}>
  <div class="max-w-full overflow-hidden text-ellipsis">
    {object.name} ({object.type})
  </div>
  <div class="text-sm font-extra-light text-[var(--pd-table-body-text)]">
    {displayContainersCount(object)}
  </div>
</button>

{#if contextMenu && object.engineId}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    actions={buildOpenContextMenuActions(openInMode)}
    onClose={(): void => {
      contextMenu = undefined;
    }} />
{/if}

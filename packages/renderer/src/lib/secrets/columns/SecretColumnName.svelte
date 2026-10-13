<script lang="ts">
import { ContextMenu } from '@podman-desktop/ui-svelte';

import { buildOpenContextMenuActions, openSecretInWorkspace } from '/@/lib/layout/resource-open-actions';
import type { SecretInfoUI } from '/@/lib/secrets/SecretInfoUI';
import { activatePageTab } from '/@/stores/layout/layout-store.svelte';
import { linkOpenMode } from '/@/stores/layout/tab-preferences.svelte';

interface Props {
  object: SecretInfoUI;
}

let { object }: Props = $props();

let contextMenu: { x: number; y: number } | undefined = $state();

function onClick(event: MouseEvent): void {
  activatePageTab();
  openSecretInWorkspace(object, linkOpenMode(event));
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
  {object.Name}
</button>

{#if contextMenu}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    actions={buildOpenContextMenuActions((mode): void => openSecretInWorkspace(object, mode))}
    onClose={(): void => {
      contextMenu = undefined;
    }} />
{/if}

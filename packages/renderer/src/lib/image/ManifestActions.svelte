<script lang="ts">
import { faArrowUp, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createEventDispatcher } from 'svelte';

import { withConfirmation } from '/@/lib/dialogs/messagebox-utils';
import ListItemButtonIcon from '/@/lib/ui/ListItemButtonIcon.svelte';

import ActionsWrapper from './ActionsMenu.svelte';
import type { ImageInfoUI } from './ImageInfoUI';

interface Props {
  onPushManifest: (manifestInfo: ImageInfoUI) => void;
  manifest: ImageInfoUI;
  dropdownMenu?: boolean;
  /** When true, all actions (including delete) go in the kebab menu. */
  menuOnly?: boolean;
  detailed?: boolean;
}

let {
  onPushManifest,
  manifest = $bindable(),
  dropdownMenu = false,
  menuOnly = false,
  detailed = false,
}: Props = $props();

const asMenu = $derived(dropdownMenu || menuOnly);

const dispatch = createEventDispatcher<{ update: ImageInfoUI }>();

async function pushManifest(): Promise<void> {
  onPushManifest(manifest);
}

async function deleteManifest(): Promise<void> {
  manifest.status = 'DELETING';
  dispatch('update', manifest);
  try {
    await window.removeManifest(manifest.engineId, manifest.name);
  } catch (error) {
    await onError(`Error while deleting manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function onError(error: string): Promise<void> {
  await window.showMessageBox({
    title: 'Delete Manifest Failed',
    message: error,
    type: 'error',
    buttons: ['Dismiss'],
  });
}
</script>

{#if !menuOnly}
  <ListItemButtonIcon
    title="Delete Manifest"
    onClick={(): void => withConfirmation(deleteManifest, `delete manifest ${manifest.name}`, { title: 'Delete Manifest?', variant: 'delete' })}
    detailed={detailed}
    icon={faTrash}
    enabled={manifest.status === 'UNUSED'} />
{/if}

<!-- If dropdownMenu / menuOnly is true, use kebab; otherwise just show the regular buttons -->
<ActionsWrapper dropdownMenu={asMenu}>
  {#if menuOnly}
    <ListItemButtonIcon
      title="Delete Manifest"
      onClick={(): void => withConfirmation(deleteManifest, `delete manifest ${manifest.name}`, { title: 'Delete Manifest?', variant: 'delete' })}
      menu={true}
      detailed={detailed}
      icon={faTrash}
      enabled={manifest.status === 'UNUSED'} />
  {/if}
  <ListItemButtonIcon
    title="Push Manifest"
    onClick={pushManifest}
    menu={asMenu}
    detailed={detailed}
    icon={faArrowUp} />
</ActionsWrapper>

<script lang="ts">
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Button, DropdownMenu } from '@podman-desktop/ui-svelte';

import type { EngineInfoUI } from './EngineInfoUI';

interface Props {
  type: 'containers' | 'images' | 'pods' | 'volumes'; // Imported type for prune (containers, images, pods, volumes)
  engines: EngineInfoUI[]; // List of engines that the prune will work on
}

let { type, engines }: Props = $props();

/** When true, render as a dropdown menu item instead of a header Button. */
export let asMenuItem = false;

const LABEL_IMAGE_UNUSED = 'All unused images';
const LABEL_IMAGE_UNTAGGED = 'All untagged images';

async function openPruneDialog(): Promise<void> {
  let message = 'This action will prune';

  if (type === 'images') {
    message += ' images';
  } else {
    message += ` all unused ${type}`;
  }
  if (engines.length > 1) {
    message += ' from all container engines.';
  } else {
    message += ' from the ' + engines[0].name + ' engine.';
  }

  const buttons: string[] = [];
  const cancel = 'Cancel';
  buttons.push(cancel);
  if (type === 'images') {
    buttons.push(LABEL_IMAGE_UNUSED);
    buttons.push(LABEL_IMAGE_UNTAGGED);
  } else {
    buttons.push('Prune');
  }

  const result = await window.showMessageBox({
    title: `Prune ${type.charAt(0).toUpperCase() + type.slice(1)}?`,
    type: 'danger',
    message: message,
    buttons,
  });

  if (result.response !== undefined && result.response !== cancel) {
    await prune(type, result.response);
  }
}

// Function to prune the selected type: containers, pods, images and volumes
async function prune(type: string, selectedItemLabel: string): Promise<void> {
  switch (type) {
    case 'containers':
      for (let engine of engines) {
        try {
          await window.pruneContainers(engine.id);
        } catch (error) {
          console.error(error);
        }
      }
      break;
    case 'pods':
      for (let engine of engines) {
        try {
          await window.prunePods(engine.id);
        } catch (error) {
          console.error(error);
        }
      }
      break;
    case 'volumes':
      for (let engine of engines) {
        try {
          await window.pruneVolumes(engine.id);
        } catch (error) {
          console.error(error);
        }
      }
      break;
    case 'images':
      for (let engine of engines) {
        try {
          await window.pruneImages(engine.id, selectedItemLabel === LABEL_IMAGE_UNUSED);
        } catch (error) {
          console.error(error);
        }
      }
      break;
    default:
      console.error('Prune type not found');
      break;
  }
}
</script>

{#if asMenuItem}
  <DropdownMenu.Item title="Prune" tooltip="Remove unused {type}" icon={faTrash} onClick={openPruneDialog} />
{:else}
  <Button type="secondary" on:click={openPruneDialog} title="Remove unused {type}" icon={faTrash}>Prune</Button>
{/if}

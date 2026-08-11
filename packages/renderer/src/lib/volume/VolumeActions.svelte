<script lang="ts">
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import type { Menu } from '@podman-desktop/core-api';
import { MenuContext } from '@podman-desktop/core-api';
import { DropdownMenu } from '@podman-desktop/ui-svelte';
import { createEventDispatcher, onMount } from 'svelte';

import ContributionActions from '/@/lib/actions/ContributionActions.svelte';
import { withConfirmation } from '/@/lib/dialogs/messagebox-utils';
import { withPrototypeActionDelay } from '/@/lib/layout/compact-nav-action-status.svelte';
import FlatMenu from '/@/lib/ui/FlatMenu.svelte';
import ListItemButtonIcon from '/@/lib/ui/ListItemButtonIcon.svelte';

import type { VolumeInfoUI } from './VolumeInfoUI';

interface Props {
  volume: VolumeInfoUI;
  dropdownMenu?: boolean;
  /** When true, all actions (including delete) go in the kebab menu. */
  menuOnly?: boolean;
  detailed?: boolean;
  onUpdate?: (update: VolumeInfoUI) => void;
}

const dispatch = createEventDispatcher<{ update: VolumeInfoUI }>();

let {
  volume,
  dropdownMenu = false,
  menuOnly = false,
  detailed = false,
  onUpdate = (update: VolumeInfoUI): void => {
    dispatch('update', update);
  },
}: Props = $props();

const asMenu = $derived(dropdownMenu || menuOnly);

let contributions: Menu[] = $state([]);
onMount(async () => {
  try {
    contributions = await window.getContributedMenus(MenuContext.DASHBOARD_VOLUME);
  } catch (error) {
    console.error('Error fetching contributed menus for volumes:', error);
  }
});

async function removeVolume(): Promise<void> {
  volume.status = 'DELETING';
  onUpdate(volume);

  if (menuOnly) {
    await withPrototypeActionDelay(() => window.removeVolume(volume.engineId, volume.name));
  } else {
    await window.removeVolume(volume.engineId, volume.name);
  }
}

// If dropdownMenu / menuOnly = true, use kebab; otherwise flat icons.
let MenuComponent = $derived(asMenu ? DropdownMenu : FlatMenu);
</script>

{#if !menuOnly && volume.status === 'UNUSED'}
  <ListItemButtonIcon
    title="Delete Volume"
    onClick={(): void => withConfirmation(removeVolume, `delete volume ${volume.name}`, { title: 'Delete Volume?', variant: 'delete' })}
    detailed={detailed}
    icon={faTrash} />
{/if}

<MenuComponent>
  {#if menuOnly && volume.status === 'UNUSED'}
    <ListItemButtonIcon
      title="Delete Volume"
      onClick={(): void => withConfirmation(removeVolume, `delete volume ${volume.name}`, { title: 'Delete Volume?', variant: 'delete' })}
      menu={true}
      detailed={detailed}
      icon={faTrash} />
  {/if}
  <ContributionActions
    args={[volume]}
    contextPrefix="volumeItem"
    dropdownMenu={asMenu}
    contributions={contributions}
    detailed={detailed}
    onError={(errorMessage: string): void => console.error(errorMessage)} />
</MenuComponent>

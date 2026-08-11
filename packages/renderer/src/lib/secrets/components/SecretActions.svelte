<script lang="ts">
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import type { Menu, SecretInfo } from '@podman-desktop/core-api';
import { MenuContext } from '@podman-desktop/core-api';
import { DropdownMenu } from '@podman-desktop/ui-svelte';

import ContributionActions from '/@/lib/actions/ContributionActions.svelte';
import { withConfirmation } from '/@/lib/dialogs/messagebox-utils';
import FlatMenu from '/@/lib/ui/FlatMenu.svelte';
import ListItemButtonIcon from '/@/lib/ui/ListItemButtonIcon.svelte';

interface Props {
  object: SecretInfo;
  dropdownMenu?: boolean;
  /** When true, all actions (including delete) go in the kebab menu. */
  menuOnly?: boolean;
  detailed?: boolean;
}

let { object, dropdownMenu = true, menuOnly = false, detailed = false }: Props = $props();

let loading: boolean = $state(false);
let contributions: Promise<Menu[]> = $derived(window.getContributedMenus(MenuContext.DASHBOARD_SECRET));

const asMenu = $derived(dropdownMenu || menuOnly);
const MenuComponent = $derived(asMenu ? DropdownMenu : FlatMenu);

function onDeleteSecret(): void {
  withConfirmation(
    async () => {
      try {
        loading = true;
        await window.removeSecret(object.engineId, object.Id);
      } finally {
        loading = false;
      }
    },
    `delete secret ${object.Name}`,
    { title: 'Delete Secret?', variant: 'delete' },
  );
}
</script>

{#if menuOnly}
  <MenuComponent>
    <ListItemButtonIcon
      title="Delete Secret"
      onClick={onDeleteSecret}
      menu={true}
      icon={faTrash}
      inProgress={loading}
      detailed={detailed}
      enabled={true} />
    {#await contributions then menus}
      <ContributionActions
        args={[object]}
        contextPrefix="secretItem"
        dropdownMenu={true}
        contributions={menus}
        detailed={detailed}
        onError={(errorMessage: string): void => console.error(errorMessage)} />
    {/await}
  </MenuComponent>
{:else}
  <ListItemButtonIcon
    title="Delete Secret"
    onClick={onDeleteSecret}
    icon={faTrash}
    inProgress={loading}
    detailed={detailed}
    enabled={true} />

  {#await contributions then menus}
    {#if menus.length > 0}
      <MenuComponent>
        <ContributionActions
          args={[object]}
          contextPrefix="secretItem"
          dropdownMenu={dropdownMenu}
          contributions={menus}
          detailed={detailed}
          onError={(errorMessage: string): void => console.error(errorMessage)} />
      </MenuComponent>
    {/if}
  {/await}
{/if}

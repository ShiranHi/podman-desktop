<svelte:options runes={true} />

<script lang="ts">
import { Icon } from '@podman-desktop/ui-svelte/icons';
import type { TinroRouteMeta } from 'tinro';

import { navigateToAppPage } from '/@/stores/layout/layout-store.svelte';
import type { NavigationRegistryEntry } from '/@/stores/navigation/navigation-registry';
import { currentScreen, isTabsLayoutScreen } from '/@/stores/prototype';

import NavItem from './NavItem.svelte';

interface NavRegistryEntryProps {
  entry: NavigationRegistryEntry;
  meta: TinroRouteMeta;
  expanded: boolean;
}

let { entry, meta = $bindable(), expanded = false }: NavRegistryEntryProps = $props();

const usePageTabNav = $derived(isTabsLayoutScreen($currentScreen));

/** In tabs prototypes, focus the permanent primary tab when leaving a details tab. */
function onNavClick(): void {
  navigateToAppPage(entry.link, entry.name);
}
</script>

{#if !entry.hidden}
  <NavItem
    href={entry.link}
    counter={entry.counter}
    tooltip={entry.tooltip}
    ariaLabel={entry.name}
    bind:meta={meta}
    {expanded}
    onClick={usePageTabNav ? onNavClick : undefined}>
    <div class="flex items-center w-full">
      <div class="flex-shrink-0 flex items-center justify-center w-6">
        {#if entry.icon === undefined}
          {entry.name}
        {:else if entry.icon.faIcon}
          <Icon icon={entry.icon.faIcon.definition} size={entry.icon.faIcon.size} />
        {:else if entry.icon.iconComponent}
          <!-- svelte-ignore svelte_component_deprecated -->
          <svelte:component this={entry.icon.iconComponent} size="24" />
        {:else if entry.icon.iconImage && typeof entry.icon.iconImage === 'string'}
          <img src={entry.icon.iconImage} width="22" height="22" alt={entry.name} />
        {/if}
      </div>
      {#if expanded && entry.icon}
        <div class="text-sm truncate ml-3 flex-1 min-w-0" aria-label={`${entry.name} title`}>
          {entry.name}
        </div>
      {/if}
    </div>
  </NavItem>
{/if}

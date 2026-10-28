<script lang="ts">
import type { IConfigurationPropertyRecordedSchema } from '@desktop-framework/api/configuration';
import { faPuzzlePiece, faSliders } from '@fortawesome/free-solid-svg-icons';
import { Button, ChevronExpander, SearchInput } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { onDestroy, onMount, tick } from 'svelte';
import type { Unsubscriber } from 'svelte/store';
import { router } from 'tinro';

import type { ContextUI } from '/@/lib/context/context';
import ExtensionIcon from '/@/lib/preferences/ExtensionIcon.svelte';
import type { CombinedExtensionInfoUI } from '/@/stores/all-installed-extensions';
import { combinedInstalledExtensions } from '/@/stores/all-installed-extensions';
import { context } from '/@/stores/context';

import { groupExtensionSettings } from './extension-settings';
import PreferencesRenderingItem from './PreferencesRenderingItem.svelte';
import SettingsPage from './SettingsPage.svelte';

interface Props {
  properties: IConfigurationPropertyRecordedSchema[];
  // extension identifier to expand when arriving from the extensions page
  focus?: string;
}

let { properties = [], focus }: Props = $props();

interface ExtensionSettings {
  id: string;
  title: string;
  extension?: CombinedExtensionInfoUI;
  records: IConfigurationPropertyRecordedSchema[];
}

let globalContext = $state<ContextUI>();
let contextUnsubscriber: Unsubscriber | undefined;
let extensionsUnsubscriber: Unsubscriber | undefined;
let installedExtensions: CombinedExtensionInfoUI[] = $state([]);
let searchValue = $state('');
let expanded: Record<string, boolean> = $state({});

onMount(() => {
  contextUnsubscriber = context.subscribe(value => {
    globalContext = value;
  });

  extensionsUnsubscriber = combinedInstalledExtensions.subscribe(value => {
    installedExtensions = value;
  });
});

onDestroy(() => {
  contextUnsubscriber?.();
  extensionsUnsubscriber?.();
});

// a prototype deep link can ask for one extension to be expanded on arrival
$effect(() => {
  if (focus && !expanded[focus]) {
    expanded = { ...expanded, [focus]: true };
  }
});

// bring the extension asked by the deep link into view once it is rendered
$effect(() => {
  const focused = focus;
  if (!focused) {
    return;
  }
  tick()
    .then(() => document.getElementById(`extension-settings-${focused}`)?.scrollIntoView({ block: 'center' }))
    .catch(() => undefined);
});

function matchValue(text: string | undefined, value: string): boolean {
  if (!text) {
    return false;
  }
  return text.toLowerCase().includes(value.toLowerCase());
}

// extensions may declare an empty display name, fall back to the first meaningful value
function firstNotEmpty(...values: (string | undefined)[]): string | undefined {
  return values.find(value => !!value?.trim());
}

const extensionSettings: ExtensionSettings[] = $derived.by(() => {
  const groups = groupExtensionSettings(properties, globalContext);

  return [...groups.entries()]
    .map(([id, records]) => {
      const extension = installedExtensions.find(item => item.id === id);
      // fall back to the configuration title ("Extension: <title>") when the extension is not installed anymore
      const title = firstNotEmpty(
        extension?.displayName,
        extension?.name,
        records[0]?.title.replace(/^Extension:\s*/, ''),
        records[0]?.parentId.replace(/^preferences\./, ''),
      );
      return {
        id,
        title: title ?? id,
        extension,
        records,
      };
    })
    .toSorted((a, b) => a.title.localeCompare(b.title));
});

const matchingExtensions: ExtensionSettings[] = $derived.by(() => {
  if (!searchValue) {
    return extensionSettings;
  }
  return extensionSettings.filter(
    group =>
      matchValue(group.title, searchValue) ||
      group.records.some(
        record =>
          matchValue(record.title, searchValue) ||
          matchValue(record.description, searchValue) ||
          matchValue(record.markdownDescription, searchValue),
      ),
  );
});

// searching always reveals the settings that match
function isExpanded(group: ExtensionSettings): boolean {
  return !!searchValue || !!expanded[group.id];
}

function toggle(group: ExtensionSettings): void {
  expanded = { ...expanded, [group.id]: !expanded[group.id] };
}

function settingsCount(count: number): string {
  return count === 1 ? '1 setting' : `${count} settings`;
}
</script>

<SettingsPage title="Extension settings">
  {#snippet subtitle()}
    Settings provided by the extensions installed in Podman Desktop. Only extensions that expose settings are listed.
  {/snippet}
  {#snippet header()}
    <SearchInput title="extension settings" class="mt-4" bind:searchTerm={searchValue} />
  {/snippet}

  <div class="flex flex-col space-y-3 text-[var(--pd-content-header)] pb-2">
    {#if extensionSettings.length === 0}
      <div class="flex flex-col items-center text-center space-y-2 py-10" role="region" aria-label="No extension settings">
        <Icon
          icon={faPuzzlePiece}
          size="2.5x"
          class="text-[var(--pd-invert-content-info-icon)]"
          ariaHidden={true} />
        <div class="text-lg font-medium">No extension settings yet</div>
        <div class="text-sm text-[var(--pd-invert-content-header2-text)] max-w-[420px]">
          None of the installed extensions provides settings. Extensions that do will show up here.
        </div>
        <Button type="secondary" icon={faSliders} on:click={(): void => router.goto('/extensions')}>
          Browse extensions
        </Button>
      </div>
    {:else if matchingExtensions.length === 0}
      <div class="py-6 text-center" role="region" aria-label="No matching extension settings">
        No settings found for "{searchValue}".
      </div>
    {:else}
      {#each matchingExtensions as group (group.id)}
        <div
          id="extension-settings-{group.id}"
          class="bg-[var(--pd-invert-content-card-bg)] rounded-md"
          role="region"
          aria-label="{group.title} settings">
          <button
            type="button"
            class="w-full flex flex-row items-center gap-3 p-3 text-left cursor-pointer"
            aria-expanded={isExpanded(group)}
            aria-label="Toggle {group.title} settings"
            onclick={(): void => toggle(group)}>
            {#if group.extension}
              <ExtensionIcon extension={group.extension} />
            {:else}
              <Icon icon={faPuzzlePiece} size="1.6x" class="text-[var(--pd-invert-content-info-icon)]" />
            {/if}
            <div class="flex flex-col grow min-w-0">
              <span class="font-semibold text-[var(--pd-invert-content-card-text)] truncate">{group.title}</span>
              <span class="text-sm text-[var(--pd-invert-content-header2-text)]">
                {settingsCount(group.records.length)}
                {#if group.extension?.version}&middot; v{group.extension.version}{/if}
              </span>
            </div>
            <ChevronExpander expanded={isExpanded(group)} />
          </button>

          {#if isExpanded(group)}
            <div class="flex flex-col space-y-2 px-2 pb-3 border-t border-[var(--pd-invert-content-divider)]">
              {#each group.records as record (record.id)}
                <div class="bg-[var(--pd-invert-content-bg)] rounded-md mt-2">
                  <PreferencesRenderingItem {record} />
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
      <div class="text-sm text-[var(--pd-invert-content-header2-text)] pt-1">
        Install, remove, or update extensions on the <a class="underline" href="/extensions">Extensions</a> page.
      </div>
    {/if}
  </div>
</SettingsPage>

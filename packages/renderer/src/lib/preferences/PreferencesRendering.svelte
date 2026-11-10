<script lang="ts">
import type { IConfigurationPropertyRecordedSchema } from '@desktop-framework/api/configuration';
import { Button, SearchInput } from '@podman-desktop/ui-svelte';
import { onDestroy, onMount } from 'svelte';
import { type Unsubscriber } from 'svelte/store';

import type { ContextUI } from '/@/lib/context/context';
import Route from '/@/Route.svelte';
import { context } from '/@/stores/context';

import ExperimentalSettings from './ExperimentalSettings.svelte';
import { groupSectionsIntoTabs, type SettingsSection, type SettingsTab } from './general-settings-tabs';
import PreferencesProxiesForm from './PreferencesProxiesForm.svelte';
import PreferencesSections from './PreferencesSections.svelte';
import SettingsPage from './SettingsPage.svelte';
import { isDefaultScope, isPropertyValidInContext } from './Util';

interface Props {
  properties: IConfigurationPropertyRecordedSchema[];
  key: string;
  searchValue?: string;
  // when true, settings contributed by extensions are excluded (they live in the extensions settings hub)
  globalOnly?: boolean;
}

let { properties = [], key, searchValue = '', globalOnly = false }: Props = $props();

// Context variables
let contextsUnsubscribe: Unsubscriber;
let globalContext: ContextUI;

// Search and matching records
let updateSearchValueTimeout: NodeJS.Timeout;
const matchingRecords = $derived(
  properties
    .filter(property => property.parentId.startsWith(key) && isDefaultScope(property.scope) && !property.hidden)
    .filter(property => (globalOnly ? !property.extension && !property.experimental : true))
    .filter(property => isPropertyValidInContext(property.when, globalContext))
    .filter(
      property =>
        !searchValue ||
        matchValue(property.title, searchValue) ||
        (!!property.id && matchValue(property.id, searchValue)) ||
        (!!property.displayName && matchValue(property.displayName, searchValue)) ||
        (!!property.description && matchValue(property.description, searchValue)) ||
        (!!property.markdownDescription && matchValue(property.markdownDescription, searchValue)),
    )
    .reduce((map, property) => {
      if (!map.has(property.parentId)) {
        map.set(property.parentId, []);
      }
      map.get(property.parentId)?.push(property);
      return map;
    }, new Map<string, IConfigurationPropertyRecordedSchema[]>()),
);

let activeTabId = $state('');

// sections of the page, sorted by their heading
const sections: SettingsSection[] = $derived(
  [...matchingRecords.entries()]
    .map(([id, records]) => ({ id, title: records.at(0)?.title ?? id, records }))
    .toSorted((left, right) => left.title.localeCompare(right.title)),
);

// the general page gathers every global setting: spread its sections over tabs to keep it
// navigable, while the other pages keep a single list
const settingsTabs: SettingsTab[] = $derived(
  globalOnly
    ? groupSectionsIntoTabs([
        ...sections.map(section => section.title),
        ...(!searchValue && properties.some(property => property.experimental && !property.hidden)
          ? ['Experimental features']
          : []),
      ])
    : [],
);

// searching looks into every tab at once, so the tabs are only useful outside of a search
const showTabs: boolean = $derived(settingsTabs.length > 1 && !searchValue);

const activeTab: SettingsTab | undefined = $derived(
  settingsTabs.find(tab => tab.id === activeTabId) ?? settingsTabs[0],
);

const visibleSections: SettingsSection[] = $derived(
  showTabs && activeTab ? sections.filter(section => activeTab.sections.includes(section.title)) : sections,
);

const showExperimental = $derived(
  globalOnly &&
    (showTabs
      ? activeTab?.id === 'advanced'
      : !!searchValue &&
        (matchValue('enable all experimental features', searchValue) ||
          properties.some(
            property =>
              property.experimental &&
              !property.hidden &&
              [
                property.title,
                property.displayName,
                property.id,
                property.description,
                property.markdownDescription,
              ].some(value => !!value && matchValue(value, searchValue)),
          ))),
);

onMount(async () => {
  contextsUnsubscribe = context.subscribe(value => {
    globalContext = value;
  });
});
onDestroy(() => {
  if (contextsUnsubscribe) {
    contextsUnsubscribe();
  }
});

function matchValue(text: string, searchValue: string): boolean {
  if (!text) {
    return false;
  }
  return text.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateSearchValue(event: any): void {
  clearTimeout(updateSearchValueTimeout);
  updateSearchValueTimeout = setTimeout(() => (searchValue = event.target.value), 500);
}
</script>

<Route path="/" breadcrumb={globalOnly ? 'General' : key}>
  <SettingsPage title={globalOnly ? 'General' : 'Preferences'} {showTabs}>
    {#snippet subtitle()}
      {#if globalOnly}
        Global application settings. Extension settings are managed on the
        <a class="underline" href="/preferences/extensions">Extension settings</a> page.
      {:else}
        <br />
      {/if}
    {/snippet}
    {#snippet header()}
      <SearchInput title="preferences" class="mt-4" oninput={updateSearchValue} />
    {/snippet}
    {#snippet tabs()}
      {#if showTabs}
        <div class="flex flex-row" role="tablist" aria-label="Settings categories">
          {#each settingsTabs as tab (tab.id)}
            <Button type="tab" selected={activeTab?.id === tab.id} onclick={(): void => { activeTabId = tab.id; }}>{tab.label}</Button>
          {/each}
        </div>
      {/if}
    {/snippet}
    <div class="flex flex-col space-y-5 text-[var(--pd-content-header)] pb-2">
      {#if showTabs && activeTab?.content === 'proxy'}
        <PreferencesProxiesForm />
      {:else}
        {#if showExperimental}
          <section aria-label="Experimental features">
            <h2 class="text-lg font-medium mb-2">Experimental features</h2>
            <ExperimentalSettings {properties} {searchValue} />
          </section>
        {/if}
        {#if visibleSections.length || !showExperimental}
          <PreferencesSections sections={visibleSections} />
        {/if}
      {/if}
    </div>
  </SettingsPage>
</Route>

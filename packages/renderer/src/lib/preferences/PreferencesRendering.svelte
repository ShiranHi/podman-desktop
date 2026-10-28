<script lang="ts">
import type { IConfigurationPropertyRecordedSchema } from '@desktop-framework/api/configuration';
import { SearchInput } from '@podman-desktop/ui-svelte';
import { onDestroy, onMount } from 'svelte';
import { type Unsubscriber } from 'svelte/store';

import type { ContextUI } from '/@/lib/context/context';
import Route from '/@/Route.svelte';
import { context } from '/@/stores/context';

import ExperimentalMasterToggle from './ExperimentalMasterToggle.svelte';
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
    .filter(property => (globalOnly ? !property.extension : true))
    .filter(property => isPropertyValidInContext(property.when, globalContext))
    .filter(
      property =>
        !searchValue ||
        matchValue(property.title, searchValue) ||
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
const tabs: SettingsTab[] = $derived(globalOnly ? groupSectionsIntoTabs(sections.map(section => section.title)) : []);

// searching looks into every tab at once, so the tabs are only useful outside of a search
const showTabs: boolean = $derived(tabs.length > 1 && !searchValue);

const activeTab: SettingsTab | undefined = $derived(tabs.find(tab => tab.id === activeTabId) ?? tabs[0]);

const visibleSections: SettingsSection[] = $derived(
  showTabs && activeTab ? sections.filter(section => activeTab.sections.includes(section.title)) : sections,
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
  <SettingsPage title={globalOnly ? 'General' : 'Preferences'}>
    {#snippet subtitle()}
      {#if globalOnly}
        Global application settings. Extension settings are managed on the
        <a class="underline" href="/preferences/extensions">Extension settings</a> page.
      {:else}
        <br />
      {/if}
    {/snippet}
    {#snippet header()}
        <SearchInput  title="preferences" class="mt-4" oninput={updateSearchValue} />
      {/snippet}
    {#if showTabs}
      <div
        class="flex flex-wrap gap-1 border-b border-[var(--pd-global-nav-bg-border)] mb-3"
        role="tablist"
        aria-label="Settings categories">
        {#each tabs as tab (tab.id)}
          <button
            role="tab"
            aria-selected={activeTab?.id === tab.id}
            class="px-4 py-2 text-sm whitespace-nowrap border-b-[3px] -mb-px cursor-pointer"
            class:border-[var(--pd-tab-highlight)]={activeTab?.id === tab.id}
            class:border-transparent={activeTab?.id !== tab.id}
            class:text-[var(--pd-tab-text-highlight)]={activeTab?.id === tab.id}
            class:text-[var(--pd-tab-text)]={activeTab?.id !== tab.id}
            class:hover:border-[var(--pd-tab-hover)]={activeTab?.id !== tab.id}
            onclick={(): void => {
              activeTabId = tab.id;
            }}>
            {tab.label}
          </button>
        {/each}
      </div>
    {/if}
    <div class="flex flex-col space-y-5 text-[var(--pd-content-header)] pb-2">
      {#if showTabs && activeTab?.content === 'proxy'}
        <PreferencesProxiesForm />
      {:else}
        {#if showTabs && activeTab?.id === 'advanced'}
          <ExperimentalMasterToggle {properties} />
        {/if}
        <PreferencesSections sections={visibleSections} />
      {/if}
    </div>
  </SettingsPage>
</Route>

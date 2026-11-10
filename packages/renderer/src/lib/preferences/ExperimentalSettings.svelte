<script lang="ts">
import type { IConfigurationPropertyRecordedSchema } from '@desktop-framework/api/configuration';

import ExperimentalMasterToggle from '/@/lib/preferences/ExperimentalMasterToggle.svelte';
import PreferencesRenderingItem from '/@/lib/preferences/PreferencesRenderingItem.svelte';

interface Props {
  properties: IConfigurationPropertyRecordedSchema[];
  searchValue?: string;
}

let { properties = [], searchValue = '' }: Props = $props();

const matches = (value?: string): boolean => !!value?.toLowerCase().includes(searchValue.toLowerCase());
let experimental: IConfigurationPropertyRecordedSchema[] = $derived(
  properties.filter(property => {
    if (!property.experimental || property.hidden) return false;
    if (!searchValue || matches('experimental features')) return true;
    return (
      matches(property.title) ||
      matches(property.displayName) ||
      matches(property.id) ||
      matches(property.description) ||
      matches(property.markdownDescription)
    );
  }),
);
const showMasterToggle = $derived(
  !searchValue || matches('experimental features') || matches('enable all experimental features'),
);
</script>


  <div class="flex flex-col space-y-2 text-[var(--pd-content-header)]">
    {#if showMasterToggle}<ExperimentalMasterToggle {properties} />{/if}

    {#each experimental as configItem (configItem.id)}
      <div>
        <div class="bg-[var(--pd-invert-content-card-bg)] rounded-md">
          <PreferencesRenderingItem title="full" record={configItem} />
        </div>
      </div>
    {/each}
  </div>


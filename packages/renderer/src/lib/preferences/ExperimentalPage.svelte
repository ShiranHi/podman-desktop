<script lang="ts">
import type { IConfigurationPropertyRecordedSchema } from '@desktop-framework/api/configuration';

import ExperimentalMasterToggle from '/@/lib/preferences/ExperimentalMasterToggle.svelte';
import PreferencesRenderingItem from '/@/lib/preferences/PreferencesRenderingItem.svelte';
import SettingsPage from '/@/lib/preferences/SettingsPage.svelte';

interface Props {
  properties: IConfigurationPropertyRecordedSchema[];
}

let { properties = [] }: Props = $props();

let experimental: IConfigurationPropertyRecordedSchema[] = $derived(
  properties.filter(property => !!property.experimental && !property.hidden),
);
</script>

<SettingsPage title="Experimental Features">
  <div class="flex flex-col space-y-5 text-[var(--pd-content-header)]">
    <ExperimentalMasterToggle {properties} />

    {#each experimental as configItem (configItem.id)}
      <div>
        <div class="bg-[var(--pd-invert-content-card-bg)] rounded-md mt-2 ml-2">
          <PreferencesRenderingItem title="full" record={configItem} />
        </div>
      </div>
    {/each}
  </div>
</SettingsPage>

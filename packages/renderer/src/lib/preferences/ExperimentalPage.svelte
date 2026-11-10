<script lang="ts">
import type { IConfigurationPropertyRecordedSchema } from '@desktop-framework/api/configuration';

import ExperimentalSettings from './ExperimentalSettings.svelte';
import SettingsPage from './SettingsPage.svelte';

let { properties = [] }: { properties: IConfigurationPropertyRecordedSchema[] } = $props();
</script>
<SettingsPage title="Experimental Features"><ExperimentalSettings {properties} /></SettingsPage>

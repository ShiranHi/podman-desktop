<script lang="ts">
import type { SettingsSection } from './general-settings-tabs';
import PreferencesRenderingItem from './PreferencesRenderingItem.svelte';

interface Props {
  sections: SettingsSection[];
}

let { sections = [] }: Props = $props();
</script>

{#if sections.length === 0}
  <div>No Settings Found</div>
{:else}
  {#each sections as section (section.id)}
    <div>
      <div class="text-lg font-medium first-letter:uppercase">{section.records.at(0)?.title}</div>
      {#each section.records as configItem (configItem.id)}
        <div class="bg-[var(--pd-invert-content-card-bg)] rounded-md mt-2 ml-2">
          <PreferencesRenderingItem record={configItem} />
        </div>
      {/each}
    </div>
  {/each}
{/if}

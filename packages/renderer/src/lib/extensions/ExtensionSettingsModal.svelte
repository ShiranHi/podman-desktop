<script lang="ts">
import type { IConfigurationPropertyRecordedSchema } from '@desktop-framework/api/configuration';
import { faPuzzlePiece, faSliders } from '@fortawesome/free-solid-svg-icons';
import { Button, ButtonRow, CloseButton, Modal } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/store';
import { router } from 'tinro';

import type { ContextUI } from '/@/lib/context/context';
import { filterExtensionSettings } from '/@/lib/preferences/extension-settings';
import ExtensionIcon from '/@/lib/preferences/ExtensionIcon.svelte';
import PreferencesRenderingItem from '/@/lib/preferences/PreferencesRenderingItem.svelte';
import type { CombinedExtensionInfoUI } from '/@/stores/all-installed-extensions';
import { configurationProperties } from '/@/stores/configurationProperties';
import { context } from '/@/stores/context';

interface Props {
  extension: CombinedExtensionInfoUI;
  onclose: () => void;
}

let { extension, onclose }: Props = $props();

let globalContext = $state<ContextUI>();
let properties: IConfigurationPropertyRecordedSchema[] = $state([]);
let contextUnsubscriber: Unsubscriber | undefined;
let propertiesUnsubscriber: Unsubscriber | undefined;

onMount(() => {
  contextUnsubscriber = context.subscribe(value => {
    globalContext = value;
  });

  propertiesUnsubscriber = configurationProperties.subscribe(value => {
    properties = value;
  });
});

onDestroy(() => {
  contextUnsubscriber?.();
  propertiesUnsubscriber?.();
});

const records: IConfigurationPropertyRecordedSchema[] = $derived(
  filterExtensionSettings(properties, extension.id, globalContext),
);

function openAllSettings(): void {
  onclose();
  router.goto(`/preferences/extensions?focus=${encodeURIComponent(extension.id)}`);
}
</script>

<Modal on:close={onclose}>
  <div
    class="inline-block w-full overflow-hidden text-left transition-all rounded-md bg-[var(--pd-invert-content-bg)]"
    aria-label="{extension.name} settings">
    <div
      class="flex items-center justify-between gap-3 px-5 py-4 text-[var(--pd-invert-content-header-text)] border-b border-[var(--pd-invert-content-divider)]">
      <div class="flex flex-row items-center gap-3 min-w-0">
        <ExtensionIcon {extension} />
        <div class="flex flex-col min-w-0">
          <h1 class="text-md font-semibold truncate">{extension.displayName || extension.name} settings</h1>
          <span class="text-sm text-[var(--pd-invert-content-header2-text)]">
            {records.length === 1 ? '1 setting' : `${records.length} settings`}
          </span>
        </div>
      </div>
      <CloseButton class="px-2 py-1" onclick={onclose} />
    </div>

    <div class="overflow-y-auto max-h-[60vh] px-4 py-4">
      {#if records.length === 0}
        <div class="flex flex-col items-center text-center space-y-2 py-6" role="region" aria-label="No settings">
          <Icon icon={faPuzzlePiece} size="2x" class="text-[var(--pd-invert-content-info-icon)]" ariaHidden={true} />
          <div class="text-md font-medium text-[var(--pd-invert-content-card-text)]">
            This extension doesn't provide settings
          </div>
          <div class="text-sm text-[var(--pd-invert-content-header2-text)] max-w-[380px]">
            Settings appear here when the extension contributes configuration options.
          </div>
        </div>
      {:else}
        <div class="flex flex-col space-y-2">
          {#each records as record (record.id)}
            <div class="bg-[var(--pd-invert-content-card-bg)] rounded-md">
              <PreferencesRenderingItem {record} />
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="px-4 pb-4">
      <ButtonRow>
        <Button type="link" icon={faSliders} on:click={openAllSettings}>All extension settings</Button>
        <Button on:click={onclose}>Done</Button>
      </ButtonRow>
    </div>
  </div>
</Modal>

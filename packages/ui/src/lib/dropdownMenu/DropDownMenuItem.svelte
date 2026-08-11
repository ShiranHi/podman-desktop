<script lang="ts">
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import type { Component } from 'svelte';

import Icon from '../icons/Icon.svelte';

interface Props {
  title: string;
  tooltip?: string;
  icon: IconDefinition | Component | string;
  enabled?: boolean;
  hidden?: boolean;
  onClick?: () => void;
}

let { title, tooltip = '', icon, enabled = true, hidden = false, onClick = (): void => {} }: Props = $props();

const enabledClasses =
  'rounded-md text-[var(--pd-dropdown-item-text)] hover:bg-[var(--pd-dropdown-item-hover-bg)] hover:text-[var(--pd-dropdown-item-hover-text)] hover:cursor-pointer transition-colors';
const disabledClasses =
  'rounded-md text-[var(--pd-dropdown-disabled-item-text)] bg-[var(--pd-dropdown-disabled-item-bg)]';
</script>

{#if !hidden}
  <!-- Use a div + onclick so there's no "blind spots" for when clicking-->
  <div class={`p-2.5 ${enabled ? enabledClasses : disabledClasses}`} role="none" onclick={onClick}>
    <span
      title={!enabled && tooltip !== '' ? undefined : tooltip !== '' ? tooltip : title}
      class="group flex items-start no-underline h-auto min-h-4"
      tabindex="-1">
      <Icon class="w-4 text-md shrink-0 mt-0.5" icon={icon} />
      <span class="ml-2 flex flex-col min-w-0">
        {#if title}<span class="whitespace-nowrap">{title}</span>{/if}
        {#if !enabled && tooltip !== ''}
          <span class="mt-0.5 text-xs leading-snug whitespace-normal opacity-80 max-w-56">{tooltip}</span>
        {/if}
      </span>
    </span>
  </div>
{/if}

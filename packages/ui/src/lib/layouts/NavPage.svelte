<script lang="ts">
import type { Snippet } from 'svelte';

import SearchInput from '../inputs/SearchInput.svelte';

interface Props {
  title: string;
  searchTerm?: string;
  searchEnabled?: boolean;
  additionalActions?: Snippet;
  bottomAdditionalActions?: Snippet;
  tabs?: Snippet;
  content?: Snippet;
}

let {
  title,
  searchTerm = $bindable(''),
  searchEnabled = true,
  additionalActions,
  bottomAdditionalActions,
  tabs,
  content,
}: Props = $props();
</script>

<div class="flex flex-col w-full h-full">
  <div class="flex flex-col w-full h-full pt-4" role="region" aria-label={title}>
    <div class="flex flex-wrap gap-2 items-center pb-2" role="region" aria-label="header">
      <div class="px-5 shrink-0">
        <h1 class="text-xl font-bold capitalize text-[var(--pd-content-header)]">{title}</h1>
      </div>
      <div class="flex flex-1 justify-end min-w-0">
        <div class="px-5" role="group" aria-label="additionalActions">
          {#if additionalActions}
            <div class="flex flex-wrap gap-2 justify-end items-center text-[var(--pd-content-text)]">
              {@render additionalActions()}
            </div>
          {:else}&nbsp;{/if}
        </div>
      </div>
    </div>
    {#if searchEnabled}
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center pb-4"
        role="region"
        aria-label="search">
        <div class="px-5 w-full sm:w-72 sm:shrink-0 sm:pl-5 sm:pr-0">
          <SearchInput bind:searchTerm={searchTerm} title={title} />
        </div>
        <div class="flex flex-1 px-5 min-w-0" role="group" aria-label="bottomAdditionalActions">
          {#if bottomAdditionalActions}
            <div
              class="flex flex-wrap gap-2 items-center w-full min-w-0 text-[var(--pd-content-text)]">
              {@render bottomAdditionalActions()}
            </div>
          {:else}&nbsp;{/if}
        </div>
      </div>
    {/if}

    {#if tabs}
      <div class="flex flex-row mx-5 px-2 mb-2 border-b border-[var(--pd-content-divider)] overflow-x-auto">
        {@render tabs()}
      </div>
    {/if}

    <div class="flex flex-col w-full h-full overflow-auto" role="region" aria-label="content">
      {@render content?.()}
    </div>
  </div>
</div>

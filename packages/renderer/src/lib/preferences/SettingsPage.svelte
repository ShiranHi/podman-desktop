<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  title: string;
  subtitle?: Snippet;
  actions?: Snippet;
  header?: Snippet;
  children?: Snippet;
  tabs?: Snippet;
  showTabs?: boolean;
  fullWidth?: boolean;
  reserveScrollbarGutter?: boolean;
}

let {
  title,
  subtitle,
  actions,
  header,
  children,
  tabs,
  showTabs = false,
  fullWidth = false,
  reserveScrollbarGutter = false,
}: Props = $props();
</script>

<div class="flex flex-col w-full h-full" role="region" aria-label={title}>
  <div class="w-full px-5 py-4" role="region" aria-label="Header">
    <div class="flex flex-row">
      <div class="grow">
        <div
          class="capitalize text-xl font-bold text-[color:var(--pd-invert-content-header-text)] pt-[3px]"
          role="heading"
          aria-level="1"
          aria-label="Title">
          {title}
        </div>
        <div
          class="text-[color:var(--pd-invert-content-header2-text)]"
          role="heading"
          aria-level="2"
          aria-label="Subtitle">
          {#if subtitle}{@render subtitle()}{:else}<br />{/if}
        </div>
      </div>
      {@render actions?.()}
    </div>

    {@render header?.()}
  </div>
  {#if tabs && showTabs}
    <div class="flex flex-row mx-5 px-2 mb-2 border-b border-[var(--pd-content-divider)]">{@render tabs()}</div>
  {/if}
  <div class="flex flex-row min-w-full flex-1 min-h-0 px-5 py-4 overflow-y-auto"
    style:scrollbar-gutter={reserveScrollbarGutter ? 'stable' : undefined} role="region" aria-label="Content">
    <div class="flex flex-col grow min-w-0" class:max-w-[905px]={!fullWidth} class:mx-auto={!fullWidth}>
      {@render children?.()}
    </div>
  </div>
</div>

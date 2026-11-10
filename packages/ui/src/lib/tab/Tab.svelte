<script lang="ts">
interface Props {
  selected: boolean;
  url?: string;
  onclick?: () => void;
  title: string;
}
let { selected, url, title, onclick }: Props = $props();
</script>

<div
  class="pb-1 border-b-[3px] whitespace-nowrap hover:cursor-pointer focus:outline-[var(--pd-tab-highlight)]"
  class:border-[var(--pd-tab-highlight)]={selected}
  class:border-transparent={!selected}
  class:hover:border-[var(--pd-tab-hover)]={!selected}>
  {#if onclick}
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      class="px-4 py-2 text-[var(--pd-tab-text)] whitespace-nowrap cursor-pointer"
      class:text-[var(--pd-tab-text-highlight)]={selected}
      {onclick}>
      {title}
    </button>
  {:else}
  <a
    href={url}
    class="px-4 py-2 text-[var(--pd-tab-text)] no-underline"
    class:text-[var(--pd-tab-text-highlight)]={selected}
    aria-controls="open-tabs-list-{title.toLowerCase()}-panel"
    id="open-tabs-list-{title.toLowerCase()}-link">
    {title}
  </a>
  {/if}
</div>

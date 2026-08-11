<script lang="ts">
import { onDestroy, onMount, type Snippet } from 'svelte';

// Provide default values for dropdown height and width
// for onMount validations.
let dropDownHeight = $state(0);
let dropDownWidth = $state(0);
let dropDownElement: HTMLElement;
let sideAlign = $state<string>();

interface Props {
  clientY: number;
  clientX: number;
  children?: Snippet;
}

let { clientY, clientX, children }: Props = $props();

const STATUS_BAR_HEIGHT = 24;

function updatePlacement(height: number, width: number, x: number, y: number): void {
  if (!dropDownElement) {
    return;
  }
  // Place above the cursor when there is not enough room below (e.g. Accounts near the bottom).
  const innerHeight = window.innerHeight;
  if (height > 0 && innerHeight - y - STATUS_BAR_HEIGHT < height) {
    dropDownElement.style.top = `-${height}px`;
  } else {
    dropDownElement.style.top = '20px';
  }

  if (window.innerWidth - x < width) {
    sideAlign = 'right-0 origin-top-right';
  } else {
    sideAlign = 'left-0 origin-top-left';
  }
}

// Re-run when size is measured — bind:clientHeight is often still 0 during onMount.
$effect(() => {
  updatePlacement(dropDownHeight, dropDownWidth, clientX, clientY);
});

onMount(() => {
  updatePlacement(dropDownHeight, dropDownWidth, clientX, clientY);
  window.dispatchEvent(new Event('tooltip-hide'));
});

onDestroy(() => {
  window.dispatchEvent(new Event('tooltip-show'));
});
</script>

<div
  title="Drop Down Menu Items"
  bind:clientHeight={dropDownHeight}
  bind:clientWidth={dropDownWidth}
  bind:this={dropDownElement}
  class="{sideAlign} absolute z-10 m-2 rounded-md shadow-lg bg-[var(--pd-dropdown-bg)] ring-2 ring-[var(--pd-dropdown-ring)] hover:ring-[var(--pd-dropdown-hover-ring)] divide-y divide-[var(--pd-dropdown-divider)] focus:outline-hidden">
  {@render children?.()}
</div>

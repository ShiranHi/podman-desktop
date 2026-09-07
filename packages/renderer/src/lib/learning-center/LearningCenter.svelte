<script lang="ts">
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import type { Guide } from '@podman-desktop/core-api/learning-center';
import { Button, Carousel, Expandable } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { onMount } from 'svelte';

import RedHatDesktopLogo from '/@/lib/images/RedHatDesktopLogo.svelte';
import { ExpandableState } from '/@/lib/ui/expandable-state.svelte';
import { isDark } from '/@/stores/appearance';
import { currentScreen } from '/@/stores/prototype';

import GuideCard from './GuideCard.svelte';

let guides: Guide[] = $state([]);
let showSupportPrototype = $derived($currentScreen === 'learning-center');

interface SupportCard {
  kind: 'support';
}

type LearningCenterCard = Guide | SupportCard;

const supportCard: SupportCard = { kind: 'support' };
let cards = $derived<LearningCenterCard[]>(showSupportPrototype ? [supportCard, ...guides] : guides);

const expandableState = new ExpandableState('learningCenter.expanded');

async function openRedHatDesktop(): Promise<void> {
  await window.openExternal('https://www.redhat.com/en/products/desktop');
}

onMount(async () => {
  guides = await window.listGuides();
});
</script>

{#snippet card(card: LearningCenterCard)}
  {#if 'kind' in card}
    <div class="flex min-h-[300px] min-w-[360px] flex-1 flex-col rounded-lg bg-[var(--pd-content-card-carousel-card-bg)] pb-4 hover:bg-[var(--pd-content-card-carousel-card-hover-bg)]">
      <div class="flex flex-col pt-4">
        <div class="px-4">
          <RedHatDesktopLogo white={$isDark} />
        </div>
        <div class="px-4 pt-4 text-nowrap font-semibold text-[var(--pd-content-card-carousel-card-header-text)]">Red Hat Desktop support</div>
        <p class="line-clamp-4 px-4 pt-4 text-[var(--pd-content-card-carousel-card-text)]">Learn about enterprise-grade support for your team.</p>
      </div>
      <div class="flex flex-1 items-end justify-center pt-4">
        <Button class="inline-flex items-center gap-1 justify-self-center self-end" onclick={openRedHatDesktop} title="Learn about Red Hat Desktop support">
          Learn more <Icon icon={faArrowUpRightFromSquare} />
        </Button>
      </div>
    </div>
  {:else}
    <GuideCard guide={card} />
  {/if}
{/snippet}


<div class="flex flex-1 flex-col bg-[var(--pd-content-card-bg)] p-5 rounded-lg">
  <Expandable bind:initialized={expandableState.initialized} bind:expanded={expandableState.expanded} onclick={expandableState.toggle.bind(expandableState)}>
    <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
    {#snippet title()}<div class="text-lg font-semibold text-[var(--pd-content-card-header-text)]">Learning Center</div>{/snippet}
    <div class="pt-2">
      <Carousel cards={cards} {card} />
    </div>
  </Expandable>
</div>

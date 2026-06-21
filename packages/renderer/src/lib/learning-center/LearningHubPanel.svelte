<script lang="ts">
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faChevronRight, faPlay, faRocket, faUsers, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import type { ExploreFeature } from '@podman-desktop/core-api';
import type { Guide } from '@podman-desktop/core-api/learning-center';
import { Carousel } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';

import ExploreFeatureCard from '/@/lib/explore-features/ExploreFeatureCard.svelte';

import GuideCard from './GuideCard.svelte';
import {
  COMMUNITY_HUB_ITEMS,
  LEARNING_HUB_ALL_URL,
  type LearningHubItem,
  type LearningHubTab,
} from './learning-hub-utils';
import LearningHubItemCard from './LearningHubItemCard.svelte';

interface Props {
  activeTab: LearningHubTab;
  guides: Guide[];
  exploreFeatures: ExploreFeature[];
  showExploreTab: boolean;
  whatsNewItems: LearningHubItem[];
  hasNewWhatsNew: boolean;
  hasUnviewedLearnItems: boolean;
  viewedGuideIds: string[];
  onTabChange: (tab: LearningHubTab) => void;
  onOpenGuide: (guide: Guide) => void | Promise<void>;
  onOpenItem: (item: LearningHubItem) => void | Promise<void>;
  onFeatureClosed: (featureId: string) => void;
}

let {
  activeTab,
  guides,
  exploreFeatures,
  showExploreTab,
  whatsNewItems,
  hasNewWhatsNew,
  hasUnviewedLearnItems,
  viewedGuideIds,
  onTabChange,
  onOpenGuide,
  onOpenItem,
  onFeatureClosed,
}: Props = $props();

const tabIcons: Record<LearningHubTab, IconDefinition> = {
  'explore-features': faWandMagicSparkles,
  learn: faPlay,
  community: faUsers,
  'whats-new': faRocket,
};

const tabs: Array<{ id: LearningHubTab; label: string; icon: IconDefinition; hasNew: boolean }> = $derived([
  ...(showExploreTab
    ? [
        {
          id: 'explore-features' as const,
          label: 'Explore Features',
          icon: tabIcons['explore-features'],
          hasNew: false,
        },
      ]
    : []),
  { id: 'learn', label: 'Learn', icon: tabIcons.learn, hasNew: hasUnviewedLearnItems },
  { id: 'community', label: 'Community', icon: tabIcons.community, hasNew: false },
  { id: 'whats-new', label: "What's New", icon: tabIcons['whats-new'], hasNew: hasNewWhatsNew },
]);

let activeItems = $derived(activeTab === 'community' ? COMMUNITY_HUB_ITEMS : whatsNewItems);

async function openAll(): Promise<void> {
  await window.openExternal(LEARNING_HUB_ALL_URL);
}
</script>

{#snippet guideCard(guide: Guide)}
  <GuideCard
    {guide}
    isNew={!viewedGuideIds.includes(guide.id)}
    onViewed={(): Promise<void> => onOpenGuide(guide)} />
{/snippet}

{#snippet hubItemCard(item: LearningHubItem)}
  <LearningHubItemCard {item} onOpen={onOpenItem} />
{/snippet}

{#snippet exploreFeatureCard(feature: ExploreFeature)}
  <ExploreFeatureCard feature={feature} closeFeature={onFeatureClosed} />
{/snippet}

<div class="flex flex-col gap-3">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex min-w-0 flex-wrap items-center gap-1" role="tablist" aria-label="Learning Hub sections">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors {activeTab === tab.id
            ? 'bg-[var(--pd-content-card-carousel-card-bg)] font-medium text-[var(--pd-content-card-header-text)]'
            : 'text-[var(--pd-content-text-sub)] hover:text-[var(--pd-content-card-text)]'}"
          onclick={(): void => onTabChange(tab.id)}>
          <Icon icon={tab.icon} size="sm" aria-hidden="true" class="shrink-0" />
          {tab.label}
          {#if tab.hasNew}
            <span
              aria-label="New content"
              class="h-1.5 w-1.5 rounded-full bg-[var(--pd-notification-dot)]"></span>
          {/if}
        </button>
      {/each}
    </div>

    <button
      type="button"
      class="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--pd-button-primary-bg)] hover:underline"
      onclick={openAll}
      aria-label="View all learning resources">
      All
      <Icon icon={faChevronRight} size="xs" />
    </button>
  </div>

  <div role="tabpanel" class="pt-1">
    {#if activeTab === 'explore-features'}
      {#if exploreFeatures.length === 0}
        <div class="py-6 text-sm text-[var(--pd-content-text-sub)]">No content available yet.</div>
      {:else}
        <Carousel cards={exploreFeatures} card={exploreFeatureCard} />
      {/if}
    {:else if activeTab === 'learn'}
      {#if guides.length === 0}
        <div class="py-6 text-sm text-[var(--pd-content-text-sub)]">No content available yet.</div>
      {:else}
        <Carousel cards={guides} card={guideCard} />
      {/if}
    {:else if activeItems.length === 0}
      <div class="py-6 text-sm text-[var(--pd-content-text-sub)]">No content available yet.</div>
    {:else}
      <Carousel cards={activeItems} card={hubItemCard} />
    {/if}
  </div>
</div>

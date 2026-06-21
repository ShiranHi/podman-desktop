<script lang="ts">
import type { Guide } from '@podman-desktop/core-api/learning-center';
import { Carousel, Expandable } from '@podman-desktop/ui-svelte';
import { onMount } from 'svelte';

import { isLocalContainerEngineHealthy } from '/@/lib/dashboard/dashboard-discovery-utils.svelte';
import { filterExploreFeatures } from '/@/lib/explore-features/explore-features-utils';
import { ExpandableState } from '/@/lib/ui/expandable-state.svelte';
import { context } from '/@/stores/context';
import { enhancedDashboardEnabled } from '/@/stores/dashboard/dashboard-page-registry.svelte';
import { systemOverviewInfos } from '/@/stores/dashboard/system-overview.svelte';
import { exploreFeaturesInfo } from '/@/stores/explore-features';

import GuideCard from './GuideCard.svelte';
import { buildWhatsNewItems, type LearningHubItem, type LearningHubTab } from './learning-hub-utils';
import LearningHubPanel from './LearningHubPanel.svelte';

let guides: Guide[] = $state([]);
let viewedGuideIds: string[] = $state([]);
let dismissedFeatureIds: string[] = $state([]);
let hasNewReleaseNotes = $state(false);
let releaseNotesTitle: string | undefined = $state(undefined);
let releaseNotesUrl: string | undefined = $state(undefined);
let activeTab: LearningHubTab = $state('explore-features');

const expandableState = new ExpandableState('learningCenter.expanded');

let isEnhanced = $derived(enhancedDashboardEnabled.enabled);
let sectionTitle = $derived(isEnhanced ? 'Learning Hub' : 'Learning Center');

let isExploreTabVisible = $derived(isEnhanced && isLocalContainerEngineHealthy($systemOverviewInfos.status.status));

let exploreFeatures = $derived(
  filterExploreFeatures($exploreFeaturesInfo, $context, isEnhanced).filter(
    feature => !dismissedFeatureIds.includes(feature.id),
  ),
);

let whatsNewItems = $derived(buildWhatsNewItems(releaseNotesTitle, releaseNotesUrl, hasNewReleaseNotes, isEnhanced));

let hasUnviewedLearnItems = $derived(isEnhanced && guides.some(guide => !viewedGuideIds.includes(guide.id)));

let showNewContentIndicator = $derived(
  isEnhanced && (hasUnviewedLearnItems || hasNewReleaseNotes || whatsNewItems.some(item => item.isNew)),
);

$effect(() => {
  if (activeTab === 'explore-features' && (!isExploreTabVisible || exploreFeatures.length === 0)) {
    activeTab = 'learn';
  }
});

onMount(async () => {
  window.dispatchEvent(new CustomEvent('update-explore-features', {}));
  guides = await window.listGuides();

  if (!enhancedDashboardEnabled.enabled) {
    return;
  }

  const storedViewedGuideIds = await window.getConfigurationValue<string[]>('learningCenter.viewedGuideIds');
  viewedGuideIds = Array.isArray(storedViewedGuideIds) ? storedViewedGuideIds : [];

  const currentVersion = await window.getPodmanDesktopVersion();
  const dismissedVersion = await window.getConfigurationValue<string>('releaseNotesBanner.show');
  hasNewReleaseNotes = dismissedVersion !== currentVersion;

  const releaseNotes = await window.podmanDesktopGetReleaseNotes();
  releaseNotesTitle = releaseNotes.notes?.title ?? `Podman Desktop ${currentVersion}`;
  releaseNotesUrl = releaseNotes.notesURL ?? releaseNotes.notes?.blog;

  if (!isExploreTabVisible || exploreFeatures.length === 0) {
    activeTab = 'learn';
  }
});

async function markGuideViewed(guideId: string): Promise<void> {
  if (!isEnhanced || viewedGuideIds.includes(guideId)) {
    return;
  }
  viewedGuideIds = [...viewedGuideIds, guideId];
  await window.updateConfigurationValue('learningCenter.viewedGuideIds', viewedGuideIds);
}

async function markReleaseNotesViewed(): Promise<void> {
  if (!hasNewReleaseNotes) {
    return;
  }
  const currentVersion = await window.getPodmanDesktopVersion();
  await window.updateConfigurationValue('releaseNotesBanner.show', currentVersion);
  hasNewReleaseNotes = false;
}

async function handleOpenItem(item: LearningHubItem): Promise<void> {
  if (item.kind === 'release') {
    await markReleaseNotesViewed();
    return;
  }

  if (item.kind === 'article' || item.kind === 'video') {
    await markGuideViewed(item.id);
    await window.telemetryTrack('openLearningCenterGuide', {
      guideId: item.id,
    });
  }
}

function handleFeatureClosed(featureId: string): void {
  dismissedFeatureIds = [...dismissedFeatureIds, featureId];
  exploreFeaturesInfo.update(current => current.filter(feature => feature.id !== featureId));

  if (activeTab === 'explore-features' && exploreFeatures.length <= 1) {
    activeTab = 'learn';
  }
}
</script>

{#snippet card(guide: Guide)}
  <GuideCard guide={guide} />
{/snippet}

<div class="flex flex-1 flex-col bg-[var(--pd-content-card-bg)] p-5 rounded-lg">
  <Expandable bind:initialized={expandableState.initialized} bind:expanded={expandableState.expanded} onclick={expandableState.toggle.bind(expandableState)}>
    {#snippet title()}
      <div class="flex items-center gap-2">
        <div class="text-lg font-semibold text-[var(--pd-content-card-header-text)]">{sectionTitle}</div>
        {#if showNewContentIndicator}
          <div
            aria-label="New content available"
            class="h-1.5 w-1.5 rounded-full bg-[var(--pd-notification-dot)]"></div>
        {/if}
      </div>
    {/snippet}
    <div class="pt-2">
      {#if isEnhanced}
        <LearningHubPanel
          {activeTab}
          {guides}
          {exploreFeatures}
          showExploreTab={isExploreTabVisible && exploreFeatures.length > 0}
          {whatsNewItems}
          hasNewWhatsNew={hasNewReleaseNotes}
          {hasUnviewedLearnItems}
          {viewedGuideIds}
          onTabChange={(tab): void => {
            activeTab = tab;
          }}
          onOpenGuide={async (guide): Promise<void> => {
            await markGuideViewed(guide.id);
          }}
          onOpenItem={handleOpenItem}
          onFeatureClosed={handleFeatureClosed} />
      {:else}
        <Carousel cards={guides} {card} />
      {/if}
    </div>
  </Expandable>
</div>

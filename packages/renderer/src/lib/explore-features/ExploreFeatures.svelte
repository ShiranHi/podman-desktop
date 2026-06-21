<script lang="ts">
import type { ExploreFeature } from '@podman-desktop/core-api';
import { Carousel, Expandable } from '@podman-desktop/ui-svelte';
import { onMount } from 'svelte';

import { isLocalContainerEngineHealthy } from '/@/lib/dashboard/dashboard-discovery-utils.svelte';
import { ExpandableState } from '/@/lib/ui/expandable-state.svelte';
import { context } from '/@/stores/context';
import { enhancedDashboardEnabled } from '/@/stores/dashboard/dashboard-page-registry.svelte';
import { systemOverviewInfos } from '/@/stores/dashboard/system-overview.svelte';
import { exploreFeaturesInfo } from '/@/stores/explore-features';

import { filterExploreFeatures } from './explore-features-utils';
import ExploreFeatureCard from './ExploreFeatureCard.svelte';

let isDiscoveryVisible = $derived(
  !enhancedDashboardEnabled.enabled || isLocalContainerEngineHealthy($systemOverviewInfos.status.status),
);

let features: ExploreFeature[] = $derived(
  filterExploreFeatures($exploreFeaturesInfo, $context, enhancedDashboardEnabled.enabled),
);

const expandableState = new ExpandableState('exploreFeatures.expanded');

onMount(() => {
  window.dispatchEvent(new CustomEvent('update-explore-features', {}));
});

function featureClosed(featureId: string): void {
  exploreFeaturesInfo.update(current => current.filter(feature => feature.id !== featureId));
}
</script>

{#snippet card(feature: ExploreFeature)}
  <ExploreFeatureCard feature={feature} closeFeature={featureClosed} />
{/snippet}

{#if isDiscoveryVisible && features.length > 0}
  <div class="flex flex-1 flex-col bg-[var(--pd-content-card-bg)] p-5 rounded-lg">
    <Expandable bind:initialized={expandableState.initialized} bind:expanded={expandableState.expanded} onclick={expandableState.toggle.bind(expandableState)}>
      <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
      {#snippet title()}<div class="text-lg font-semibold text-[var(--pd-content-card-header-text)]">Explore Features</div>{/snippet}
      <div class="pt-2">
        <Carousel cards={features} {card} />
      </div>
    </Expandable>
  </div>
{/if}

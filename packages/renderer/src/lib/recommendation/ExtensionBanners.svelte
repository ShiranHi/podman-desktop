<script lang="ts">
import type { ExtensionBanner as ExtensionBannerInfo } from '@podman-desktop/core-api/recommendations';

import { ContextUI } from '/@/lib/context/context';
import { ContextKeyExpr } from '/@/lib/context/contextKey';
import { isLocalContainerEngineHealthy } from '/@/lib/dashboard/dashboard-discovery-utils.svelte';
import ExtensionBanner from '/@/lib/recommendation/ExtensionBanner.svelte';
import { isDark } from '/@/stores/appearance';
import { enhancedDashboardEnabled } from '/@/stores/dashboard/dashboard-page-registry.svelte';
import { systemOverviewInfos } from '/@/stores/dashboard/system-overview.svelte';
import { extensionBannerInfos } from '/@/stores/extensionBanners';
import { providerInfos } from '/@/stores/providers';

let isDiscoveryVisible = $derived(
  !enhancedDashboardEnabled.enabled || isLocalContainerEngineHealthy($systemOverviewInfos.status.status),
);

let banners: ExtensionBannerInfo[] = $derived.by(() =>
  $extensionBannerInfos.filter(banner => !banner.when || isBannerVisible(banner)),
);

function isBannerVisible(banner: ExtensionBannerInfo): boolean | undefined {
  const context: ContextUI = new ContextUI();
  $providerInfos.forEach(provider => {
    context.setValue(`provider.${provider.id}.status`, provider.status);
  });
  const whenDeserialized = ContextKeyExpr.deserialize(banner.when);
  return whenDeserialized?.evaluate(context);
}
</script>

{#if isDiscoveryVisible}
  {#each banners as banner (banner.extensionId)}
    <ExtensionBanner banner={banner} isDark={$isDark} />
  {/each}
{/if}

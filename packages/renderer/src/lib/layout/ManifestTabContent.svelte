<script lang="ts">
import type { ViewInfoUI } from '@desktop-framework/api';

import { ImageUtils } from '/@/lib/image/image-utils';
import ImageDetailsSummary from '/@/lib/image/ImageDetailsSummary.svelte';
import {
  IMAGE_DETAILS_VIEW_BADGES,
  IMAGE_DETAILS_VIEW_ICONS,
  IMAGE_VIEW_BADGES,
  IMAGE_VIEW_ICONS,
} from '/@/lib/view/views';
import { containersInfos } from '/@/stores/containers';
import { context } from '/@/stores/context';
import { imagesInfos } from '/@/stores/images';
import { markTabStale } from '/@/stores/layout/layout-store.svelte';
import { viewsContributions } from '/@/stores/views';

import StaleTabPlaceholder from './StaleTabPlaceholder.svelte';

interface Props {
  tabId: string;
  imageId: string;
  engineId: string;
  base64RepoTag: string;
}

let { tabId, imageId, engineId, base64RepoTag }: Props = $props();
const imageUtils = new ImageUtils();
let contributions: ViewInfoUI[] = $derived(
  $viewsContributions.filter(view =>
    [IMAGE_DETAILS_VIEW_ICONS, IMAGE_VIEW_ICONS, IMAGE_VIEW_BADGES, IMAGE_DETAILS_VIEW_BADGES].includes(view.viewId),
  ),
);
let imageInfo = $derived($imagesInfos.find(item => item.Id === imageId && item.engineId === engineId));
let manifest = $derived(
  imageInfo
    ? imageUtils.getImageInfoUI(imageInfo, base64RepoTag, $containersInfos, $context, contributions)
    : undefined,
);

$effect(() => markTabStale(tabId, !manifest));
</script>

{#if manifest}
  <div class="h-full min-h-0 overflow-auto"><ImageDetailsSummary image={manifest} /></div>
{:else}
  <StaleTabPlaceholder resourceLabel="Manifest" {tabId} />
{/if}

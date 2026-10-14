<script lang="ts">
import { DetailsPage, Tab, Tooltip } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import type { Snippet } from 'svelte';
import { router } from 'tinro';

import { closeTabById, layoutState, openTab, selectResourceView } from '/@/stores/layout/layout-store.svelte';
import { type SubView, subViewLabel, subViewsForResourceType, workspaceTabIcon } from '/@/stores/layout/layout-types';
import { getLastAppPageUrl, getPageTabTitle } from '/@/stores/layout/page-tab.svelte';
import { linkOpenMode } from '/@/stores/layout/tab-preferences.svelte';

interface Props {
  tabId: string;
  title: string;
  subtitle?: string;
  titleDetail?: string;
  children: Snippet;
  actions?: Snippet;
  detail?: Snippet;
  icon?: Snippet;
  subtitleContent?: Snippet;
  views?: readonly SubView[];
}
let { tabId, title, subtitle, titleDetail, children, actions, detail, icon, subtitleContent, views }: Props = $props();
const tab = $derived(layoutState.tabs[tabId]);
function close(): void {
  closeTabById(tabId);
}
function openCurrentViewInNewTab(event: MouseEvent): void {
  event.stopPropagation();
  if (!tab) return;
  openTab(
    {
      resourceType: tab.resourceType,
      resourceId: tab.resourceId,
      subView: tab.subView,
      title: tab.title,
      subtitle: tab.subtitle,
      iconClass: tab.iconClass,
    },
    'newTab',
    undefined,
    { allowDuplicate: true },
  );
}
function breadcrumb(): void {
  router.goto(getLastAppPageUrl());
}
function changeView(event: MouseEvent): void {
  const anchor = (event.target as Element).closest('a[href^="#workspace-view-"]');
  if (!anchor) return;
  event.preventDefault();
  event.stopPropagation();
  const view = anchor.getAttribute('href')!.replace('#workspace-view-', '') as SubView;
  const openMode = linkOpenMode(event);
  if (tab && openMode === 'newTab')
    openTab(
      {
        ...tab,
        subView: view,
        title: `${title} · ${subViewLabel(view)}`,
        iconClass: workspaceTabIcon(tab.resourceType, view),
      },
      openMode,
      undefined,
      { allowDuplicate: event.metaKey || event.ctrlKey },
    );
  else selectResourceView(tabId, view);
}
</script>
{#if tab}
<div data-resource-tab={tabId} class="h-full min-h-0">  <DetailsPage {title} {subtitle} {titleDetail} breadcrumbLeftPart={getPageTabTitle()} breadcrumbRightPart={title} onclose={close} onbreadcrumbClick={breadcrumb}>
    {#snippet iconSnippet()}{#if icon}{@render icon()}{:else}<Icon icon={workspaceTabIcon(tab.resourceType)} size={24} ariaHidden />{/if}{/snippet}
    {#snippet subtitleSnippet()}{@render subtitleContent?.()}{/snippet}
    {#snippet actionsSnippet()}
      {@render actions?.()}
      <Tooltip tip="Open current view in a new tab" top>
        <button
          type="button"
          aria-label="Open current view in a new tab"
          class="flex items-center justify-center h-8 w-8 rounded-sm text-[var(--pd-content-text)] hover:bg-[var(--pd-action-button-details-bg)]"
          onclick={openCurrentViewInNewTab}>
          <svg
            viewBox="0 0 16 16"
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true">
            <rect x="1.5" y="3.5" width="13" height="11" rx="1.5" />
            <path d="M1.5 6.5h13M4 5h.01M6 5h.01M10.5 2v3M9 3.5h3" />
          </svg>
        </button>
      </Tooltip>
    {/snippet}
    {#snippet detailSnippet()}{@render detail?.()}{/snippet}
    {#snippet tabsSnippet()}
      <div class="flex" role="presentation" onclickcapture={changeView}>
        {#each views ?? subViewsForResourceType(tab.resourceType) as view (view)}
          <Tab title={subViewLabel(view)} selected={tab.subView === view} url="#workspace-view-{view}" />
        {/each}
      </div>
    {/snippet}
    {#snippet contentSnippet()}{@render children()}{/snippet}
  </DetailsPage>
</div>
{/if}

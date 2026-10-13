<script lang="ts">
import { DetailsPage, Tab } from '@podman-desktop/ui-svelte';
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
function breadcrumb(): void {
  router.goto(getLastAppPageUrl());
}
function changeView(event: MouseEvent): void {
  const anchor = (event.target as Element).closest('a[href^="#workspace-view-"]');
  if (!anchor) return;
  event.preventDefault();
  event.stopPropagation();
  const view = anchor.getAttribute('href')!.replace('#workspace-view-', '') as SubView;
  if (tab && linkOpenMode(event) === 'newTab')
    openTab(
      {
        ...tab,
        subView: view,
        title: `${title} · ${subViewLabel(view)}`,
        iconClass: workspaceTabIcon(tab.resourceType, view),
      },
      'newTab',
    );
  else selectResourceView(tabId, view);
}
</script>
{#if tab}
<div data-resource-tab={tabId} class="h-full min-h-0">  <DetailsPage {title} {subtitle} {titleDetail} breadcrumbLeftPart={getPageTabTitle()} breadcrumbRightPart={title} onclose={close} onbreadcrumbClick={breadcrumb}>
    {#snippet iconSnippet()}{#if icon}{@render icon()}{:else}<Icon icon={workspaceTabIcon(tab.resourceType)} size={24} ariaHidden />{/if}{/snippet}
    {#snippet subtitleSnippet()}{@render subtitleContent?.()}{/snippet}
    {#snippet actionsSnippet()}{@render actions?.()}{/snippet}
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

<script lang="ts">
import { FormPage } from '@podman-desktop/ui-svelte';
import { getContext, type Snippet } from 'svelte';
import { router } from 'tinro';

import { ACTION_PAGE_EMBEDDED_CONTEXT } from '/@/lib/layout/action-page-context';
import { currentPage, lastPage } from '/@/stores/breadcrumb';

interface Props {
  title: string;
  inProgress?: boolean;
  icon?: Snippet;
  actions?: Snippet;
  content?: Snippet;
}

const { title, inProgress = false, icon: localIcon, actions: localActions, content: localContent }: Props = $props();

// Version 2: action forms inside workspace tabs — no page X (close the tab instead).
const embeddedInTab = getContext<boolean | undefined>(ACTION_PAGE_EMBEDDED_CONTEXT) === true;

export function goToPreviousPage(): void {
  router.goto($lastPage.path);
}
</script>

<FormPage
  title={title}
  inProgress={inProgress}
  breadcrumbLeftPart={embeddedInTab ? undefined : $lastPage.name}
  breadcrumbRightPart={embeddedInTab ? undefined : $currentPage.name}
  hasClose={!embeddedInTab}
  compact={embeddedInTab}
  onclose={embeddedInTab ? undefined : goToPreviousPage}
  onbreadcrumbClick={embeddedInTab ? undefined : goToPreviousPage}>
  {#snippet icon()}{@render localIcon?.()}{/snippet}
  {#snippet actions()}{@render localActions?.()}{/snippet}
  {#snippet content()}{@render localContent?.()}{/snippet}
</FormPage>

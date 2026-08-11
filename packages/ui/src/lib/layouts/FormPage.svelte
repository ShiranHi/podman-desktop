<script lang="ts">
import type { Snippet } from 'svelte';

import Page from './Page.svelte';

interface Props {
  title: string;
  inProgress?: boolean;
  breadcrumbLeftPart?: string;
  breadcrumbRightPart?: string;
  hasClose?: boolean;
  compact?: boolean;
  onclose?: () => void;
  onbreadcrumbClick?: () => void;
  icon?: Snippet;
  actions?: Snippet;
  content?: Snippet;
}

const {
  title,
  inProgress = false,
  breadcrumbLeftPart = undefined,
  breadcrumbRightPart = undefined,
  hasClose = true,
  compact = false,
  onclose = (): void => {},
  onbreadcrumbClick = (): void => {},
  icon: thisIcon,
  actions: thisActions,
  content: thisContent,
}: Props = $props();
</script>

<Page
  title={title}
  breadcrumbLeftPart={breadcrumbLeftPart}
  breadcrumbRightPart={breadcrumbRightPart}
  hasClose={hasClose}
  compact={compact}
  inProgress={inProgress}
  onclose={onclose}
  onbreadcrumbClick={onbreadcrumbClick}>
  {#snippet icon()}
    {@render thisIcon?.()}
  {/snippet}
  {#snippet actions()}
    {@render thisActions?.()}
  {/snippet}
  {#snippet content()}
    <div class="flex w-full h-full overflow-auto">
      {@render thisContent?.()}
    </div>
  {/snippet}
</Page>

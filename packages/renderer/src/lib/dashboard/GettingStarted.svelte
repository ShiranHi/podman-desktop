<script lang="ts">
import { faCheck, faChevronRight, faRocket } from '@fortawesome/free-solid-svg-icons';
import type { NavigationPage } from '@podman-desktop/core-api';
import { ChevronExpander, CloseButton } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { onMount } from 'svelte';
import { slide } from 'svelte/transition';

import { ExpandableState } from '/@/lib/ui/expandable-state.svelte';
import { handleNavigation } from '/@/navigation';
import { onDidChangeConfiguration } from '/@/stores/configurationProperties';
import { containersInfos } from '/@/stores/containers';
import { showDashboardRestoreHint } from '/@/stores/dashboard/dashboard-dismiss-hint.svelte';
import { imagesInfos } from '/@/stores/images';
import { providerInfos } from '/@/stores/providers';

import {
  getGettingStartedProgress,
  GETTING_STARTED_CATALOG_VIEWED_KEY,
  GETTING_STARTED_DISMISSED_KEY,
  GETTING_STARTED_SECTION_NAME,
  GETTING_STARTED_STEPS,
} from './getting-started-utils';

interface Props {
  /** Side-by-side with System Overview; uses fixed width on xl+ when true. */
  compactWidth?: boolean;
}

let { compactWidth = false }: Props = $props();

const expandableState = new ExpandableState('dashboard.gettingStarted.expanded');

let dismissed = $state(false);
let viewedExtensionCatalog = $state(false);

let progress = $derived(
  getGettingStartedProgress({
    providers: $providerInfos,
    imageCount: $imagesInfos.length,
    containerCount: $containersInfos.length,
    viewedExtensionCatalog,
  }),
);

let progressPercent = $derived(
  progress.totalCount === 0 ? 0 : Math.round((progress.completedCount / progress.totalCount) * 100),
);

onMount(async () => {
  dismissed = (await window.getConfigurationValue<boolean>(GETTING_STARTED_DISMISSED_KEY)) ?? false;
  viewedExtensionCatalog = (await window.getConfigurationValue<boolean>(GETTING_STARTED_CATALOG_VIEWED_KEY)) ?? false;

  const onDismissedConfigChange = (event: Event): void => {
    const { key, value } = (event as CustomEvent<{ key: string; value: unknown }>).detail;
    if (key === GETTING_STARTED_DISMISSED_KEY) {
      dismissed = Boolean(value);
    }
  };

  onDidChangeConfiguration.addEventListener(GETTING_STARTED_DISMISSED_KEY, onDismissedConfigChange);

  return (): void => {
    onDidChangeConfiguration.removeEventListener(GETTING_STARTED_DISMISSED_KEY, onDismissedConfigChange);
  };
});

async function dismissWizard(event: MouseEvent): Promise<void> {
  event.stopPropagation();
  dismissed = true;
  await window.updateConfigurationValue(GETTING_STARTED_DISMISSED_KEY, true);
  await window.telemetryTrack('dashboard.gettingStartedDismissed');
  showDashboardRestoreHint(GETTING_STARTED_SECTION_NAME);
}

async function handleHeaderToggle(): Promise<void> {
  const next = !expandableState.expanded;
  expandableState.expanded = next;
  await expandableState.toggle(next);
}

async function openStep(stepId: string, page: NavigationPage): Promise<void> {
  if (stepId === 'view-extensions' && !viewedExtensionCatalog) {
    viewedExtensionCatalog = true;
    await window.updateConfigurationValue(GETTING_STARTED_CATALOG_VIEWED_KEY, true);
  }

  await window.telemetryTrack('dashboard.gettingStartedStepClicked', { stepId });
  handleNavigation({ page });
}
</script>

{#if !dismissed}
  <div
    class="w-full shrink-0 rounded-lg bg-[var(--pd-content-card-bg)] p-5 {compactWidth ? 'xl:w-[22rem]' : ''} {expandableState.expanded
      ? 'self-stretch'
      : 'self-start'}"
    aria-label="Getting Started">
    <div class="flex w-full flex-col gap-3">
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-1 text-left"
          aria-expanded={expandableState.expanded}
          onclick={(): Promise<void> => handleHeaderToggle()}>
          <ChevronExpander expanded={expandableState.expanded} class="w-4 shrink-0" />
          <div class="flex min-w-0 items-center gap-2">
            <Icon icon={faRocket} size="sm" class="shrink-0 text-[var(--pd-button-primary-bg)]" />
            <span class="text-lg font-semibold text-[var(--pd-content-card-header-text)]">
              Getting Started {progress.completedCount}/{progress.totalCount}
            </span>
          </div>
        </button>

        <CloseButton
          onclick={(event: MouseEvent): Promise<void> => dismissWizard(event)}
          class="shrink-0 text-[var(--pd-content-text-sub)]" />
      </div>

      <div class="pl-5">
        <div
          class="h-1.5 w-full overflow-hidden rounded-full bg-[var(--pd-progressBar-bg)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-label="Getting Started progress">
          <div
            class="h-full rounded-full bg-[var(--pd-button-primary-bg)] transition-[width]"
            style="width: {progressPercent}%"></div>
        </div>
      </div>

      {#if expandableState.initialized && expandableState.expanded}
        <div transition:slide={{ duration: 250 }}>
          <ul class="flex flex-col gap-1 pl-5" aria-label="Getting Started checklist">
            {#each GETTING_STARTED_STEPS as step (step.id)}
              {@const completed = progress.completedStepIds.has(step.id)}
              <li>
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left transition-colors hover:bg-[var(--pd-content-card-carousel-card-hover-bg)]"
                  onclick={(): Promise<void> => openStep(step.id, step.page)}
                  aria-label="{step.title}{completed ? ' (completed)' : ''}">
                  <span
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border {completed
                      ? 'border-[var(--pd-button-primary-bg)] bg-[var(--pd-button-primary-bg)] text-[var(--pd-button-primary-text)]'
                      : 'border-[var(--pd-content-text-sub)] bg-transparent'}">
                    {#if completed}
                      <Icon icon={faCheck} size="xs" />
                    {/if}
                  </span>

                  <span
                    class="min-w-0 flex-1 text-sm {completed
                      ? 'text-[var(--pd-content-text-sub)] line-through'
                      : 'font-medium text-[var(--pd-content-card-header-text)]'}">
                    {step.title}
                  </span>

                  {#if !completed}
                    <Icon icon={faChevronRight} size="xs" class="shrink-0 text-[var(--pd-content-text-sub)]" />
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </div>
{/if}

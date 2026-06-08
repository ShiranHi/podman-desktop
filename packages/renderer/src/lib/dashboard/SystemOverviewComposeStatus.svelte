<script lang="ts">
import { faCheckCircle } from '@fortawesome/free-regular-svg-icons';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Link } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { onMount } from 'svelte';
import { router } from 'tinro';

import { WARNING_TEXT_CLASS } from './system-overview-utils.svelte';

const COMPOSE_EXTENSION_ID = 'podman.compose';
const COMPOSE_SETUP_DOCS_URL = 'https://podman-desktop.io/docs/compose/setting-up-compose';

type ComposeSetupState = 'ready' | 'not-installed' | 'loading';

let composeState = $state<ComposeSetupState>('loading');
let composeLabel = $derived.by(() => {
  switch (composeState) {
    case 'ready':
      return 'Compose is set up';
    case 'not-installed':
      return 'Compose extension is not installed';
    default:
      return 'Checking Compose setup…';
  }
});

onMount(async () => {
  try {
    const extensions = await window.listExtensions();
    const composeInstalled = extensions.some(ext => ext.id.includes('compose') && ext.state !== 'stopped');
    composeState = composeInstalled ? 'ready' : 'not-installed';
  } catch {
    composeState = 'not-installed';
  }
});

function openComposeExtension(): void {
  router.goto(`/extensions/details/${COMPOSE_EXTENSION_ID}`);
}

async function openComposeDocs(): Promise<void> {
  await window.openExternal(COMPOSE_SETUP_DOCS_URL);
}
</script>

<div
  class="flex flex-col gap-2 rounded-lg px-3 py-2 bg-[var(--pd-content-card-carousel-card-bg)]"
  role="status"
  aria-label="Compose setup status: {composeLabel}">
  {#if composeState === 'ready'}
    <div class="flex items-center gap-2">
      <Icon icon={faCheckCircle} class="text-[var(--pd-status-running)] shrink-0" size="sm" />
      <span class="text-sm text-[var(--pd-content-card-text)]">{composeLabel}</span>
    </div>
  {:else if composeState === 'not-installed'}
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex items-start gap-2 min-w-0">
        <Icon icon={faTriangleExclamation} class="{WARNING_TEXT_CLASS} shrink-0 mt-0.5" size="sm" />
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="text-sm font-medium {WARNING_TEXT_CLASS}">{composeLabel}</span>
          <span class="text-xs text-[var(--pd-content-text-sub)]">
            Install the Compose extension, then open Settings → Resources and select Setup on the Compose tile.
          </span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 sm:shrink-0 sm:pt-0.5 pl-6 sm:pl-0">
        <Link on:click={openComposeExtension}>Install Extension</Link>
        <Link on:click={openComposeDocs}>View Documentation</Link>
      </div>
    </div>
  {:else}
    <span class="text-sm text-[var(--pd-content-text-sub)]">{composeLabel}</span>
  {/if}
</div>

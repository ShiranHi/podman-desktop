<script lang="ts">
import { NavigationPage, type ProviderInfo } from '@podman-desktop/core-api';
import { Button } from '@podman-desktop/ui-svelte';

import { handleNavigation } from '/@/navigation';

import { getConnectionStatusConfig, hasStartLifecycle } from './system-overview-utils.svelte';
import SystemOverviewProviderCardBase from './SystemOverviewProviderCardBase.svelte';

interface Props {
  provider: ProviderInfo;
}

let { provider }: Props = $props();

let startInProgress = $state(false);

let isConfigured = $derived(provider.status === 'configured');
let canStart = $derived(isConfigured && hasStartLifecycle(provider));
let statusConfig = $derived(getConnectionStatusConfig(provider.status, provider));

let subtitleText = $derived.by(() => {
  if (provider.status === 'not-installed') {
    return `${provider.name} needs to be set up. Some features might not function optimally.`;
  }
  return 'No container engine (machine) created yet. Create one to run containers and pods.';
});

async function handleClick(): Promise<void> {
  if (canStart) {
    startInProgress = true;
    try {
      await window.startProvider(provider.internalId);
      await window.telemetryTrack('dashboard.healthCard.provider.started', { providerName: provider.name });
    } catch (err: unknown) {
      console.error('Provider failed to start:', err);
    } finally {
      startInProgress = false;
    }
  } else {
    handleNavigation({
      page: NavigationPage.ONBOARDING,
      parameters: {
        extensionId: provider.extensionId,
      },
    });
  }
}
</script>

<SystemOverviewProviderCardBase {provider}>
  {#snippet subtitle()}
    <div class="text-sm text-[var(--pd-content-text-sub)]">
      {subtitleText}
    </div>
  {/snippet}
  {#snippet actions()}
    <div class="pt-2 border-t border-[var(--pd-content-divider)]">
      <Button type={statusConfig.buttonType} onclick={handleClick} inProgress={startInProgress}>
        {statusConfig.buttonText}
      </Button>
    </div>
  {/snippet}
</SystemOverviewProviderCardBase>

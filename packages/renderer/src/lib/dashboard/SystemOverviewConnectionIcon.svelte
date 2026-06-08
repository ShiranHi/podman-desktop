<script lang="ts">
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import type { ProviderConnectionInfo, ProviderInfo } from '@podman-desktop/core-api';
import { Icon } from '@podman-desktop/ui-svelte/icons';

import IconImage from '/@/lib/appearance/IconImage.svelte';
import KubernetesIcon from '/@/lib/images/KubernetesIcon.svelte';
import EngineIcon from '/@/lib/ui/EngineIcon.svelte';

interface Props {
  provider: ProviderInfo;
  connection?: ProviderConnectionInfo;
  class?: string;
}

let { provider, connection, class: className = 'max-w-7 max-h-7 object-contain' }: Props = $props();

let connectionType = $derived(connection?.connectionType);
</script>

<IconImage image={provider.images?.icon} alt={provider.name} class={className}>
  {#if connectionType === 'kubernetes'}
    <KubernetesIcon size="20" class="text-[var(--pd-content-text-sub)]" />
  {:else if connectionType === 'vm'}
    <Icon icon={faDesktop} size="sm" class="text-[var(--pd-content-text-sub)]" />
  {:else}
    <EngineIcon class="w-6 h-auto text-[var(--pd-content-text-sub)]" />
  {/if}
</IconImage>

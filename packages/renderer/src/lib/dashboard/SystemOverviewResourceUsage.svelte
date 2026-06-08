<script lang="ts">
import type { ContainerProviderConnection } from '@podman-desktop/api';
import type { ProviderContainerConnectionInfo, ProviderInfo } from '@podman-desktop/core-api';
import type { IConfigurationPropertyRecordedSchema } from '@podman-desktop/core-api/configuration';

import Donut from '/@/lib/donut/Donut.svelte';
import { extractConnectionResourceMetrics, toDisplayMetrics } from '/@/lib/preferences/connection-resource-metrics';
import type { IProviderConnectionConfigurationPropertyRecorded } from '/@/lib/preferences/Util';
import { configurationProperties } from '/@/stores/configurationProperties';

interface Props {
  provider: ProviderInfo;
  connection: ProviderContainerConnectionInfo;
  variant?: 'standalone' | 'inline';
}

let { provider, connection, variant = 'standalone' }: Props = $props();

let configurationKeys: IConfigurationPropertyRecordedSchema[] = $derived(
  $configurationProperties
    .filter(property => property.scope === 'ContainerConnection')
    .sort((a, b) => (a?.id ?? '').localeCompare(b?.id ?? '')),
);

let resourceConfig = $state<IProviderConnectionConfigurationPropertyRecorded[]>([]);

$effect(() => {
  if (!connection || configurationKeys.length === 0) {
    resourceConfig = [];
    return;
  }

  Promise.all(
    configurationKeys.map(async configKey => {
      return {
        ...configKey,
        value: configKey.id
          ? await window.getConfigurationValue(configKey.id, connection as unknown as ContainerProviderConnection)
          : undefined,
        connection: connection.name,
        providerId: provider.internalId,
      };
    }),
  )
    .then(value => {
      resourceConfig = value;
    })
    .catch((err: unknown) => console.error('Error fetching resource usage:', err));
});

let displayMetrics = $derived.by(() => {
  const metrics = extractConnectionResourceMetrics(resourceConfig);
  return metrics ? toDisplayMetrics(metrics) : [];
});
</script>

{#if displayMetrics.length > 0}
  <div
    class="flex flex-wrap gap-3 {variant === 'standalone'
      ? 'pt-3 border-t border-[var(--pd-content-divider)]'
      : ''}"
    role="group"
    aria-label="Resource usage">
    {#each displayMetrics as metric (metric.title)}
      <Donut title={metric.title} value={metric.value} percent={metric.percent} />
    {/each}
  </div>
{/if}

<script lang="ts">
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@podman-desktop/ui-svelte/icons';

// TODO: Check actual compose status from extension API
let composeInstalled = $state(true);
</script>

{#if composeInstalled}
  <div class="flex items-center gap-2 text-sm text-[var(--pd-status-running)]" aria-label="Compose status">
    <Icon icon={faCircleCheck} size="sm" />
    <span>Compose is set up</span>
  </div>
{/if}

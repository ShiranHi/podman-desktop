<script lang="ts">
import { onDestroy, onMount } from 'svelte';

import {
  registerDashboardHealthPrototype,
  unregisterDashboardHealthPrototype,
} from '/@/lib/dashboard/dashboard-health-prototype';
import { isStaticBuild } from '/@/lib/static-build';

onMount(() => {
  if (isStaticBuild) {
    return;
  }
  registerDashboardHealthPrototype();
});

onDestroy(() => {
  if (isStaticBuild) {
    return;
  }
  unregisterDashboardHealthPrototype();
});
</script>

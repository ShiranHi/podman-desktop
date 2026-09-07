<script lang="ts">
import { onDestroy } from 'svelte';

import { registerPrototype, unregisterPrototype } from '/@/stores/prototype';

registerPrototype({
  name: 'RHBPD support promotion',
  screens: [
    { value: 'status-bar', label: 'Status bar · persistent icon + tooltip' },
    { value: 'notifications', label: 'Notifications · one dismissible notification' },
    { value: 'learning-center', label: 'Learning Center · support card + article' },
  ],
  overrides: {
    'status-bar': { placement: 'status-bar' },
    notifications: { placement: 'notifications' },
    'learning-center': { placement: 'learning-center' },
  },
});

onDestroy(unregisterPrototype);
</script>

<script lang="ts">
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { Button, CloseButton } from '@podman-desktop/ui-svelte';
import { Icon } from '@podman-desktop/ui-svelte/icons';

import RedHatDesktopLogo from '/@/lib/images/RedHatDesktopLogo.svelte';
import { isDark } from '/@/stores/appearance';
import { currentScreen } from '/@/stores/prototype';

let show = $derived($currentScreen === 'notifications');
let dismissed = $state(false);

async function openRedHatDesktop(): Promise<void> {
  await window.openExternal('https://www.redhat.com/en/products/desktop');
}

function dismiss(): void {
  dismissed = true;
}
</script>

{#if show && !dismissed}
  <div class="m-4 flex items-start gap-3 rounded-md border border-[var(--pd-content-card-border)] bg-[var(--pd-content-card-bg)] p-4">
    <RedHatDesktopLogo white={$isDark} />
    <div class="min-w-0 flex-1">
      <div class="text-sm font-semibold text-[var(--pd-content-card-header-text)]">Interested in enterprise support?</div>
      <div class="mt-1 text-xs text-[var(--pd-content-card-text)]">Enterprise-grade support is available with a Red Hat Desktop license.</div>
      <Button class="mt-2 inline-flex items-center gap-1" onclick={openRedHatDesktop} title="Learn about Red Hat Desktop support">
        Learn more <Icon icon={faArrowUpRightFromSquare} />
      </Button>
    </div>
    <CloseButton onclick={dismiss} />
  </div>
{/if}

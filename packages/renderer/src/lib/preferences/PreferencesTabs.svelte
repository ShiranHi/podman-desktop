<script lang="ts">
import SlideToggle from '/@/lib/ui/SlideToggle.svelte';
import { setTabsEnabled, tabPreferences } from '/@/stores/layout/tab-preferences.svelte';
</script>

<section aria-label="Tabs">
  <h2 class="text-lg font-medium">Tabs</h2>
  <div class="bg-[var(--pd-invert-content-card-bg)] rounded-md mt-2 ml-2 px-2 py-2 text-[var(--pd-invert-content-card-text)]">
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="font-semibold">Enable tabs</div>
        <p class="pt-1 text-sm">When enabled, use the tabbed workspace, layouts, and tab actions throughout the app. When disabled, the app uses its standard page navigation.</p>
      </div>
      <div class="shrink-0 pt-2">
        <SlideToggle
          id="tabs-enabled"
          aria-label="Enable tabs"
          checked={tabPreferences.tabsEnabled}
          onCheckedChange={setTabsEnabled}
          left>
          <span class="text-xs">{tabPreferences.tabsEnabled ? 'Enabled' : 'Disabled'}</span>
        </SlideToggle>
      </div>
    </div>
  </div>
</section>

<script lang="ts">
import SlideToggle from '/@/lib/ui/SlideToggle.svelte';
import { setSummaryLinksInNewTabs, tabPreferences } from '/@/stores/layout/tab-preferences.svelte';
</script>

<section aria-label="Tabs">
  <h2 class="text-lg font-medium">Tabs</h2>
  <div class="bg-[var(--pd-invert-content-card-bg)] rounded-md mt-2 ml-2 px-2 py-2 text-[var(--pd-invert-content-card-text)]">
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="font-semibold">Open summary links in new tabs</div>
        <p class="pt-1 text-sm">Open links from a resource's Summary in a new tab. When disabled, links open in the current tab.</p>
        <p class="pt-1 text-sm">Cmd-click on macOS or Ctrl-click on Windows/Linux always opens a new tab.</p>
      </div>
      <div class="shrink-0 pt-2">
        <SlideToggle
          id="summary-links-new-tab"
          aria-label="Open summary links in new tabs"
          checked={tabPreferences.summaryLinksInNewTabs}
          onCheckedChange={setSummaryLinksInNewTabs}
          left>
          <span class="text-xs">{tabPreferences.summaryLinksInNewTabs ? 'Enabled' : 'Disabled'}</span>
        </SlideToggle>
      </div>
    </div>
  </div>
</section>

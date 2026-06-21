<script lang="ts">
import { ListOrganizer, type ListOrganizerItem, NavPage, tablePersistence } from '@podman-desktop/ui-svelte';
import { onMount } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

import { onDidChangeConfiguration } from '/@/stores/configurationProperties';
import { clearDashboardRestoreHint, dashboardDismissHint } from '/@/stores/dashboard/dashboard-dismiss-hint.svelte';
import {
  convertFromListOrganizerItems,
  dashboardPageRegistry,
  type DashboardPageRegistryEntry,
  defaultSection,
  enhancedDashboardEnabled,
  setupDashboardPageRegistry,
} from '/@/stores/dashboard/dashboard-page-registry.svelte';
import { LEARNING_CENTER_SECTION_ID } from '/@/stores/dashboard/dashboard-page-registry-learning-center.svelte';

import { getDashboardConfigureSectionsTooltip } from './dashboard-restore-utils';
import { GETTING_STARTED_DISMISSED_KEY, GETTING_STARTED_SECTION_ID } from './getting-started-utils';
import NotificationsBox from './NotificationsBox.svelte';

const SYSTEM_OVERVIEW_SECTION_ID = 'System Overview';

function getSectionDisplayLabel(sectionId: string, label?: string): string {
  if (sectionId === LEARNING_CENTER_SECTION_ID && enhancedDashboardEnabled.enabled) {
    return 'Learning Hub';
  }

  return label ?? sectionId;
}

// Dashboard section configuration managed by dashboard page registry
let dashboardSections = $state<ListOrganizerItem[]>([]);
let dashboardOrdering = new SvelteMap<string, number>();

let orderedSections = $derived(getOrderedDashboardSections());
let listOrganizerSections = $derived(
  orderedSections.map(item => ({
    ...item,
    label: getSectionDisplayLabel(item.id, item.label),
  })),
);
let updatedEntries = $derived(convertFromListOrganizerItems(orderedSections, dashboardPageRegistry.entries));

// Filter and sort dashboard registry items based on LayoutEditor configuration
let sortedDashboardRegistry = $derived(
  orderedSections
    .filter(section => section.enabled)
    .map(section => dashboardPageRegistry.entries.find(item => item.id === section.id))
    .filter((item): item is DashboardPageRegistryEntry => item?.component !== undefined),
);

let gettingStartedRegistryEntry = $derived(
  sortedDashboardRegistry.find(entry => entry.id === GETTING_STARTED_SECTION_ID),
);

let systemOverviewRegistryEntry = $derived(
  sortedDashboardRegistry.find(entry => entry.id === SYSTEM_OVERVIEW_SECTION_ID),
);

let gettingStartedDismissed = $state(false);

let showSystemOverview = $derived(systemOverviewRegistryEntry !== undefined);
let showGettingStarted = $derived(gettingStartedRegistryEntry !== undefined && !gettingStartedDismissed);

let pairGettingStartedWithSystemOverview = $derived(showSystemOverview && showGettingStarted);

function shouldSkipDashboardSection(sectionId: string): boolean {
  return pairGettingStartedWithSystemOverview && sectionId === GETTING_STARTED_SECTION_ID;
}

// Initialize default dashboard configuration
function getDefaultDashboardItems(): ListOrganizerItem[] {
  return dashboardPageRegistry.entries.map(entry => ({
    id: entry.id,
    label: getSectionDisplayLabel(entry.id, entry.label),
    enabled: entry.defaultEnabled !== false,
    originalOrder: entry.originalOrder,
  }));
}

// Initialize dashboard configuration
async function initializeDashboard(): Promise<void> {
  try {
    await setupDashboardPageRegistry();
    if (dashboardPageRegistry.entries.length > 0) {
      dashboardSections = await loadDashboardConfiguration();
    }
  } catch (error: unknown) {
    console.error(`Failed to load dashboard configuration: ${error}`);
    // Fallback to default configuration
    dashboardSections = getDefaultDashboardItems();
  }
}

function filterListOrganizerItems(items: ListOrganizerItem[]): ListOrganizerItem[] {
  const registryIds = new SvelteSet(dashboardPageRegistry.entries.map(entry => entry.id));
  return items.filter((item: ListOrganizerItem) => registryIds.has(item.id));
}

// Load configuration from settings
async function loadDashboardConfiguration(): Promise<ListOrganizerItem[]> {
  if (!tablePersistence.storage) return getDefaultDashboardItems();
  const loadedItems = filterListOrganizerItems(
    await tablePersistence.storage.load('dashboard', $state.snapshot(defaultSection.names)),
  );

  if (loadedItems.length > 0) {
    // Ensure loaded items have proper originalOrder from defaults if missing
    const defaultItems = getDefaultDashboardItems();
    const items = loadedItems.map((item: ListOrganizerItem) => ({
      ...item,
      label: getSectionDisplayLabel(item.id, item.label),
      originalOrder: item.originalOrder ?? defaultItems.find(d => d.id === item.id)?.originalOrder ?? 0,
    }));
    // Build ordering map from loaded items
    // Check if items are in a different order than their original order
    const isReordered = items.some((item: ListOrganizerItem, index: number) => item.originalOrder !== index);
    dashboardOrdering.clear();
    if (isReordered) {
      items.forEach((item, index) => {
        dashboardOrdering.set(item.id, index);
      });
    }
    return items;
  }
  return getDefaultDashboardItems();
}

// Get ordered dashboard sections based on current ordering
function getOrderedDashboardSections(): ListOrganizerItem[] {
  if (dashboardOrdering.size === 0) {
    return dashboardSections;
  }
  return dashboardSections.toSorted((a, b) => {
    const aOrder = dashboardOrdering.get(a.id) ?? a.originalOrder;
    const bOrder = dashboardOrdering.get(b.id) ?? b.originalOrder;
    return aOrder - bOrder;
  });
}

function syncGettingStartedSectionEnabled(enabled: boolean): void {
  if (dashboardSections.length === 0) {
    return;
  }

  const gettingStartedSection = dashboardSections.find(item => item.id === GETTING_STARTED_SECTION_ID);
  if (!gettingStartedSection || gettingStartedSection.enabled === enabled) {
    return;
  }

  dashboardSections = dashboardSections.map(item =>
    item.id === GETTING_STARTED_SECTION_ID ? { ...item, enabled } : item,
  );

  saveDashboardConfiguration().catch((error: unknown) => {
    console.error(`Failed to sync Getting Started section enabled state: ${error}`);
  });
}

// Save configuration
async function saveDashboardConfiguration(): Promise<void> {
  if (!tablePersistence.storage) return;

  const orderedItems = getOrderedDashboardSections();
  const serializableItems = orderedItems.map(item => ({
    id: item.id,
    label: item.label,
    enabled: item.enabled,
    originalOrder: item.originalOrder,
  }));

  await tablePersistence.storage.save('dashboard', serializableItems);
  dashboardPageRegistry.entries = updatedEntries;
}

// Initialize dashboard on mount
onMount(async () => {
  gettingStartedDismissed = (await window.getConfigurationValue<boolean>(GETTING_STARTED_DISMISSED_KEY)) ?? false;

  const onDismissedConfigChange = (event: Event): void => {
    const { key, value } = (event as CustomEvent<{ key: string; value: unknown }>).detail;
    if (key === GETTING_STARTED_DISMISSED_KEY) {
      gettingStartedDismissed = Boolean(value);
      syncGettingStartedSectionEnabled(!gettingStartedDismissed);
    }
  };

  onDidChangeConfiguration.addEventListener(GETTING_STARTED_DISMISSED_KEY, onDismissedConfigChange);

  await initializeDashboard();

  if (gettingStartedDismissed) {
    syncGettingStartedSectionEnabled(false);
  }

  return (): void => {
    onDidChangeConfiguration.removeEventListener(GETTING_STARTED_DISMISSED_KEY, onDismissedConfigChange);
  };
});

// Keep layout items in sync when the registry gains sections (e.g. enhanced dashboard).
$effect(() => {
  if (dashboardPageRegistry.entries.length === 0) {
    return;
  }

  const registryIds = new SvelteSet(dashboardPageRegistry.entries.map(entry => entry.id));
  const defaults = getDefaultDashboardItems();
  const currentById = new SvelteMap(dashboardSections.map(item => [item.id, item]));

  let nextSections = dashboardSections.filter(item => registryIds.has(item.id));
  let changed = nextSections.length !== dashboardSections.length;

  for (const entry of dashboardPageRegistry.entries) {
    if (!currentById.has(entry.id)) {
      const defaultItem = defaults.find(item => item.id === entry.id);
      if (defaultItem) {
        nextSections.push(defaultItem);
        changed = true;
      }
    }
  }

  if (changed) {
    // Sort by originalOrder AND clear any custom ordering to respect registry order for new items
    const sorted = nextSections.toSorted((a, b) => a.originalOrder - b.originalOrder);

    // If System Overview appears after Extension Banners, force correct order
    const systemOverviewIndex = sorted.findIndex(s => s.id === 'System Overview');
    const extensionBannersIndex = sorted.findIndex(s => s.id === 'Extension Banners');
    const exploreFeaturesIndex = sorted.findIndex(s => s.id === 'Explore Features');

    if (
      (systemOverviewIndex !== -1 && extensionBannersIndex !== -1 && systemOverviewIndex > extensionBannersIndex) ||
      (systemOverviewIndex !== -1 && exploreFeaturesIndex !== -1 && systemOverviewIndex > exploreFeaturesIndex)
    ) {
      console.log('Fixing dashboard section order to match registry defaults');
      dashboardOrdering.clear();
    }

    dashboardSections = sorted;
    dashboardOrdering.clear();
    // Save the new configuration to persist the correct order
    saveDashboardConfiguration().catch((error: unknown) => {
      console.error(`Failed to save dashboard configuration after registry change: ${error}`);
    });
  }
});

// Reset function for dashboard layout
async function resetDashboardLayout(): Promise<void> {
  if (!tablePersistence.storage) return;
  try {
    // Reset using the persistence callbacks (clears saved config)
    dashboardSections = filterListOrganizerItems(
      await tablePersistence.storage.reset('dashboard', $state.snapshot(defaultSection.names)),
    );
    dashboardOrdering.clear();

    // Reset the registry to default state
    await setupDashboardPageRegistry();

    // Ensure the registry reflects the reset state
    if (dashboardPageRegistry.entries.length > 0) {
      dashboardPageRegistry.entries = convertFromListOrganizerItems(dashboardSections, dashboardPageRegistry.entries);
    }
  } catch (error: unknown) {
    console.error(`Failed to reset dashboard layout: ${error}`);
  }
}

// Handle dashboard order changes from ListOrganizer
function handleDashboardOrderChange(newOrdering: SvelteMap<string, number>): void {
  dashboardOrdering.clear();
  newOrdering.entries().forEach(([id, order]) => {
    dashboardOrdering.set(id, order);
  });

  // Save configuration immediately when order changes
  saveDashboardConfiguration().catch((error: unknown) => {
    console.error(`Failed to save dashboard configuration after order change: ${error}`);
  });
}

// Handle dashboard section toggle changes from LayoutEditor
async function handleDashboardToggle(itemId: string, enabled: boolean): Promise<void> {
  dashboardSections = dashboardSections.map(item => (item.id === itemId ? { ...item, enabled } : item));

  if (enabled && itemId === GETTING_STARTED_SECTION_ID) {
    try {
      await window.updateConfigurationValue(GETTING_STARTED_DISMISSED_KEY, false);
    } catch (error: unknown) {
      console.error(`Failed to clear Getting Started dismissed state: ${error}`);
    }
    clearDashboardRestoreHint();
  }

  // Save configuration immediately when toggle changes
  saveDashboardConfiguration().catch((error: unknown) => {
    console.error(`Failed to save dashboard configuration after toggle change: ${error}`);
  });
}
</script>

<NavPage searchEnabled={false} title="Dashboard">
  {#snippet additionalActions()}
    <div
      class="relative"
      onclick={(): void => {
        if (dashboardDismissHint.showConfigureSectionsTooltip) {
          clearDashboardRestoreHint();
        }
      }}>
      {#if dashboardDismissHint.showConfigureSectionsTooltip}
        <div
          class="pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-[var(--pd-tooltip-border)] bg-[var(--pd-tooltip-bg)] px-3 py-2 text-xs leading-snug text-[var(--pd-tooltip-text)] shadow-md"
          role="status"
          aria-live="polite">
          <div
            class="absolute -top-1.5 right-2.5 h-2.5 w-2.5 rotate-45 border-l border-t border-[var(--pd-tooltip-border)] bg-[var(--pd-tooltip-bg)]">
          </div>
          {getDashboardConfigureSectionsTooltip(dashboardDismissHint.sectionName)}
        </div>
      {/if}
      <ListOrganizer
        items={listOrganizerSections}
        ordering={dashboardOrdering}
        title="Configure Dashboard Sections"
        enableReorder={true}
        enableToggle={true}
        onOrderChange={handleDashboardOrderChange}
        onToggle={handleDashboardToggle}
        onReset={resetDashboardLayout}
        resetButtonLabel="Reset Layout"
      />
    </div>
  {/snippet}
  
  {#snippet content()}
  <div class="flex flex-col min-w-full h-full bg-[var(--pd-content-bg)] py-5">
    <div class="min-w-full flex-1">
      <div class="px-5 space-y-5 h-full">
        {#each sortedDashboardRegistry as dashboardRegistryItem (dashboardRegistryItem.id)}
          {#if shouldSkipDashboardSection(dashboardRegistryItem.id)}
            <!-- Rendered beside System Overview -->
          {:else if dashboardRegistryItem.id === SYSTEM_OVERVIEW_SECTION_ID && pairGettingStartedWithSystemOverview}
            {@const SystemOverviewComponent = dashboardRegistryItem.component}
            {@const GettingStartedComponent = gettingStartedRegistryEntry?.component}
            <div class="flex flex-col items-stretch gap-5 xl:flex-row">
              <div class="min-w-0 flex-1">
                <SystemOverviewComponent />
              </div>
              {#if GettingStartedComponent}
                <GettingStartedComponent compactWidth={true} />
              {/if}
            </div>
          {:else if dashboardRegistryItem.id === SYSTEM_OVERVIEW_SECTION_ID}
            {@const SystemOverviewComponent = dashboardRegistryItem.component}
            <SystemOverviewComponent />
          {:else}
            {@const Component = dashboardRegistryItem.component}
            <Component />
          {/if}
        {/each}
      </div>
      <NotificationsBox />
    </div>
  </div>
  {/snippet}
</NavPage>

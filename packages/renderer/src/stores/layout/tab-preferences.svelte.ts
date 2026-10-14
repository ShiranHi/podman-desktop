import type { OpenMode } from '@podman-desktop/ui-svelte';
import { router } from 'tinro';

import { getLastAppPageUrl } from './page-tab.svelte';

const KEY = 'podman-desktop.workspace.tabs-enabled';
const LEGACY_KEY = 'podman-desktop.workspace.summary-links-new-tab';
const storedValue = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
let currentRouteUrl = '/';
router.subscribe(route => {
  currentRouteUrl = route.url;
});

/** Whether the tabs prototype is enabled for this app session/profile. */
export const tabPreferences = $state({ tabsEnabled: storedValue === 'true' });

export function setTabsEnabled(enabled: boolean): void {
  tabPreferences.tabsEnabled = enabled;
  localStorage.setItem(KEY, String(enabled));

  // Leaving the workspace immediately restores the normal production page flow.
  if (!enabled && currentRouteUrl.startsWith('/workspace')) {
    router.goto(getLastAppPageUrl(), true);
  }
}

/** Modifier-click behavior is available only while the tabs prototype is enabled. */
export function linkOpenMode(event: Pick<MouseEvent, 'metaKey' | 'ctrlKey'>, summary = false): OpenMode {
  if (!tabPreferences.tabsEnabled) return 'replace';
  return event.metaKey || event.ctrlKey || summary ? 'newTab' : 'replace';
}

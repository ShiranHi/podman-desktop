import type { OpenMode } from '@podman-desktop/ui-svelte';

const KEY = 'podman-desktop.workspace.summary-links-new-tab';
export const tabPreferences = $state({ summaryLinksInNewTabs: localStorage.getItem(KEY) === 'true' });
export function setSummaryLinksInNewTabs(enabled: boolean): void {
  tabPreferences.summaryLinksInNewTabs = enabled;
  localStorage.setItem(KEY, String(enabled));
}
export function linkOpenMode(event: Pick<MouseEvent, 'metaKey' | 'ctrlKey'>, summary = false): OpenMode {
  return event.metaKey || event.ctrlKey || (summary && tabPreferences.summaryLinksInNewTabs) ? 'newTab' : 'replace';
}

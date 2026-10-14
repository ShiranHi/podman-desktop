import { beforeEach, describe, expect, test, vi } from 'vitest';

import { applySerializedLayout, exportLayoutAsJson, importLayoutFromJson } from './layout-persistence.svelte';
import type { OpenTabInput } from './layout-store.svelte';
import {
  closeOthers,
  closeTabById,
  findLeaf,
  findLeafContainingTab,
  layoutState,
  openTab,
  pinToggle,
  resetLayout,
  selectTab,
  splitRight,
} from './layout-store.svelte';
import { linkOpenMode, setTabsEnabled } from './tab-preferences.svelte';

vi.mock(import('tinro'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    router: { ...original.router, subscribe: vi.fn((): (() => void) => (): void => {}), goto: vi.fn() },
  };
});
vi.mock(import('/@/stores/navigation-history.svelte'), () => ({
  goBack: vi.fn(),
  navigationHistory: { stack: [], index: 0 },
}));
vi.mock(import('./page-tab.svelte'), () => ({
  PAGE_TAB_ID: 'app-page-tab' as const,
  getPageTabTitle: (): string => 'Containers',
}));

const resource = (id: string): OpenTabInput => ({
  resourceType: 'container' as const,
  resourceId: id,
  subView: 'logs' as const,
  title: `${id} · Logs`,
});
beforeEach(() => {
  resetLayout();
  setTabsEnabled(false);
});

describe('first-version tab navigation', () => {
  test('keeps the page first and permanent', () => {
    const id = openTab(resource('web'));
    closeTabById('app-page-tab');
    expect(findLeafContainingTab(layoutState.tree, id)?.tabIds[0]).toBe('app-page-tab');
    expect(layoutState.tabs['app-page-tab'].permanent).toBe(true);
  });
  test('ordinary navigation replaces only the active tab in place', () => {
    const first = openTab(resource('web'), 'newTab');
    const second = openTab(resource('database'), 'newTab');
    const panel = findLeafContainingTab(layoutState.tree, first)!;
    selectTab(panel.id, first);
    const replacement = openTab(resource('api'), 'replace');
    expect(findLeaf(layoutState.tree, panel.id)?.tabIds).toEqual(['app-page-tab', replacement, second]);
    expect(layoutState.tabs[first]).toBeUndefined();
  });
  test('replacement preserves pinned tabs', () => {
    const id = openTab(resource('web'));
    pinToggle(layoutState.focusedPanelId, id);
    openTab(resource('api'), 'replace');
    expect(layoutState.tabs[id]).toBeDefined();
  });
  test('uses the focused split for navigation', () => {
    const id = openTab(resource('web'));
    splitRight(layoutState.focusedPanelId, id);
    const focused = layoutState.focusedPanelId;
    const next = openTab(resource('api'));
    expect(findLeafContainingTab(layoutState.tree, next)?.id).toBe(focused);
  });
  test('closing others protects the page and pinned tabs', () => {
    const first = openTab(resource('web'), 'newTab');
    const pinned = openTab(resource('db'), 'newTab');
    pinToggle(layoutState.focusedPanelId, pinned);
    const third = openTab(resource('api'), 'newTab');
    closeOthers(layoutState.focusedPanelId, first);
    expect(Object.keys(layoutState.tabs).toSorted((a, b) => a.localeCompare(b))).toEqual(
      ['app-page-tab', first, pinned].toSorted((a, b) => a.localeCompare(b)),
    );
    expect(layoutState.tabs[third]).toBeUndefined();
  });
  test('terminal and log icons are distinct', () => {
    const log = openTab(resource('web'), 'newTab');
    const terminal = openTab({ ...resource('web'), subView: 'terminal' }, 'newTab');
    expect(layoutState.tabs[log].iconClass).not.toBe(layoutState.tabs[terminal].iconClass);
  });
});

describe('summary preference and modifiers', () => {
  test('disabled tabs keep links and modifier clicks in production navigation', () => {
    expect(linkOpenMode({ metaKey: false, ctrlKey: false }, true)).toBe('replace');
    expect(linkOpenMode({ metaKey: true, ctrlKey: false })).toBe('replace');
    expect(linkOpenMode({ metaKey: false, ctrlKey: true })).toBe('replace');
  });
  test('Cmd and Ctrl explicitly open new tabs when tabs are enabled', () => {
    setTabsEnabled(true);
    expect(linkOpenMode({ metaKey: true, ctrlKey: false })).toBe('newTab');
    expect(linkOpenMode({ metaKey: false, ctrlKey: true })).toBe('newTab');
  });
  test('enabled tabs apply the default new-tab behavior to summary links only', () => {
    setTabsEnabled(true);
    expect(linkOpenMode({ metaKey: false, ctrlKey: false }, true)).toBe('newTab');
    expect(linkOpenMode({ metaKey: false, ctrlKey: false })).toBe('replace');
  });
});

describe('layout recovery', () => {
  test('rejects malformed and Scope 2 imports without losing current tabs', () => {
    openTab(resource('web'));
    const before = exportLayoutAsJson();
    expect(() => importLayoutFromJson('{"tree":null}')).toThrow();
    const invalid = JSON.parse(before);
    const id = Object.keys(invalid.tabs).find(id => id !== 'app-page-tab')!;
    invalid.tabs[id].resourceType = 'action';
    expect(() => applySerializedLayout(invalid)).toThrow();
    expect(exportLayoutAsJson()).toBe(before);
  });
  test('export/import round trip preserves layout', () => {
    openTab(resource('web'));
    const before = exportLayoutAsJson();
    resetLayout();
    importLayoutFromJson(before);
    expect(exportLayoutAsJson()).toBe(before);
  });
});

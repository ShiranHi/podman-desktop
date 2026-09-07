import { derived, type Readable, writable } from 'svelte/store';

export interface PrototypeScreen {
  value: string;
  label: string;
}

export interface PrototypeConfig<T> {
  name: string;
  screens: PrototypeScreen[];
  overrides: Record<string, T>;
}

interface PrototypeState {
  name: string;
  screens: PrototypeScreen[];
}

export const activePrototype = writable<PrototypeState | undefined>();
export const currentScreen = writable<string>('');

let currentOverrides: Record<string, unknown> = {};

export const currentOverride: Readable<unknown | undefined> = derived(
  [currentScreen, activePrototype],
  ([$screen]) => currentOverrides[$screen],
);

export function registerPrototype<T>(config: PrototypeConfig<T>): Readable<T | undefined> {
  currentOverrides = config.overrides as Record<string, unknown>;
  activePrototype.set({ name: config.name, screens: config.screens });
  currentScreen.set(config.screens[0]?.value ?? '');
  return currentOverride as Readable<T | undefined>;
}

export function unregisterPrototype(): void {
  currentOverrides = {};
  activePrototype.set(undefined);
  currentScreen.set('');
}

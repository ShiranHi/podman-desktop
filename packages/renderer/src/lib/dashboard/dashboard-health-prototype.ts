/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { ENHANCED_DASHBOARD_CONFIGURATION_KEY } from '@podman-desktop/core-api';

import { buildMockProviderInfo } from '/@/lib/dashboard/dashboard-mock-provider';
import {
  buildHealthScenarioData,
  DASHBOARD_PROTOTYPE_HEALTH_SCENARIOS,
  HEALTH_SCENARIO_LABELS,
  type HealthScenario,
} from '/@/mock-health-scenarios';
import {
  getRuntimeStatusBarEntries,
  getRuntimeSystemOverviewStatus,
  resetRuntimeProviderState,
} from '/@/mock-provider-lifecycle';
import { currentScreen, registerPrototype, unregisterPrototype } from '/@/stores/prototype';

export const DASHBOARD_PROTOTYPE_CURRENT = 'current';
export const DASHBOARD_PROTOTYPE_ENHANCED = 'enhanced';
export const DASHBOARD_PROTOTYPE_SCREEN_KEY = 'dashboard.prototypeScreen';

interface DashboardHealthOverride {
  scenario: HealthScenario;
}

interface PrototypeWindow extends Window {
  setPrototypeApiReturn?: (name: string, value: unknown | null) => void;
  clearPrototypeApiReturns?: () => void;
}

let screenUnsubscribe: (() => void) | undefined;

function isHealthScenario(value: string): value is HealthScenario {
  return DASHBOARD_PROTOTYPE_HEALTH_SCENARIOS.includes(value as HealthScenario);
}

function getPrototypeWindow(): PrototypeWindow {
  return window as PrototypeWindow;
}

function isDashboardPrototypeScreen(value: string): boolean {
  return (
    value === DASHBOARD_PROTOTYPE_CURRENT ||
    value === DASHBOARD_PROTOTYPE_ENHANCED ||
    value === 'legacy' ||
    isHealthScenario(value)
  );
}

function normalizeStoredPrototypeScreen(value: string): string {
  if (value === 'legacy') {
    return DASHBOARD_PROTOTYPE_CURRENT;
  }
  return value;
}

function persistPrototypeScreen(screen: string): void {
  localStorage.setItem(DASHBOARD_PROTOTYPE_SCREEN_KEY, screen);
}

function buildDashboardPrototypeScreens(): Array<{ value: string; label: string }> {
  return [
    { value: DASHBOARD_PROTOTYPE_CURRENT, label: 'Current dashboard' },
    { value: DASHBOARD_PROTOTYPE_ENHANCED, label: 'Enhanced dashboard' },
    ...DASHBOARD_PROTOTYPE_HEALTH_SCENARIOS.map(value => ({
      value,
      label: HEALTH_SCENARIO_LABELS[value],
    })),
  ];
}

async function resolveInitialDashboardPrototypeScreen(): Promise<string> {
  const stored = localStorage.getItem(DASHBOARD_PROTOTYPE_SCREEN_KEY);
  if (stored && isDashboardPrototypeScreen(stored)) {
    return normalizeStoredPrototypeScreen(stored);
  }

  return DASHBOARD_PROTOTYPE_CURRENT;
}

function syncHealthScenarioPrototypeApiReturns(): void {
  const prototypeWindow = getPrototypeWindow();
  prototypeWindow.setPrototypeApiReturn?.('getProviderInfos', [buildMockProviderInfo()]);
  prototypeWindow.setPrototypeApiReturn?.('getDashboardSystemOverviewStatus', getRuntimeSystemOverviewStatus());
  prototypeWindow.setPrototypeApiReturn?.('getStatusBarEntries', getRuntimeStatusBarEntries());
  prototypeWindow.setPrototypeApiReturn?.('isExperimentalConfigurationEnabled', {
    [ENHANCED_DASHBOARD_CONFIGURATION_KEY]: true,
  });
  prototypeWindow.setPrototypeApiReturn?.('getExtensionBanners', [
    {
      extensionId: 'podman-desktop.ai-lab',
      title: 'Supercharge your apps with Podman AI Lab!',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6IiBmaWxsPSIjODkyMmZmIi8+PC9zdmc+',
      description: 'Build, test, and tune LLM-based applications with Podman AI Lab.',
    },
  ]);
}

function clearPrototypeApiReturns(): void {
  getPrototypeWindow().clearPrototypeApiReturns?.();
}

function refreshDashboardUiState(): void {
  window.events?.send('provider-change');
  window.events?.send('provider-container-connection-update-status');
  window.events?.send('dashboard:system-overview-status');
  window.events?.send('status-bar-updated');
}

async function enableEnhancedDashboard(): Promise<void> {
  await window.enableExperimentalConfiguration(ENHANCED_DASHBOARD_CONFIGURATION_KEY);
}

async function disableEnhancedDashboard(): Promise<void> {
  await window.disableExperimentalConfiguration(ENHANCED_DASHBOARD_CONFIGURATION_KEY);
}

export async function applyCurrentDashboard(): Promise<void> {
  clearPrototypeApiReturns();
  await disableEnhancedDashboard();
  persistPrototypeScreen(DASHBOARD_PROTOTYPE_CURRENT);
  refreshDashboardUiState();
}

export async function applyEnhancedDashboard(): Promise<void> {
  clearPrototypeApiReturns();
  await enableEnhancedDashboard();
  persistPrototypeScreen(DASHBOARD_PROTOTYPE_ENHANCED);
  refreshDashboardUiState();
}

export async function applyDashboardHealthScenario(scenario: HealthScenario): Promise<void> {
  const scenarioData = buildHealthScenarioData(scenario);
  resetRuntimeProviderState(scenarioData);
  syncHealthScenarioPrototypeApiReturns();
  await enableEnhancedDashboard();
  persistPrototypeScreen(scenario);
  refreshDashboardUiState();
}

export async function handleDashboardPrototypeScreen(screen: string): Promise<void> {
  if (screen === DASHBOARD_PROTOTYPE_CURRENT) {
    await applyCurrentDashboard();
    return;
  }

  if (screen === DASHBOARD_PROTOTYPE_ENHANCED) {
    await applyEnhancedDashboard();
    return;
  }

  const scenario = parseHealthScenario(screen);
  if (scenario) {
    await applyDashboardHealthScenario(scenario);
  }
}

export function registerDashboardHealthPrototype(): void {
  const overrides = Object.fromEntries(
    DASHBOARD_PROTOTYPE_HEALTH_SCENARIOS.map(key => [key, { scenario: key }]),
  ) as Record<string, DashboardHealthOverride>;

  registerPrototype<DashboardHealthOverride>({
    name: 'Dashboard',
    screens: buildDashboardPrototypeScreens(),
    overrides,
  });

  void (async (): Promise<void> => {
    const initialScreen = await resolveInitialDashboardPrototypeScreen();
    let applyingInitial = true;

    screenUnsubscribe = currentScreen.subscribe(screen => {
      if (applyingInitial) {
        return;
      }
      handleDashboardPrototypeScreen(screen).catch((error: unknown) => {
        console.error(`Failed to apply dashboard prototype screen: ${error}`);
      });
    });

    await handleDashboardPrototypeScreen(initialScreen);
    applyingInitial = false;
    currentScreen.set(initialScreen);
  })().catch((error: unknown) => {
    console.error(`Failed to initialize dashboard health prototype: ${error}`);
  });
}

export function unregisterDashboardHealthPrototype(): void {
  screenUnsubscribe?.();
  screenUnsubscribe = undefined;
  clearPrototypeApiReturns();
  unregisterPrototype();
}

export function parseHealthScenario(value: string): HealthScenario | undefined {
  return isHealthScenario(value) ? value : undefined;
}

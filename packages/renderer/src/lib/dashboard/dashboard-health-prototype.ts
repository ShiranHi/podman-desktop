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

import { buildMockProviderInfo } from '/@/lib/dashboard/dashboard-mock-provider';
import { buildHealthScenarioData, HEALTH_SCENARIO_LABELS, type HealthScenario } from '/@/mock-health-scenarios';
import {
  getRuntimeStatusBarEntries,
  getRuntimeSystemOverviewStatus,
  resetRuntimeProviderState,
} from '/@/mock-provider-lifecycle';
import { registerPrototype, unregisterPrototype } from '/@/stores/prototype';

interface DashboardHealthOverride {
  scenario: HealthScenario;
}

interface PrototypeWindow extends Window {
  setPrototypeApiReturn?: (name: string, value: unknown | null) => void;
  clearPrototypeApiReturns?: () => void;
}

let overrideUnsubscribe: (() => void) | undefined;

function isHealthScenario(value: string): value is HealthScenario {
  return value in HEALTH_SCENARIO_LABELS;
}

function getPrototypeWindow(): PrototypeWindow {
  return window as PrototypeWindow;
}

function syncPrototypeApiReturns(): void {
  const prototypeWindow = getPrototypeWindow();
  prototypeWindow.setPrototypeApiReturn?.('getProviderInfos', [buildMockProviderInfo()]);
  prototypeWindow.setPrototypeApiReturn?.('getDashboardSystemOverviewStatus', getRuntimeSystemOverviewStatus());
  prototypeWindow.setPrototypeApiReturn?.('getStatusBarEntries', getRuntimeStatusBarEntries());
  prototypeWindow.setPrototypeApiReturn?.('isExperimentalConfigurationEnabled', {
    'dashboard.enhancedDashboard': true,
  });
  // Mock extension banner to always show AI Lab banner in prototype mode
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

export function applyDashboardHealthScenario(scenario: HealthScenario): void {
  const scenarioData = buildHealthScenarioData(scenario);
  resetRuntimeProviderState(scenarioData);
  syncPrototypeApiReturns();
  window.events?.send('enhanced-dashboard-enabled', true);
  window.events?.send('provider-change');
  window.events?.send('provider-container-connection-update-status');
  window.events?.send('dashboard:system-overview-status');
  window.events?.send('status-bar-updated');
}

export function registerDashboardHealthPrototype(): void {
  const screens = [
    { value: 'current', label: 'Current' },
    ...Object.entries(HEALTH_SCENARIO_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const overrides = Object.fromEntries(
    Object.keys(HEALTH_SCENARIO_LABELS).map(key => [key, { scenario: key as HealthScenario }]),
  ) as Record<string, DashboardHealthOverride>;

  const override = registerPrototype<DashboardHealthOverride>({
    name: 'Dashboard health',
    screens,
    overrides,
  });

  overrideUnsubscribe = override.subscribe(value => {
    if (!value?.scenario) {
      // "Current" option selected or no override - clear all prototype API returns and trigger refresh
      clearPrototypeApiReturns();
      window.events?.send('enhanced-dashboard-enabled', false);
      window.events?.send('provider-change');
      window.events?.send('provider-container-connection-update-status');
      window.events?.send('dashboard:system-overview-status');
      window.events?.send('status-bar-updated');
      return;
    }
    applyDashboardHealthScenario(value.scenario);
  });
}

export function unregisterDashboardHealthPrototype(): void {
  overrideUnsubscribe?.();
  overrideUnsubscribe = undefined;
  clearPrototypeApiReturns();
  unregisterPrototype();
}

export function parseHealthScenario(value: string): HealthScenario | undefined {
  return isHealthScenario(value) ? value : undefined;
}

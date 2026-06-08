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

import type { StatusBarEntryDescriptor, SystemOverviewStatusInfo } from '@podman-desktop/core-api';

export type HealthScenario =
  | 'healthy'
  | 'warning'
  | 'stopped-machine'
  | 'stopped-k8s'
  | 'starting'
  | 'critical'
  | 'multiple-issues'
  | 'not-configured';

export const HEALTH_SCENARIO_LABELS: Record<HealthScenario, string> = {
  healthy: 'Healthy — all systems operational',
  warning: 'Warning — high memory usage',
  'stopped-machine': 'Info — machine stopped',
  'stopped-k8s': 'Info — Kubernetes cluster stopped',
  starting: 'Info — machine starting',
  critical: 'Critical — connection error',
  'multiple-issues': 'Critical — multiple errors',
  'not-configured': 'Info — no machine configured',
};

const SCENARIO_QUERY_KEY = 'scenario';
const SCENARIO_STORAGE_KEY = 'dashboard-health-scenario';

export function readHealthScenarioFromUrl(): HealthScenario {
  if (typeof window === 'undefined') return 'healthy';
  const fromQuery = new URLSearchParams(window.location.search).get(SCENARIO_QUERY_KEY);
  if (fromQuery && fromQuery in HEALTH_SCENARIO_LABELS) {
    return fromQuery as HealthScenario;
  }
  const stored = localStorage.getItem(SCENARIO_STORAGE_KEY);
  if (stored && stored in HEALTH_SCENARIO_LABELS) {
    return stored as HealthScenario;
  }
  return 'healthy';
}

export function setHealthScenario(scenario: HealthScenario): void {
  localStorage.setItem(SCENARIO_STORAGE_KEY, scenario);
  const url = new URL(window.location.href);
  url.searchParams.set(SCENARIO_QUERY_KEY, scenario);
  window.location.assign(url.toString());
}

export type MockConnectionTemplate = {
  connectionType: 'container' | 'kubernetes';
  name: string;
  displayName?: string;
  status: 'started' | 'stopped' | 'starting' | 'stopping' | 'unknown';
  error?: string;
  endpoint: { socketPath?: string; apiURL?: string };
  type?: 'podman';
  canStart: boolean;
  canStop: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export interface HealthScenarioData {
  systemOverviewStatus: SystemOverviewStatusInfo;
  statusBarEntries: StatusBarEntryDescriptor[];
  composeExtensionEnabled: boolean;
  provider: {
    status: 'started' | 'configured' | 'installed' | 'not-installed' | 'starting' | 'stopping' | 'error';
    containerConnections: MockConnectionTemplate[];
    kubernetesConnections: MockConnectionTemplate[];
    warnings: Array<{ name: string; details?: string }>;
    canStart: boolean;
  };
}

const K8S_NAME = 'minikube';

export function createMockContainerConnection(
  status: MockConnectionTemplate['status'],
  error?: string,
): MockConnectionTemplate {
  return {
    connectionType: 'container',
    name: 'Podman Machine',
    displayName: 'Podman Machine',
    status,
    error,
    endpoint: { socketPath: '/mock/podman.sock' },
    type: 'podman',
    canStart: true,
    canStop: true,
    canEdit: true,
    canDelete: true,
  };
}

export function createMockK8sConnection(
  status: MockConnectionTemplate['status'],
  error?: string,
): MockConnectionTemplate {
  return {
    connectionType: 'kubernetes',
    name: K8S_NAME,
    status,
    error,
    endpoint: { apiURL: 'https://192.168.49.2:8443' },
    canStart: true,
    canStop: true,
    canEdit: true,
    canDelete: true,
  };
}

export function buildHealthScenarioData(scenario: HealthScenario): HealthScenarioData {
  switch (scenario) {
    case 'warning':
      return {
        systemOverviewStatus: { status: 'healthy', text: 'All systems operational' },
        statusBarEntries: [],
        composeExtensionEnabled: true,
        provider: {
          status: 'started',
          containerConnections: [createMockContainerConnection('started')],
          kubernetesConnections: [createMockK8sConnection('started')],
          warnings: [
            { name: 'High memory', details: 'Memory usage is above 85%. Consider increasing machine limits.' },
          ],
          canStart: true,
        },
      };
    case 'stopped-machine':
      return {
        systemOverviewStatus: { status: 'stable', text: 'Some systems are stopped' },
        statusBarEntries: [],
        composeExtensionEnabled: true,
        provider: {
          status: 'started',
          containerConnections: [createMockContainerConnection('stopped')],
          kubernetesConnections: [createMockK8sConnection('stopped')],
          warnings: [],
          canStart: true,
        },
      };
    case 'stopped-k8s':
      return {
        systemOverviewStatus: { status: 'stable', text: 'Some systems are stopped' },
        statusBarEntries: [],
        composeExtensionEnabled: true,
        provider: {
          status: 'started',
          containerConnections: [createMockContainerConnection('started')],
          kubernetesConnections: [createMockK8sConnection('stopped')],
          warnings: [],
          canStart: true,
        },
      };
    case 'starting':
      return {
        systemOverviewStatus: { status: 'progressing', text: 'Starting' },
        statusBarEntries: [],
        composeExtensionEnabled: true,
        provider: {
          status: 'starting',
          containerConnections: [createMockContainerConnection('starting')],
          kubernetesConnections: [],
          warnings: [],
          canStart: true,
        },
      };
    case 'critical':
      return {
        systemOverviewStatus: { status: 'critical', text: 'Error detected' },
        statusBarEntries: [
          {
            priority: 0,
            alignLeft: true,
            entry: {
              text: 'Error detected',
              tooltip: 'System issues detected',
              activeIconClass: 'fas fa-triangle-exclamation',
              enabled: true,
              command: 'navigateToResources',
            },
          },
        ],
        composeExtensionEnabled: true,
        provider: {
          status: 'started',
          containerConnections: [createMockContainerConnection('stopped', 'Connection refused')],
          kubernetesConnections: [createMockK8sConnection('stopped')],
          warnings: [],
          canStart: true,
        },
      };
    case 'multiple-issues':
      return {
        systemOverviewStatus: { status: 'critical', text: 'Multiple errors detected' },
        statusBarEntries: [
          {
            priority: 0,
            alignLeft: true,
            entry: {
              text: 'Multiple errors detected',
              tooltip: 'System issues detected',
              activeIconClass: 'fas fa-triangle-exclamation',
              enabled: true,
              command: 'navigateToResources',
            },
          },
        ],
        composeExtensionEnabled: false,
        provider: {
          status: 'error',
          containerConnections: [createMockContainerConnection('stopped', 'Timeout while starting Podman Machine')],
          kubernetesConnections: [createMockK8sConnection('stopped', 'Cluster unreachable')],
          warnings: [{ name: 'Low disk', details: 'Disk is almost full' }],
          canStart: true,
        },
      };
    case 'not-configured':
      return {
        systemOverviewStatus: { status: 'stable', text: 'Some systems are stopped' },
        statusBarEntries: [],
        composeExtensionEnabled: false,
        provider: {
          status: 'configured',
          containerConnections: [],
          kubernetesConnections: [],
          warnings: [],
          canStart: true,
        },
      };
    case 'healthy':
    default:
      return {
        systemOverviewStatus: { status: 'healthy', text: 'All systems operational' },
        statusBarEntries: [],
        composeExtensionEnabled: true,
        provider: {
          status: 'started',
          containerConnections: [createMockContainerConnection('started')],
          kubernetesConnections: [createMockK8sConnection('started')],
          warnings: [],
          canStart: true,
        },
      };
  }
}

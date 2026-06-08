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

import type {
  ProviderConnectionInfo,
  StatusBarEntryDescriptor,
  SystemOverviewStatusInfo,
} from '@podman-desktop/core-api';

import {
  createMockContainerConnection,
  createMockK8sConnection,
  type HealthScenarioData,
  type MockConnectionTemplate,
} from './mock-health-scenarios';

const START_DURATION_MS = 2000;

type RuntimeProviderState = HealthScenarioData['provider'];

let runtimeProvider: RuntimeProviderState;
let runtimeSystemOverview: SystemOverviewStatusInfo;
let runtimeStatusBarEntries: StatusBarEntryDescriptor[] = [];
let lifecycleInProgress = false;

function cloneProvider(provider: RuntimeProviderState): RuntimeProviderState {
  return structuredClone(provider);
}

function computeSystemOverviewStatus(provider: RuntimeProviderState): SystemOverviewStatusInfo {
  const connections = [...provider.containerConnections, ...provider.kubernetesConnections];

  const errors = connections.filter(connection => connection.error);
  if (errors.length > 0) {
    return {
      status: 'critical',
      text: errors.length > 1 ? 'Multiple errors detected' : 'Error detected',
    };
  }

  if (provider.status === 'stopping' || connections.some(connection => connection.status === 'stopping')) {
    return { status: 'progressing', text: 'Stopping' };
  }

  if (provider.status === 'starting' || connections.some(connection => connection.status === 'starting')) {
    return { status: 'progressing', text: 'Starting' };
  }

  const hasStartedContainer = provider.containerConnections.some(connection => connection.status === 'started');
  const hasStoppedConnections = connections.some(
    connection => connection.status === 'stopped' || connection.status === 'unknown',
  );
  const hasWarnings = provider.warnings.length > 0;

  if (hasStartedContainer && !hasStoppedConnections && !hasWarnings) {
    return { status: 'healthy', text: 'All systems operational' };
  }

  if (hasWarnings && !hasStoppedConnections) {
    return {
      status: 'stable',
      text: provider.warnings.length === 1 ? '1 warning detected' : `${provider.warnings.length} warnings detected`,
    };
  }

  if (hasStartedContainer && hasStoppedConnections) {
    return { status: 'stable', text: 'Some systems are stopped' };
  }

  return { status: 'stable', text: 'Some systems are stopped' };
}

function computeStatusBarEntries(overview: SystemOverviewStatusInfo): StatusBarEntryDescriptor[] {
  if (overview.status !== 'critical') {
    return [];
  }

  return [
    {
      priority: 0,
      alignLeft: true,
      entry: {
        text: overview.text,
        tooltip: 'System issues detected',
        activeIconClass: 'fas fa-triangle-exclamation',
        enabled: true,
        command: 'navigateToResources',
      },
    },
  ];
}

function syncDerivedState(): void {
  runtimeSystemOverview = computeSystemOverviewStatus(runtimeProvider);
  runtimeStatusBarEntries = computeStatusBarEntries(runtimeSystemOverview);
}

function findConnection(
  connectionType: ProviderConnectionInfo['connectionType'],
  name: string,
): MockConnectionTemplate | undefined {
  if (connectionType === 'container') {
    return runtimeProvider.containerConnections.find(connection => connection.name === name);
  }
  if (connectionType === 'kubernetes') {
    return runtimeProvider.kubernetesConnections.find(connection => connection.name === name);
  }
  return undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function resetRuntimeProviderState(scenarioData: HealthScenarioData): void {
  runtimeProvider = cloneProvider(scenarioData.provider);
  runtimeSystemOverview = { ...scenarioData.systemOverviewStatus };
  runtimeStatusBarEntries = [...scenarioData.statusBarEntries];
  lifecycleInProgress = false;
}

export function getRuntimeProviderState(): RuntimeProviderState {
  return runtimeProvider;
}

export function getRuntimeSystemOverviewStatus(): SystemOverviewStatusInfo {
  return runtimeSystemOverview;
}

export function getRuntimeStatusBarEntries(): StatusBarEntryDescriptor[] {
  return runtimeStatusBarEntries;
}

export async function mockStartProviderConnectionLifecycle(
  connectionSnapshot: ProviderConnectionInfo,
  loggerHandlerKey: symbol,
  eventCollect: (key: symbol, eventName: 'log' | 'warn' | 'error' | 'finish', args: string[]) => void,
  onStateChange: () => void,
): Promise<void> {
  if (lifecycleInProgress) {
    return;
  }

  const connection = findConnection(connectionSnapshot.connectionType, connectionSnapshot.name);
  if (!connection) {
    throw new Error(`Connection ${connectionSnapshot.name} not found`);
  }

  if (connection.status === 'started' && !connection.error) {
    return;
  }

  lifecycleInProgress = true;

  try {
    const isRetry = !!connection.error;
    connection.status = 'starting';
    delete connection.error;
    if (connectionSnapshot.connectionType === 'container') {
      runtimeProvider.status = 'starting';
    }
    syncDerivedState();
    onStateChange();

    const label = isRetry
      ? `Retrying ${connectionSnapshot.name}…`
      : connectionSnapshot.connectionType === 'kubernetes'
        ? `Starting ${connectionSnapshot.name}…`
        : 'Starting Podman Machine…';
    eventCollect(loggerHandlerKey, 'log', [label]);

    await delay(START_DURATION_MS);

    connection.status = 'started';
    delete connection.error;

    if (connectionSnapshot.connectionType === 'container') {
      runtimeProvider.status = 'started';
    }

    syncDerivedState();
    onStateChange();

    eventCollect(loggerHandlerKey, 'log', [`${connectionSnapshot.name} is running.`]);
    eventCollect(loggerHandlerKey, 'finish', []);
  } finally {
    lifecycleInProgress = false;
  }
}

export async function mockStartProvider(onStateChange: () => void): Promise<void> {
  if (lifecycleInProgress) {
    return;
  }

  if (runtimeProvider.containerConnections.length === 0) {
    lifecycleInProgress = true;
    try {
      runtimeProvider.containerConnections = [createMockContainerConnection('starting')];
      runtimeProvider.kubernetesConnections = [createMockK8sConnection('stopped')];
      runtimeProvider.status = 'starting';
      syncDerivedState();
      onStateChange();

      await delay(START_DURATION_MS);

      runtimeProvider.containerConnections = [createMockContainerConnection('started')];
      runtimeProvider.kubernetesConnections = [createMockK8sConnection('stopped')];
      runtimeProvider.status = 'started';
      syncDerivedState();
      onStateChange();
    } finally {
      lifecycleInProgress = false;
    }
    return;
  }

  const stoppedMachine = runtimeProvider.containerConnections.find(
    connection => connection.status === 'stopped' || !!connection.error,
  );
  if (stoppedMachine) {
    await mockStartProviderConnectionLifecycle(
      {
        ...stoppedMachine,
        connectionType: 'container',
      },
      Symbol('setup-start'),
      () => {},
      onStateChange,
    );
  }
}

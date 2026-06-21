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

import type { ProviderConnectionStatus, ProviderStatus } from '@podman-desktop/api';
import type { ProviderConnectionInfo, ProviderInfo, SystemOverviewStatus } from '@podman-desktop/core-api';
import type { ButtonType } from '@podman-desktop/ui-svelte';

import {
  type ConnectionCallback,
  eventCollect,
  registerConnectionCallback,
} from '/@/lib/preferences/preferences-connection-rendering-task';

export const STATUS_TEXT_CLASS: Record<SystemOverviewStatus, string> = {
  healthy: 'text-[var(--pd-status-running)]',
  stable: 'text-[var(--pd-status-stopped)]',
  progressing: 'text-[var(--pd-status-starting)]',
  critical: 'text-[var(--pd-status-terminated)]',
} as const;

export const STATUS_BG_CLASS: Record<SystemOverviewStatus, string> = {
  healthy: 'bg-[var(--pd-status-running-bg)]',
  stable: 'bg-[var(--pd-status-stopped-bg)]',
  progressing: 'bg-[var(--pd-status-starting-bg)]',
  critical: 'bg-[var(--pd-status-terminated-bg)]',
} as const;

export const STATUS_DOT_CLASS: Record<SystemOverviewStatus, string> = {
  healthy: 'bg-[var(--pd-status-running)]',
  stable: 'bg-[var(--pd-status-stopped)]',
  progressing: 'bg-[var(--pd-status-starting)]',
  critical: 'bg-[var(--pd-status-terminated)]',
} as const;

function isStoppingStatus(
  overviewStatus: SystemOverviewStatus,
  providerConnectionStatus?: ProviderConnectionStatus,
  displayText?: string,
): boolean {
  if (providerConnectionStatus === 'stopping') {
    return true;
  }
  return overviewStatus === 'progressing' && displayText !== undefined && /stop/i.test(displayText);
}

/** Stopping uses stopped (gray) styling; starting keeps progressing (green). */
export function getStatusTextClass(
  overviewStatus: SystemOverviewStatus,
  providerConnectionStatus?: ProviderConnectionStatus,
  displayText?: string,
): string {
  if (isStoppingStatus(overviewStatus, providerConnectionStatus, displayText)) {
    return STATUS_TEXT_CLASS.stable;
  }
  return STATUS_TEXT_CLASS[overviewStatus];
}

export function getStatusDotClass(
  overviewStatus: SystemOverviewStatus,
  providerConnectionStatus?: ProviderConnectionStatus,
  displayText?: string,
): string {
  if (isStoppingStatus(overviewStatus, providerConnectionStatus, displayText)) {
    return STATUS_DOT_CLASS.stable;
  }
  return STATUS_DOT_CLASS[overviewStatus];
}

export const WARNING_TEXT_CLASS = 'text-[var(--pd-state-warning)]';
export const WARNING_BG_CLASS = 'bg-[var(--pd-state-warning-bg,var(--pd-status-starting-bg))]';

/** User-facing aggregate label; maps internal `progressing` to Starting/Stopping. */
export function getSystemOverviewDisplayText(status: SystemOverviewStatus, text: string): string {
  if (status !== 'progressing') {
    return text;
  }
  return /stop/i.test(text) ? 'Stopping' : 'Starting';
}

/** Lower number = higher priority (shown first). */
export function getConnectionSortPriority(
  status: ProviderConnectionStatus | ProviderStatus,
  error?: string,
  hasWarnings?: boolean,
): number {
  if (error) return 0;
  if (hasWarnings) return 1;
  if (status === 'starting' || status === 'stopping') return 2;
  if (status === 'stopped' || status === 'unknown') return 3;
  if (status === 'error') return 0;
  return 4;
}

export interface ConnectionStatusConfig {
  label: string;
  buttonText: string;
  buttonType: ButtonType;
}

export function hasStartLifecycle(provider: ProviderInfo): boolean {
  return provider.canStart;
}

/** Engine id used to nest Kubernetes/VM connections under a container connection card. */
export function getContainerConnectionEngineId(provider: ProviderInfo, connection: ProviderConnectionInfo): string {
  return `${provider.id}.${connection.name}`;
}

/**
 * Resolve which container connection owns a Kubernetes context.
 * Prefer container label match; fall back to the sole container connection on the provider
 * so nested connections do not flash in "Other Connections" while containers are loading.
 */
export function resolveKubernetesOwnerEngineId(
  connectionName: string,
  provider: ProviderInfo,
  containers: Array<{ Labels?: Record<string, string>; engineId?: string }>,
): string | undefined {
  const fromLabels = containers.find(
    container => container.Labels && Object.values(container.Labels).includes(connectionName),
  )?.engineId;
  if (fromLabels !== undefined) {
    return fromLabels;
  }

  if (provider.containerConnections.length === 1) {
    return getContainerConnectionEngineId(provider, provider.containerConnections[0]);
  }

  return undefined;
}

/**
 * Resolve which container connection owns a VM connection.
 * Prefer container engineName match; fall back to the sole container connection on the provider.
 */
export function resolveVmOwnerEngineId(
  connectionName: string,
  provider: ProviderInfo,
  containers: Array<{ engineName?: string; engineId?: string }>,
): string | undefined {
  const fromEngineName = containers.find(container => container.engineName === connectionName)?.engineId;
  if (fromEngineName !== undefined) {
    return fromEngineName;
  }

  if (provider.containerConnections.length === 1) {
    return getContainerConnectionEngineId(provider, provider.containerConnections[0]);
  }

  return undefined;
}

const CONNECTION_STATUS_LABELS: Record<ProviderConnectionStatus, string> = {
  started: 'Running',
  stopped: 'Stopped',
  unknown: 'Unknown',
  starting: 'Starting',
  stopping: 'Stopping',
};

export function getConnectionStatusConfig(
  status: ProviderConnectionStatus | ProviderStatus,
  provider: ProviderInfo,
  error?: string,
): ConnectionStatusConfig {
  const label = error ? 'Error' : (CONNECTION_STATUS_LABELS[status as ProviderConnectionStatus] ?? status);

  if (error && hasStartLifecycle(provider))
    return { label, buttonText: `Retry ${provider.name}`, buttonType: 'primary' };
  if ((status === 'stopped' || status === 'configured') && hasStartLifecycle(provider))
    return { label, buttonText: `Start ${provider.name}`, buttonType: 'primary' };
  if (status === 'unknown') return { label, buttonText: 'See Details in Resources', buttonType: 'danger' };
  if (status === 'started' || status === 'starting' || status === 'stopping' || status === 'stopped')
    return { label, buttonText: 'View', buttonType: 'secondary' };
  if (status !== 'configured') return { label, buttonText: `Set up ${provider.name}`, buttonType: 'primary' };
  return { label, buttonText: 'View', buttonType: 'secondary' };
}

function createNoopLogger(): ConnectionCallback {
  return { log: (): void => {}, warn: (): void => {}, error: (): void => {}, onEnd: (): void => {} };
}

export async function startConnection(
  providerInternalId: string,
  connectionSnapshot: ProviderConnectionInfo,
): Promise<symbol> {
  const loggerHandlerKey = registerConnectionCallback(createNoopLogger());
  await window.startProviderConnectionLifecycle(providerInternalId, connectionSnapshot, loggerHandlerKey, eventCollect);
  return loggerHandlerKey;
}

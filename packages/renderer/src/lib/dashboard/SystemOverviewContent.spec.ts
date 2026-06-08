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

import '@testing-library/jest-dom/vitest';

import type {
  ProviderContainerConnectionInfo,
  ProviderInfo,
  ProviderKubernetesConnectionInfo,
} from '@podman-desktop/core-api';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { router } from 'tinro';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { providerInfos } from '/@/stores/providers';

import SystemOverviewContent from './SystemOverviewContent.svelte';

vi.mock(import('tinro'));
vi.mock(import('/@/lib/dashboard/SystemOverviewProviderCardDetailed.svelte'));
vi.mock(import('/@/lib/dashboard/SystemOverviewProviderSetup.svelte'));
vi.mock(import('/@/lib/dashboard/SystemOverviewProviderCardCompact.svelte'));

const baseProvider: ProviderInfo = {
  internalId: 'podman-internal',
  id: 'podman',
  extensionId: 'podman',
  name: 'Podman',
  containerConnections: [],
  kubernetesConnections: [],
  vmConnections: [],
  status: 'configured',
  containerProviderConnectionCreation: false,
  containerProviderConnectionInitialization: false,
  kubernetesProviderConnectionCreation: false,
  kubernetesProviderConnectionInitialization: false,
  vmProviderConnectionCreation: false,
  vmProviderConnectionInitialization: false,
  links: [],
  detectionChecks: [],
  warnings: [],
  images: {},
  installationSupport: false,
  cleanupSupport: false,
  canStart: false,
  canStop: false,
};

const containerConnection: ProviderContainerConnectionInfo = {
  connectionType: 'container',
  name: 'podman-machine',
  displayName: 'Podman Machine',
  status: 'started',
  endpoint: { socketPath: '/run/podman/podman.sock' },
  type: 'podman',
  canStart: false,
  canStop: false,
  canEdit: false,
  canDelete: false,
};

const kubernetesConnection: ProviderKubernetesConnectionInfo = {
  connectionType: 'kubernetes',
  name: 'minikube',
  status: 'started',
  endpoint: { apiURL: 'https://127.0.0.1:8443' },
  canStart: false,
  canStop: false,
  canEdit: false,
  canDelete: false,
};

beforeEach(() => {
  vi.resetAllMocks();
  providerInfos.set([]);
});

test('should render Resource Overview and Connections headings', async () => {
  render(SystemOverviewContent);
  await vi.waitFor(() => expect(screen.getByText('Resource Overview')).toBeInTheDocument());
  expect(screen.getByText('Connections')).toBeInTheDocument();
});

describe('resource overview navigation', () => {
  test('should navigate to Containers when Containers tile is clicked', async () => {
    render(SystemOverviewContent);
    await fireEvent.click(screen.getByRole('button', { name: /View Containers/i }));
    expect(router.goto).toHaveBeenCalledWith('/containers');
  });

  test('should navigate to Pods when Pods tile is clicked', async () => {
    render(SystemOverviewContent);
    await fireEvent.click(screen.getByRole('button', { name: /View Pods:/i }));
    expect(router.goto).toHaveBeenCalledWith('/pods');
  });

  test('should navigate to Images when Images tile is clicked', async () => {
    render(SystemOverviewContent);
    await fireEvent.click(screen.getByRole('button', { name: /View Images/i }));
    expect(router.goto).toHaveBeenCalledWith('/images');
  });

  test('should navigate to Kubernetes Pods when Kubernetes Pods tile is clicked', async () => {
    render(SystemOverviewContent);
    await fireEvent.click(screen.getByRole('button', { name: /View Kubernetes Pods/i }));
    expect(router.goto).toHaveBeenCalledWith('/kubernetes/pods');
  });
});

describe('provider rendering', () => {
  test('should not render Other Connections heading for not-installed provider needing setup', async () => {
    const provider: ProviderInfo = {
      ...baseProvider,
      status: 'not-installed',
      containerProviderConnectionCreation: true,
    };
    providerInfos.set([provider]);
    render(SystemOverviewContent);

    await vi.waitFor(() => expect(screen.getByText('Connections')).toBeInTheDocument());
    expect(screen.queryByText('Other Connections')).not.toBeInTheDocument();
  });

  test('should not render Other Connections heading for provider with only container connections', async () => {
    const provider: ProviderInfo = {
      ...baseProvider,
      containerConnections: [containerConnection],
    };
    providerInfos.set([provider]);
    render(SystemOverviewContent);

    await vi.waitFor(() => expect(screen.getByText('Connections')).toBeInTheDocument());
    expect(screen.queryByText('Other Connections')).not.toBeInTheDocument();
  });
});

describe('standalone connections section', () => {
  test('should render Other Connections heading when standalone connections exist', async () => {
    const provider: ProviderInfo = {
      ...baseProvider,
      kubernetesConnections: [kubernetesConnection],
    };
    providerInfos.set([provider]);
    render(SystemOverviewContent);

    await vi.waitFor(() => expect(screen.getByText('Other Connections')).toBeInTheDocument());
  });

  test('should nest kubernetes under the sole container connection before containers load', async () => {
    const provider: ProviderInfo = {
      ...baseProvider,
      containerConnections: [containerConnection],
      kubernetesConnections: [kubernetesConnection],
    };
    providerInfos.set([provider]);
    render(SystemOverviewContent);

    await vi.waitFor(() => expect(screen.getByText('Connections')).toBeInTheDocument());
    expect(screen.queryByText('Other Connections')).not.toBeInTheDocument();
  });

  test('should not render Other Connections heading when no non-container connections exist', async () => {
    providerInfos.set([baseProvider]);
    render(SystemOverviewContent);

    await vi.waitFor(() => expect(screen.getByText('Connections')).toBeInTheDocument());
    expect(screen.queryByText('Other Connections')).not.toBeInTheDocument();
  });
});

describe('telemetry', () => {
  test('should track dashboard.healthCard.viewed on mount with no connections', async () => {
    providerInfos.set([baseProvider]);
    render(SystemOverviewContent);

    await vi.waitFor(() =>
      expect(window.telemetryTrack).toHaveBeenCalledWith('dashboard.healthCard.viewed', {
        itemCount: 0,
        healthyCount: 0,
        issueCount: 0,
      }),
    );
  });

  test('should track dashboard.healthCard.viewed with correct counts for mixed connections', async () => {
    const errorConnection: ProviderContainerConnectionInfo = {
      ...containerConnection,
      name: 'error-machine',
      displayName: 'Error Machine',
      status: 'stopped',
      error: 'Connection refused',
    };

    const provider: ProviderInfo = {
      ...baseProvider,
      containerConnections: [containerConnection, errorConnection],
      kubernetesConnections: [kubernetesConnection],
    };
    providerInfos.set([provider]);
    render(SystemOverviewContent);

    await vi.waitFor(() =>
      expect(window.telemetryTrack).toHaveBeenCalledWith('dashboard.healthCard.viewed', {
        itemCount: 3,
        healthyCount: 2,
        issueCount: 1,
      }),
    );
  });
});

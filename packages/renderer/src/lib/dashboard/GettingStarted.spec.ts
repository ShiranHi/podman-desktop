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

import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { onDidChangeConfiguration } from '/@/stores/configurationProperties';
import { containersInfos } from '/@/stores/containers';
import { clearDashboardRestoreHint, dashboardDismissHint } from '/@/stores/dashboard/dashboard-dismiss-hint.svelte';
import { imagesInfos } from '/@/stores/images';
import { providerInfos } from '/@/stores/providers';

import { GETTING_STARTED_DISMISSED_KEY } from './getting-started-utils';
import GettingStarted from './GettingStarted.svelte';

vi.mock(import('svelte/transition'), () => ({
  slide: (): { delay: number; duration: number } => ({
    delay: 0,
    duration: 0,
  }),
  fade: (): { delay: number; duration: number } => ({
    delay: 0,
    duration: 0,
  }),
}));

beforeEach(() => {
  clearDashboardRestoreHint();
  vi.mocked(window.showMessageBox).mockResolvedValue({ response: 0 });

  vi.mocked(window.getConfigurationValue).mockImplementation(async (key: string) => {
    if (key === GETTING_STARTED_DISMISSED_KEY) {
      return false;
    }
    if (key === 'dashboard.gettingStarted.expanded') {
      return true;
    }
    if (key === 'dashboard.gettingStarted.viewedExtensionCatalog') {
      return false;
    }
    return undefined;
  });

  providerInfos.set([
    {
      id: 'podman',
      name: 'podman',
      extensionId: 'podman',
      status: 'installed',
      containerConnections: [{ name: 'podman', status: 'started' }],
      kubernetesConnections: [],
      vmConnections: [],
    } as never,
  ]);
  imagesInfos.set([{ Id: 'image-1' } as never]);
  containersInfos.set([]);
});

afterEach(() => {
  providerInfos.set([]);
  imagesInfos.set([]);
  containersInfos.set([]);
  clearDashboardRestoreHint();
  vi.resetAllMocks();
});

test('renders Getting Started wizard with progress and checklist', async () => {
  render(GettingStarted);

  await waitFor(() => {
    expect(screen.getByText('Getting Started 2/5')).toBeInTheDocument();
  });

  expect(screen.getByText('Create a Podman machine')).toBeInTheDocument();
  expect(screen.getByText('Pull your first image')).toBeInTheDocument();
  expect(screen.getByText('Run your first container')).toBeInTheDocument();
});

test('dismisses Getting Started wizard', async () => {
  render(GettingStarted);

  await waitFor(() => {
    expect(screen.getByText('Getting Started 2/5')).toBeInTheDocument();
  });

  await fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  expect(window.updateConfigurationValue).toHaveBeenCalledWith(GETTING_STARTED_DISMISSED_KEY, true);
  expect(dashboardDismissHint.showConfigureSectionsTooltip).toBe(true);
  expect(dashboardDismissHint.sectionName).toBe('Getting Started');
  await waitFor(() => {
    expect(screen.queryByText('Getting Started 2/5')).not.toBeInTheDocument();
  });
});

test('shows Getting Started again when dismissed config is cleared', async () => {
  render(GettingStarted);

  await waitFor(() => {
    expect(screen.getByText('Getting Started 2/5')).toBeInTheDocument();
  });

  await fireEvent.click(screen.getByRole('button', { name: 'Close' }));

  await waitFor(() => {
    expect(screen.queryByText('Getting Started 2/5')).not.toBeInTheDocument();
  });

  onDidChangeConfiguration.dispatchEvent(
    new CustomEvent(GETTING_STARTED_DISMISSED_KEY, {
      detail: { key: GETTING_STARTED_DISMISSED_KEY, value: false },
    }),
  );

  await waitFor(() => {
    expect(screen.getByText('Getting Started 2/5')).toBeInTheDocument();
  });
});

test('navigates when an incomplete step is clicked', async () => {
  render(GettingStarted);

  await waitFor(() => {
    expect(screen.getByText('Run your first container')).toBeInTheDocument();
  });

  await fireEvent.click(screen.getByRole('button', { name: 'Run your first container' }));

  expect(window.telemetryTrack).toHaveBeenCalledWith('dashboard.gettingStartedStepClicked', {
    stepId: 'run-container',
  });
});

test('does not render when previously dismissed', async () => {
  vi.mocked(window.getConfigurationValue).mockImplementation(async (key: string) => {
    if (key === GETTING_STARTED_DISMISSED_KEY) {
      return true;
    }
    return undefined;
  });

  render(GettingStarted);

  await waitFor(() => expect(window.getConfigurationValue).toHaveBeenCalled());
  expect(screen.queryByText(/Getting Started/)).not.toBeInTheDocument();
  expect(get(providerInfos).length).toBeGreaterThan(0);
});

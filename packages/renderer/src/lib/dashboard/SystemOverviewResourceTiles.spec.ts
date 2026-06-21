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

import type { ContainerInfo, ImageInfo } from '@podman-desktop/core-api';
import { NavigationPage } from '@podman-desktop/core-api';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { handleNavigation } from '/@/navigation';
import { containersInfos } from '/@/stores/containers';
import { imagesInfos } from '/@/stores/images';
import { podsInfos } from '/@/stores/pods';
import { providerInfos } from '/@/stores/providers';

import SystemOverviewResourceTiles from './SystemOverviewResourceTiles.svelte';

vi.mock(import('/@/navigation'), () => ({
  handleNavigation: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  containersInfos.set([]);
  podsInfos.set([]);
  imagesInfos.set([]);
  providerInfos.set([]);
});

describe('SystemOverviewResourceTiles', () => {
  test('renders resource cards with totals and status footer', async () => {
    containersInfos.set([
      { State: 'running' } as ContainerInfo,
      { State: 'running' } as ContainerInfo,
      { State: 'exited' } as ContainerInfo,
    ]);
    podsInfos.set([{ Status: 'Running' } as never]);
    imagesInfos.set([{ Size: 12_000_000_000 } as ImageInfo, { Size: 11_400_000_000 } as ImageInfo]);

    render(SystemOverviewResourceTiles);

    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage Resources' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Containers' })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: 'View Containers' })).toHaveTextContent('2 running');
    expect(screen.getByRole('button', { name: 'View Containers' })).toHaveTextContent('1 stopped');
    expect(screen.getByRole('button', { name: 'View Images' })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'View Images' })).toHaveTextContent('GB');
  });

  test('navigates to resources page from Manage Resources', async () => {
    render(SystemOverviewResourceTiles);

    await fireEvent.click(screen.getByRole('button', { name: 'Manage Resources' }));

    expect(handleNavigation).toHaveBeenCalledWith({ page: NavigationPage.RESOURCES });
  });
});

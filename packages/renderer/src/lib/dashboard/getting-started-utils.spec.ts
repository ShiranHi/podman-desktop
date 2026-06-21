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

import type { ProviderInfo } from '@podman-desktop/core-api';
import { describe, expect, test } from 'vitest';

import {
  evaluateGettingStartedCompletion,
  getGettingStartedProgress,
  isKubernetesConfigured,
  isPodmanMachineRunning,
} from './getting-started-utils';

const baseProvider: ProviderInfo = {
  id: 'podman',
  name: 'podman',
  extensionId: 'podman',
  status: 'installed',
  containerConnections: [],
  kubernetesConnections: [],
  vmConnections: [],
} as unknown as ProviderInfo;

describe('getting-started-utils', () => {
  test('detects running podman machine', () => {
    expect(
      isPodmanMachineRunning([
        {
          ...baseProvider,
          containerConnections: [{ name: 'podman', status: 'started' }],
        } as unknown as ProviderInfo,
      ]),
    ).toBe(true);
  });

  test('tracks progress across checklist steps', () => {
    const progress = getGettingStartedProgress({
      providers: [
        {
          ...baseProvider,
          containerConnections: [{ name: 'podman', status: 'started' }],
          kubernetesConnections: [{ name: 'kind', status: 'started' }],
        } as unknown as ProviderInfo,
      ],
      imageCount: 2,
      containerCount: 1,
      viewedExtensionCatalog: false,
    });

    expect(progress.completedCount).toBe(4);
    expect(progress.completedStepIds.has('create-machine')).toBe(true);
    expect(progress.completedStepIds.has('pull-image')).toBe(true);
    expect(progress.completedStepIds.has('run-container')).toBe(true);
    expect(progress.completedStepIds.has('setup-kubernetes')).toBe(true);
    expect(progress.completedStepIds.has('view-extensions')).toBe(false);
  });

  test('marks extension catalog complete after it has been viewed', () => {
    expect(
      evaluateGettingStartedCompletion('view-extensions', {
        providers: [],
        imageCount: 0,
        containerCount: 0,
        viewedExtensionCatalog: true,
      }),
    ).toBe(true);
  });

  test('detects configured kubernetes connection', () => {
    expect(
      isKubernetesConfigured([
        {
          ...baseProvider,
          kubernetesConnections: [{ name: 'kind', status: 'started' }],
        } as unknown as ProviderInfo,
      ]),
    ).toBe(true);
  });
});

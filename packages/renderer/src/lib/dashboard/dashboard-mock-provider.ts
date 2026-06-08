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

import { getRuntimeProviderState } from '/@/mock-provider-lifecycle';

const MOCK_PROVIDER_BASE = {
  id: 'podman',
  internalId: 'podman.podman',
  extensionId: 'podman.podman',
  name: 'Podman',
  canStop: true,
  vmConnections: [] as never[],
  lifecycleMethods: [],
  detectionChecks: [],
  images: { icon: '/podman-icon.png' },
  version: '5.4.0',
  links: [],
  installationSupport: false,
  containerProviderConnectionCreation: true,
  containerProviderConnectionInitialization: true,
  kubernetesProviderConnectionCreation: false,
  kubernetesProviderConnectionInitialization: false,
  vmProviderConnectionCreation: false,
  vmProviderConnectionInitialization: false,
  cleanupSupport: false,
  emptyConnectionMarkdownDescription: '',
};

export function buildMockProviderInfo(): ProviderInfo {
  const provider = getRuntimeProviderState();
  return {
    ...MOCK_PROVIDER_BASE,
    status: provider.status,
    canStart: provider.canStart,
    containerConnections: provider.containerConnections as ProviderInfo['containerConnections'],
    kubernetesConnections: provider.kubernetesConnections as ProviderInfo['kubernetesConnections'],
    warnings: provider.warnings,
  };
}

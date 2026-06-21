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
import { NavigationPage } from '@podman-desktop/core-api';

export const GETTING_STARTED_DISMISSED_KEY = 'dashboard.gettingStarted.dismissed';
export const GETTING_STARTED_EXPANDED_KEY = 'dashboard.gettingStarted.expanded';
export const GETTING_STARTED_CATALOG_VIEWED_KEY = 'dashboard.gettingStarted.viewedExtensionCatalog';
export const GETTING_STARTED_SECTION_NAME = 'Getting Started';
export const GETTING_STARTED_SECTION_ID = GETTING_STARTED_SECTION_NAME;

export interface GettingStartedStep {
  id: string;
  title: string;
  page: NavigationPage;
}

export const GETTING_STARTED_STEPS: GettingStartedStep[] = [
  {
    id: 'create-machine',
    title: 'Create a Podman machine',
    page: NavigationPage.RESOURCES,
  },
  {
    id: 'pull-image',
    title: 'Pull your first image',
    page: NavigationPage.IMAGES,
  },
  {
    id: 'run-container',
    title: 'Run your first container',
    page: NavigationPage.CONTAINERS,
  },
  {
    id: 'setup-kubernetes',
    title: 'Set up Kubernetes',
    page: NavigationPage.RESOURCES,
  },
  {
    id: 'view-extensions',
    title: 'View the extension catalog',
    page: NavigationPage.EXTENSIONS_CATALOG,
  },
];

export interface GettingStartedProgressInput {
  providers: ProviderInfo[];
  imageCount: number;
  containerCount: number;
  viewedExtensionCatalog: boolean;
}

export function isPodmanMachineRunning(providers: ProviderInfo[]): boolean {
  return providers.some(provider =>
    provider.containerConnections.some(connection => connection.status === 'started' && !connection.error),
  );
}

export function isKubernetesConfigured(providers: ProviderInfo[]): boolean {
  return providers.some(provider =>
    provider.kubernetesConnections.some(connection => connection.status === 'started' && !connection.error),
  );
}

export function evaluateGettingStartedCompletion(stepId: string, input: GettingStartedProgressInput): boolean {
  switch (stepId) {
    case 'create-machine':
      return isPodmanMachineRunning(input.providers);
    case 'pull-image':
      return input.imageCount > 0;
    case 'run-container':
      return input.containerCount > 0;
    case 'setup-kubernetes':
      return isKubernetesConfigured(input.providers);
    case 'view-extensions':
      return input.viewedExtensionCatalog;
    default:
      return false;
  }
}

export function getGettingStartedProgress(input: GettingStartedProgressInput): {
  completedCount: number;
  totalCount: number;
  completedStepIds: Set<string>;
} {
  const completedStepIds = new Set(
    GETTING_STARTED_STEPS.filter(step => evaluateGettingStartedCompletion(step.id, input)).map(step => step.id),
  );

  return {
    completedCount: completedStepIds.size,
    totalCount: GETTING_STARTED_STEPS.length,
    completedStepIds,
  };
}

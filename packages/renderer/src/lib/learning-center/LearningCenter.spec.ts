/**********************************************************************
 * Copyright (C) 2024-2026 Red Hat, Inc.
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

import type { ExploreFeature } from '@podman-desktop/core-api';
import type { Guide } from '@podman-desktop/core-api/learning-center';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

import { ContextUI } from '/@/lib/context/context';
import { context } from '/@/stores/context';
import { enhancedDashboardEnabled } from '/@/stores/dashboard/dashboard-page-registry.svelte';
import { SYSTEM_OVERVIEW_STATUS, systemOverviewInfos } from '/@/stores/dashboard/system-overview.svelte';
import { exploreFeaturesInfo } from '/@/stores/explore-features';

import LearningCenter from './LearningCenter.svelte';

const guides: Guide[] = [
  {
    id: 'podman-desktop-learning-center-example',
    url: 'https://podman-desktop.io/learning-center/example',
    title: 'My Title',
    description: 'fake description',
    categories: ['Kubernetes'],
    icon: '',
  },
];

const exploreFeatures: ExploreFeature[] = [
  {
    id: 'feature1',
    title: 'Feature 1',
    description: 'Feature 1 description',
    buttonIcon: 'icon1',
    buttonTitle: 'button 1',
    buttonLink: '',
  },
];

class ResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

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

beforeAll(() => {
  global.ResizeObserver = ResizeObserver;
});

beforeEach(() => {
  enhancedDashboardEnabled.enabled = true;
  exploreFeaturesInfo.set([]);
  systemOverviewInfos.set({
    status: SYSTEM_OVERVIEW_STATUS.progressing,
    text: 'Initializing...',
  });
  const testContext = new ContextUI();
  testContext.setValue('runningContainerConnections', 1);
  context.set(testContext);
  vi.mocked(window.listGuides).mockResolvedValue(guides);
  vi.mocked(window.getPodmanDesktopVersion).mockResolvedValue('1.0.0');
  vi.mocked(window.podmanDesktopGetReleaseNotes).mockResolvedValue({
    notes: undefined,
    notesURL: undefined,
  });
  vi.mocked(window.getConfigurationValue).mockImplementation(async (key: string) => {
    if (key === 'learningCenter.viewedGuideIds') {
      return [];
    }
    if (key === 'releaseNotesBanner.show') {
      return '1.0.0';
    }
    if (key === 'learningCenter.expanded') {
      return undefined;
    }
    return undefined;
  });
});

afterEach(() => {
  enhancedDashboardEnabled.enabled = false;
  exploreFeaturesInfo.set([]);
  vi.resetAllMocks();
});

test('LearningCenter component shows Learning Center title in production mode', async () => {
  enhancedDashboardEnabled.enabled = false;
  render(LearningCenter);

  await vi.waitFor(() => {
    expect(screen.getByRole('button', { name: /Learning Center/ })).toBeInTheDocument();
  });
});

test('LearningCenter component shows carousel with guides', async () => {
  render(LearningCenter);

  await vi.waitFor(() => {
    const firstCard = screen.getByText(guides[0].title);
    expect(firstCard).toBeVisible();
  });
});

test('LearningCenter component shows tabbed Learning Hub in enhanced mode', async () => {
  render(LearningCenter);

  await vi.waitFor(() => {
    expect(screen.getByRole('tab', { name: /Learn/i })).toBeInTheDocument();
  });
  expect(screen.getByRole('tab', { name: /Community/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /What's New/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /View all learning resources/i })).toBeInTheDocument();
});

test('LearningCenter component shows Explore Features tab in Learning Hub when engine is healthy', async () => {
  systemOverviewInfos.set({
    status: SYSTEM_OVERVIEW_STATUS.healthy,
    text: 'Healthy',
  });
  exploreFeaturesInfo.set(exploreFeatures);

  render(LearningCenter);

  await vi.waitFor(() => {
    expect(screen.getByRole('tab', { name: /Explore Features/i })).toBeInTheDocument();
  });
  expect(screen.getByText(exploreFeatures[0].title)).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Explore Features/i })).toHaveAttribute('aria-selected', 'true');
});

test('LearningCenter component shows whats new example in enhanced mode', async () => {
  render(LearningCenter);

  await vi.waitFor(() => {
    expect(screen.getByRole('tab', { name: /What's New/i })).toBeInTheDocument();
  });

  await fireEvent.click(screen.getByRole('tab', { name: /What's New/i }));

  await vi.waitFor(() => {
    expect(screen.getByText('Podman Desktop 1.28.0')).toBeInTheDocument();
  });
  expect(screen.getByRole('tab', { name: /What's New/i })).toHaveAttribute('aria-selected', 'true');
});

test('LearningCenter component switches Learning Hub tabs', async () => {
  render(LearningCenter);

  await vi.waitFor(() => {
    expect(screen.getByText(guides[0].title)).toBeInTheDocument();
  });

  await fireEvent.click(screen.getByRole('tab', { name: /Community/i }));
  expect(screen.getByText('Join the Community Discussion')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Community/i })).toHaveAttribute('aria-selected', 'true');
});

test('LearningCenter component shows unread dot on unviewed guides', async () => {
  render(LearningCenter);

  await vi.waitFor(() => {
    expect(screen.getByLabelText('New guide')).toBeInTheDocument();
  });
});

test('Clicking on LearningCenter title hides carousel with guides', async () => {
  render(LearningCenter);
  await vi.waitFor(() => {
    const firstCard = screen.getByText(guides[0].title);
    expect(firstCard).toBeVisible();
  });

  const button = screen.getByRole('button', { name: /Learning Hub/ });
  expect(button).toBeInTheDocument();
  expect(screen.queryByText(guides[0].title)).toBeInTheDocument();
  await fireEvent.click(button);
  await vi.waitFor(async () => {
    expect(screen.queryByText(guides[0].title)).not.toBeInTheDocument();
  });
});

test('Toggling expansion sets configuration', async () => {
  render(LearningCenter);

  expect(window.updateConfigurationValue).not.toHaveBeenCalled();

  const button = screen.getByRole('button', { name: /Learning Hub/ });
  expect(button).toBeInTheDocument();
  await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));

  await fireEvent.click(button);
  expect(window.updateConfigurationValue).toHaveBeenCalledWith('learningCenter.expanded', false);
  await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'false'));

  await fireEvent.click(button);
  expect(window.updateConfigurationValue).toHaveBeenCalledWith('learningCenter.expanded', true);
  expect(button).toHaveAttribute('aria-expanded', 'true');

  await fireEvent.click(button);
  expect(window.updateConfigurationValue).toHaveBeenCalledWith('learningCenter.expanded', false);
  expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('Expanded when the config value not set', async () => {
  render(LearningCenter);

  const button = screen.getByRole('button', { name: /Learning Hub/ });
  expect(button).toHaveAttribute('aria-expanded', 'true');
});

test('Collapsed when the config value is set to not expanded', async () => {
  vi.mocked(window.getConfigurationValue).mockImplementation(async (key: string) => {
    if (key === 'learningCenter.expanded') {
      return false;
    }
    if (key === 'learningCenter.viewedGuideIds') {
      return [];
    }
    if (key === 'releaseNotesBanner.show') {
      return '1.0.0';
    }
    return undefined;
  });
  render(LearningCenter);

  await waitFor(() => expect(window.getConfigurationValue).toBeCalled());

  const button = screen.getByRole('button', { name: /Learning Hub/ });
  expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('Expanded when the config value is set to expanded', async () => {
  vi.mocked(window.getConfigurationValue).mockImplementation(async (key: string) => {
    if (key === 'learningCenter.expanded') {
      return true;
    }
    if (key === 'learningCenter.viewedGuideIds') {
      return [];
    }
    if (key === 'releaseNotesBanner.show') {
      return '1.0.0';
    }
    return undefined;
  });
  render(LearningCenter);

  await waitFor(() => expect(window.getConfigurationValue).toBeCalled());

  const button = screen.getByRole('button', { name: /Learning Hub/ });
  expect(button).toHaveAttribute('aria-expanded', 'true');
});

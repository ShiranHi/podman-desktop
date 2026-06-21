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

import type { Guide } from '@podman-desktop/core-api/learning-center';

export type LearningHubTab = 'explore-features' | 'learn' | 'community' | 'whats-new';

export type LearningHubItemKind = 'video' | 'article' | 'release' | 'community';

export interface LearningHubItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  kind: LearningHubItemKind;
  isNew?: boolean;
}

export const LEARNING_HUB_ALL_URL = 'https://podman-desktop.io/docs';

export const COMMUNITY_HUB_ITEMS: LearningHubItem[] = [
  {
    id: 'community-blog',
    title: 'Podman Desktop Blog',
    subtitle: 'Article · Product updates',
    url: 'https://podman-desktop.io/blog',
    kind: 'community',
  },
  {
    id: 'community-forum',
    title: 'Join the Community Discussion',
    subtitle: 'Forum · Ask questions and share tips',
    url: 'https://github.com/podman-desktop/podman-desktop/discussions',
    kind: 'community',
  },
  {
    id: 'community-youtube',
    title: 'Podman Desktop on YouTube',
    subtitle: 'Video · Tutorials and demos',
    url: 'https://www.youtube.com/@podmanDesktop',
    kind: 'video',
  },
];

function isVideoGuide(guide: Guide): boolean {
  return (
    /youtube|video|watch/i.test(guide.url) ||
    guide.categories.some(category => category.toLowerCase().includes('video'))
  );
}

export function guideToLearningHubItem(guide: Guide, isNew: boolean): LearningHubItem {
  const isVideo = isVideoGuide(guide);
  return {
    id: guide.id,
    title: guide.title,
    subtitle: isVideo ? 'Video · Guide' : 'Article · Guide',
    url: guide.url,
    kind: isVideo ? 'video' : 'article',
    isNew,
  };
}

export const WHATS_NEW_PROTOTYPE_ITEMS: LearningHubItem[] = [
  {
    id: 'whats-new-dashboard-v2',
    title: 'Podman Desktop 1.28.0',
    subtitle: 'Release notes · Dashboard redesign',
    url: 'https://podman-desktop.io/blog',
    kind: 'release',
    isNew: true,
  },
];

export function buildWhatsNewItems(
  releaseTitle: string | undefined,
  releaseUrl: string | undefined,
  isNewRelease: boolean,
  usePrototypeFallback = false,
): LearningHubItem[] {
  const items: LearningHubItem[] = [];

  if (releaseTitle && releaseUrl) {
    items.push({
      id: 'release-notes-current',
      title: releaseTitle,
      subtitle: 'Release notes',
      url: releaseUrl,
      kind: 'release',
      isNew: isNewRelease,
    });
  }

  if (items.length === 0 && usePrototypeFallback) {
    return WHATS_NEW_PROTOTYPE_ITEMS;
  }

  return items;
}

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
import { describe, expect, test } from 'vitest';

import { buildWhatsNewItems, guideToLearningHubItem, WHATS_NEW_PROTOTYPE_ITEMS } from './learning-hub-utils';

describe('learning-hub-utils', () => {
  test('maps guides to learning hub list items', () => {
    const guide: Guide = {
      id: 'guide-1',
      url: 'https://podman-desktop.io/docs',
      title: 'Getting Started with Podman Desktop',
      description: 'Intro guide',
      categories: ['Getting Started'],
      icon: '',
    };

    expect(guideToLearningHubItem(guide, true)).toEqual({
      id: 'guide-1',
      title: 'Getting Started with Podman Desktop',
      subtitle: 'Article · Guide',
      url: 'https://podman-desktop.io/docs',
      kind: 'article',
      isNew: true,
    });
  });

  test('builds whats new items from release notes metadata', () => {
    expect(buildWhatsNewItems('Podman Desktop 1.28.0', 'https://podman-desktop.io/blog', true)).toEqual([
      {
        id: 'release-notes-current',
        title: 'Podman Desktop 1.28.0',
        subtitle: 'Release notes',
        url: 'https://podman-desktop.io/blog',
        kind: 'release',
        isNew: true,
      },
    ]);
  });

  test('uses prototype whats new example when release notes are unavailable', () => {
    expect(buildWhatsNewItems(undefined, undefined, false, true)).toEqual(WHATS_NEW_PROTOTYPE_ITEMS);
  });
});

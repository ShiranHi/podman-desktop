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

import { describe, expect, test } from 'vitest';

import { groupSectionsIntoTabs } from './general-settings-tabs';

describe('groupSectionsIntoTabs', () => {
  test('groups the known sections into their tabs', () => {
    const tabs = groupSectionsIntoTabs(['Appearance', 'Terminal', 'Kubernetes']);

    expect(tabs.map(tab => tab.label)).toEqual(['Application', 'Editor & Terminal', 'Network', 'Advanced']);
    expect(tabs[0]?.sections).toEqual(['Appearance']);
    expect(tabs[1]?.sections).toEqual(['Terminal']);
    expect(tabs[3]?.sections).toEqual(['Kubernetes']);
  });

  test('always provides the tab with its own content', () => {
    const tabs = groupSectionsIntoTabs(['Appearance']);

    expect(tabs.map(tab => tab.label)).toEqual(['Application', 'Network']);
    expect(tabs[1]?.content).toEqual('proxy');
    expect(tabs[1]?.sections).toEqual([]);
  });

  test('keeps the configured tab order whatever the section order is', () => {
    const tabs = groupSectionsIntoTabs(['Telemetry', 'Tasks', 'Editor', 'Appearance']);

    expect(tabs.map(tab => tab.label)).toEqual([
      'Application',
      'Editor & Terminal',
      'Network',
      'Extensions & Tasks',
      'Advanced',
    ]);
  });

  test('collects unknown sections in a trailing Other tab', () => {
    const tabs = groupSectionsIntoTabs(['Some future setting', 'Appearance']);

    expect(tabs.map(tab => tab.label)).toEqual(['Application', 'Network', 'Other']);
    expect(tabs[2]?.sections).toEqual(['Some future setting']);
  });

  test('drops tabs without any section', () => {
    const tabs = groupSectionsIntoTabs(['Container registries']);

    expect(tabs.map(tab => tab.label)).toEqual(['Containers', 'Network']);
  });
});

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

/**
 * The general settings page lists every global preference in a single page. To keep it
 * navigable, the sections are spread over a small set of tabs: each tab groups the sections
 * that belong to the same area of the application.
 *
 * Sections are identified by their title, which is the heading rendered above their settings.
 * A section that is not listed here is shown in a trailing `Other` tab so new settings
 * contributed by the application never disappear from the page.
 *
 * Some tabs do not show configuration sections but a dedicated form: they are marked with a
 * `content` discriminator and are always rendered, even without any matching section.
 */
import type { IConfigurationPropertyRecordedSchema } from '@desktop-framework/api/configuration';

/** A group of settings sharing the same `parentId`, rendered under a single heading. */
export interface SettingsSection {
  id: string;
  title: string;
  records: IConfigurationPropertyRecordedSchema[];
}

export interface SettingsTab {
  id: string;
  label: string;
  /** Titles of the configuration sections rendered in this tab. */
  sections: string[];
  /** Optional dedicated content, rendered instead of the configuration sections. */
  content?: 'proxy';
}

export const OTHER_SETTINGS_TAB: SettingsTab = {
  id: 'other',
  label: 'Other',
  sections: [],
};

export const PROXY_SETTINGS_TAB: SettingsTab = {
  id: 'network',
  label: 'Network',
  sections: [],
  content: 'proxy',
};

export const GENERAL_SETTINGS_TABS: SettingsTab[] = [
  {
    id: 'application',
    label: 'Application',
    sections: [
      'Appearance',
      'Window',
      'Show Tray Icon',
      'Exit On Close',
      'User Confirmation',
      'Feedback reminder',
      'Update',
    ],
  },
  {
    id: 'editor-terminal',
    label: 'Editor & Terminal',
    sections: ['Editor', 'Terminal'],
  },
  {
    id: 'containers',
    label: 'Containers',
    sections: ['Container registries', 'Docker Compatibility'],
  },
  PROXY_SETTINGS_TAB,
  {
    id: 'extensions-tasks',
    label: 'Extensions & Tasks',
    sections: ['Extensions', 'Tasks'],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    sections: [
      'Experimental (Enhanced Dashboard)',
      'Experimental (Status Bar Providers)',
      'Kubernetes',
      'Open Dev Tools',
      'Telemetry',
    ],
  },
];

/**
 * Group the given section titles into tabs. Tabs without any matching section are dropped, except
 * the ones providing their own content. Sections that match no tab are collected in the trailing
 * `Other` tab. The order of the configured tabs is preserved.
 */
export function groupSectionsIntoTabs(sectionTitles: string[]): SettingsTab[] {
  const available = new Set(sectionTitles);
  const assigned = new Set<string>();
  const tabs: SettingsTab[] = [];

  for (const tab of GENERAL_SETTINGS_TABS) {
    const sections = tab.sections.filter(section => available.has(section));
    if (sections.length === 0 && !tab.content) {
      continue;
    }
    sections.forEach(section => assigned.add(section));
    tabs.push({ ...tab, sections });
  }

  const otherSections = sectionTitles.filter(section => !assigned.has(section));
  if (otherSections.length > 0) {
    tabs.push({ ...OTHER_SETTINGS_TAB, sections: otherSections });
  }

  return tabs;
}

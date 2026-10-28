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

import { derived, type Readable } from 'svelte/store';

import { registerPrototype } from './prototype';

export type SettingsExperience = 'current' | 'proposal';

interface SettingsOverride {
  experience: SettingsExperience;
}

// Registers the "Current" / "Design proposal" switcher rendered in the title bar.
// "Current" keeps the production settings experience, "Design proposal" enables
// the global-only settings list plus the extensions settings hub.
const settingsOverride = registerPrototype<SettingsOverride>({
  name: 'Settings',
  screens: [
    { value: 'current', label: 'Current' },
    { value: 'proposal', label: 'Design proposal' },
  ],
  overrides: {
    current: { experience: 'current' },
    proposal: { experience: 'proposal' },
  },
});

export const settingsExperience: Readable<SettingsExperience> = derived(
  settingsOverride,
  $override => $override?.experience ?? 'current',
);

export const isDesignProposal: Readable<boolean> = derived(
  settingsExperience,
  $experience => $experience === 'proposal',
);

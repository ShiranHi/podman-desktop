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

import type { IConfigurationPropertyRecordedSchema } from '@desktop-framework/api/configuration';

import type { ContextUI } from '/@/lib/context/context';

import { isDefaultScope, isPropertyValidInContext } from './Util';

/**
 * Settings contributed by an extension are recorded with an `extension` entry. They are the only settings that
 * should be listed in the extension settings views, and never in the global settings navigation.
 */
export function isVisibleExtensionSetting(
  property: IConfigurationPropertyRecordedSchema,
  context?: ContextUI,
): boolean {
  if (!property.extension) {
    return false;
  }
  if (property.hidden) {
    return false;
  }
  if (!isDefaultScope(property.scope)) {
    return false;
  }
  // context dependent settings are only filtered out once the context is available
  return !context || isPropertyValidInContext(property.when, context);
}

export function filterExtensionSettings(
  properties: IConfigurationPropertyRecordedSchema[],
  extensionId: string,
  context?: ContextUI,
): IConfigurationPropertyRecordedSchema[] {
  return properties
    .filter(property => property.extension?.id === extensionId && isVisibleExtensionSetting(property, context))
    .toSorted((a, b) => a.title.localeCompare(b.title));
}

export function groupExtensionSettings(
  properties: IConfigurationPropertyRecordedSchema[],
  context?: ContextUI,
): Map<string, IConfigurationPropertyRecordedSchema[]> {
  const groups = new Map<string, IConfigurationPropertyRecordedSchema[]>();

  for (const property of properties) {
    if (!isVisibleExtensionSetting(property, context)) {
      continue;
    }
    const id = property.extension?.id;
    if (!id) {
      continue;
    }
    groups.set(id, [...(groups.get(id) ?? []), property]);
  }

  for (const [id, records] of groups) {
    groups.set(
      id,
      records.toSorted((a, b) => a.title.localeCompare(b.title)),
    );
  }

  return groups;
}

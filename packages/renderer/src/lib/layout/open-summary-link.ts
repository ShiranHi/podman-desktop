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

import type { OpenTabInput } from '/@/stores/layout/layout-store.svelte';
import { linkOpenMode } from '/@/stores/layout/tab-preferences.svelte';

import { openWorkspaceResource } from './resource-open-actions';

/** Open an internal resource link using the current summary-link preference. */
export function openSummaryLink(event: MouseEvent, destination: OpenTabInput): void {
  event.preventDefault();
  event.stopPropagation();

  const target = event.currentTarget instanceof Element ? event.currentTarget : undefined;
  const panelId = target?.closest('[data-panel-id]')?.getAttribute('data-panel-id');
  openWorkspaceResource(destination, linkOpenMode(event, true), panelId ?? undefined, {
    allowDuplicate: event.metaKey || event.ctrlKey,
  });
}

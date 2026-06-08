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
 * Renderer prototype mode cannot replace contextBridge APIs directly.
 * Instead, the renderer pushes serializable return values here and preload
 * wrappers consult them before falling back to IPC.
 */

const prototypeApiReturns = new Map<string, unknown>();

export function setPrototypeApiReturn(name: string, value: unknown | null): void {
  if (value === null) {
    prototypeApiReturns.delete(name);
    return;
  }
  prototypeApiReturns.set(name, value);
}

export function clearPrototypeApiReturns(): void {
  prototypeApiReturns.clear();
}

export function getPrototypeApiReturn<T>(name: string): T | undefined {
  if (!prototypeApiReturns.has(name)) {
    return undefined;
  }
  return prototypeApiReturns.get(name) as T;
}

export function getPrototypeExperimentalConfigurationValue(key: string): boolean | undefined {
  const overrides = prototypeApiReturns.get('isExperimentalConfigurationEnabled');
  if (!overrides || typeof overrides !== 'object') {
    return undefined;
  }
  if (!(key in overrides)) {
    return undefined;
  }
  return Boolean((overrides as Record<string, boolean>)[key]);
}

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

import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  DASHBOARD_PROTOTYPE_CURRENT,
  DASHBOARD_PROTOTYPE_ENHANCED,
  handleDashboardPrototypeScreen,
  parseHealthScenario,
} from './dashboard-health-prototype';

describe('parseHealthScenario', () => {
  test('returns undefined for dashboard mode screens', () => {
    expect(parseHealthScenario(DASHBOARD_PROTOTYPE_CURRENT)).toBeUndefined();
    expect(parseHealthScenario(DASHBOARD_PROTOTYPE_ENHANCED)).toBeUndefined();
  });

  test('returns scenario for doc-aligned preview screens', () => {
    expect(parseHealthScenario('healthy')).toBe('healthy');
    expect(parseHealthScenario('configuring')).toBe('configuring');
    expect(parseHealthScenario('stopping')).toBe('stopping');
    expect(parseHealthScenario('critical')).toBe('critical');
  });

  test('returns undefined for removed preview screens', () => {
    expect(parseHealthScenario('warning')).toBeUndefined();
    expect(parseHealthScenario('stopped-k8s')).toBeUndefined();
    expect(parseHealthScenario('legacy')).toBeUndefined();
  });
});

describe('handleDashboardPrototypeScreen', () => {
  const setPrototypeApiReturn = vi.fn();
  const clearPrototypeApiReturns = vi.fn();

  beforeEach(() => {
    vi.mocked(window.enableExperimentalConfiguration).mockResolvedValue(undefined);
    vi.mocked(window.disableExperimentalConfiguration).mockResolvedValue(undefined);
    localStorage.clear();
    setPrototypeApiReturn.mockReset();
    clearPrototypeApiReturns.mockReset();
    (window as unknown as { setPrototypeApiReturn?: typeof setPrototypeApiReturn }).setPrototypeApiReturn =
      setPrototypeApiReturn;
    (window as unknown as { clearPrototypeApiReturns?: typeof clearPrototypeApiReturns }).clearPrototypeApiReturns =
      clearPrototypeApiReturns;
  });

  test('enables enhanced dashboard for enhanced mode', async () => {
    await handleDashboardPrototypeScreen(DASHBOARD_PROTOTYPE_ENHANCED);

    expect(window.enableExperimentalConfiguration).toHaveBeenCalledWith('dashboard.enhancedDashboard');
    expect(localStorage.getItem('dashboard.prototypeScreen')).toBe(DASHBOARD_PROTOTYPE_ENHANCED);
  });

  test('disables enhanced dashboard for current production mode', async () => {
    await handleDashboardPrototypeScreen(DASHBOARD_PROTOTYPE_CURRENT);

    expect(window.disableExperimentalConfiguration).toHaveBeenCalledWith('dashboard.enhancedDashboard');
    expect(clearPrototypeApiReturns).toHaveBeenCalled();
    expect(localStorage.getItem('dashboard.prototypeScreen')).toBe(DASHBOARD_PROTOTYPE_CURRENT);
  });

  test('enables enhanced dashboard for health previews', async () => {
    await handleDashboardPrototypeScreen('starting');

    expect(window.enableExperimentalConfiguration).toHaveBeenCalledWith('dashboard.enhancedDashboard');
    expect(localStorage.getItem('dashboard.prototypeScreen')).toBe('starting');
  });
});

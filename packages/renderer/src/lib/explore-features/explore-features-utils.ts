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

import type { ExploreFeature } from '@podman-desktop/core-api';

import type { ContextUI } from '/@/lib/context/context';
import { ContextKeyExpr } from '/@/lib/context/contextKey';

const runningEngineWhen = ContextKeyExpr.deserialize('runningContainerConnections > 0');

export function filterExploreFeatures(
  features: ExploreFeature[],
  context: ContextUI,
  enhanced: boolean,
): ExploreFeature[] {
  return features.filter(feature => {
    if (enhanced && !runningEngineWhen?.evaluate(context)) {
      return false;
    }
    if (feature.when) {
      const whenDeserialized = ContextKeyExpr.deserialize(feature.when);
      return whenDeserialized?.evaluate(context) && (feature.show ?? true);
    }
    return feature.show ?? true;
  });
}

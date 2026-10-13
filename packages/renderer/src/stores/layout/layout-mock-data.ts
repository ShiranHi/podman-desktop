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

// Development-only sample dataset for reviewing tab interactions. No engine is registered.
import type { ContainerInfo, ImageInfo, PodInfo, SecretInfo } from '@desktop-framework/api';
// Keep fixtures stable across provider refreshes without timers or fake providers.
// Restore renderer adapters on hot reload; host APIs are never modified.
import type { Writable } from 'svelte/store';

import { ContainerUtils } from '/@/lib/container/container-utils';
import type { NetworkInfoUI } from '/@/lib/network/NetworkInfoUI';
import { PodUtils } from '/@/lib/pod/pod-utils';
import type { VolumeInfoUI } from '/@/lib/volume/VolumeInfoUI';
import { containersInfos } from '/@/stores/containers';
import { imagesInfos } from '/@/stores/images';
import { networksListInfo } from '/@/stores/networks';
import { podsInfos } from '/@/stores/pods';
import { secretsInfo } from '/@/stores/secrets';
import { volumeListInfos } from '/@/stores/volumes';

export const DEMO_ENGINE_ID = 'prototype.demo';
const ENGINE_NAME = 'Sample data (no connection)';
const NOW = Date.parse('2026-10-13T09:00:00Z');
const STARTED_AT = new Date(NOW - 60 * 60 * 1000).toISOString();
const CREATED = Math.floor((NOW - 60 * 60 * 1000) / 1000);

function buildMockContainers(): ContainerInfo[] {
  return [
    {
      Id: 'mock0next0app00000000000000000000000000000000000000000000000',
      Names: ['/next-app'],
      Image: 'quay.io/demo/web-frontend:v2',
      ImageID: 'sha256:mockimagewebv2000000000000000000000000000000000000000000000',
      ImageBase64RepoTag: btoa('quay.io/demo/web-frontend:v2'),
      Command: 'node server.js',
      Created: CREATED,
      Ports: [{ IP: '0.0.0.0', PrivatePort: 3000, PublicPort: 3000, Type: 'tcp' }],
      Labels: { 'com.docker.compose.project': 'demo-stack', 'com.docker.compose.service': 'web' },
      State: 'running',
      Status: 'Up 1 hour',
      StartedAt: STARTED_AT,
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      engineType: 'podman',
    },
    {
      Id: 'mock0postgres00000000000000000000000000000000000000000000000',
      Names: ['/postgres-db'],
      Image: 'docker.io/library/postgres:16',
      ImageID: 'sha256:mockpostgresimage00000000000000000000000000000000000000000',
      ImageBase64RepoTag: btoa('docker.io/library/postgres:16'),
      Command: 'postgres',
      Created: CREATED,
      Ports: [{ IP: '0.0.0.0', PrivatePort: 5432, PublicPort: 5432, Type: 'tcp' }],
      Labels: { 'com.docker.compose.project': 'demo-stack', 'com.docker.compose.service': 'database' },
      State: 'running',
      Status: 'Up 1 hour',
      StartedAt: STARTED_AT,
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      engineType: 'podman',
    },
    {
      Id: 'mock0podapi000000000000000000000000000000000000000000000000',
      Names: ['/backend-pod-api'],
      Image: 'quay.io/demo/api:latest',
      ImageID: 'sha256:mockapiimage0000000000000000000000000000000000000000000000',
      ImageBase64RepoTag: btoa('quay.io/demo/api:latest'),
      Command: 'python api.py',
      Created: CREATED,
      Ports: [{ IP: '0.0.0.0', PrivatePort: 8080, PublicPort: 8080, Type: 'tcp' }],
      Labels: {},
      State: 'running',
      Status: 'Up 1 hour',
      StartedAt: STARTED_AT,
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      engineType: 'podman',
      pod: {
        id: 'mock0backendpod00000000000000000000000000000000000000000000',
        name: 'backend-pod',
        status: 'Running',
        engineId: DEMO_ENGINE_ID,
      },
    },
    {
      Id: 'mock0podredis0000000000000000000000000000000000000000000000',
      Names: ['/backend-pod-redis'],
      Image: 'docker.io/library/redis:7',
      ImageID: 'sha256:mockredisimage00000000000000000000000000000000000000000000',
      ImageBase64RepoTag: btoa('docker.io/library/redis:7'),
      Command: 'redis-server',
      Created: CREATED,
      Ports: [{ IP: '0.0.0.0', PrivatePort: 6379, PublicPort: 6379, Type: 'tcp' }],
      Labels: {},
      State: 'running',
      Status: 'Up 1 hour',
      StartedAt: STARTED_AT,
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      engineType: 'podman',
      pod: {
        id: 'mock0backendpod00000000000000000000000000000000000000000000',
        name: 'backend-pod',
        status: 'Running',
        engineId: DEMO_ENGINE_ID,
      },
    },
  ];
}

function buildMockNetworks(): NetworkInfoUI[] {
  return [
    {
      id: 'mock0demo0frontend0000000000000000000000000000000000000000000',
      shortId: 'mock0demo0f',
      name: 'demo-frontend',
      driver: 'bridge',
      created: STARTED_AT,
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      engineType: 'podman',
      selected: false,
      status: 'USED',
      containers: [{ name: 'next-app', id: 'mock0next0app00000000000000000000000000000000000000000000000' }],
      ipv6_enabled: false,
      labels: { 'com.docker.compose.project': 'demo-stack' },
      // eslint-disable-next-line sonarjs/no-hardcoded-ip -- Static sample subnet, never contacted.
      subnets: ['10.89.1.0/24'],
    },
    {
      id: 'mock0demo0backend0000000000000000000000000000000000000000000',
      shortId: 'mock0demo0b',
      name: 'demo-backend',
      driver: 'bridge',
      created: STARTED_AT,
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      engineType: 'podman',
      selected: false,
      status: 'USED',
      containers: [{ name: 'postgres-db', id: 'mock0postgres00000000000000000000000000000000000000000000000' }],
      ipv6_enabled: false,
      labels: { 'com.docker.compose.project': 'demo-stack' },
      // eslint-disable-next-line sonarjs/no-hardcoded-ip -- Static sample subnet, never contacted.
      subnets: ['10.89.2.0/24'],
    },
  ];
}

function buildMockVolumes(): VolumeInfoUI[] {
  return [
    {
      name: 'demo-stack-postgres-data',
      shortName: 'demo-stack-postgres-data',
      mountPoint: '/var/lib/containers/storage/volumes/demo-stack-postgres-data/_data',
      scope: 'local',
      driver: 'local',
      created: STARTED_AT,
      age: '1 hour',
      size: 52_428_800,
      humanSize: '50 MB',
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      selected: false,
      status: 'USED',
      containersUsage: [{ id: 'mock0postgres00000000000000000000000000000000000000000000000', names: ['postgres-db'] }],
      labels: { 'com.docker.compose.project': 'demo-stack' },
    },
  ];
}

function buildMockSecrets(): SecretInfo[] {
  return [
    {
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      engineType: 'podman',
      Id: 'mock0apicredentials000000000000000000000000000000000000000000',
      Name: 'api-credentials',
      CreatedAt: STARTED_AT,
      UpdatedAt: STARTED_AT,
      Labels: { 'com.docker.compose.project': 'demo-stack' },
    },
  ];
}

function buildMockPods(): PodInfo[] {
  return [
    {
      Cgroup: 'user.slice',
      Containers: [
        {
          Names: 'backend-pod-api',
          Id: 'mock0podapi000000000000000000000000000000000000000000000000',
          Status: 'running',
        },
        {
          Names: 'backend-pod-redis',
          Id: 'mock0podredis0000000000000000000000000000000000000000000000',
          Status: 'running',
        },
      ],
      Created: STARTED_AT,
      Id: 'mock0backendpod00000000000000000000000000000000000000000000',
      InfraId: 'mock0backendpodinfra0000000000000000000000000000000000000000',
      Labels: {},
      Name: 'backend-pod',
      Namespace: '',
      Networks: [],
      Status: 'Running',
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      kind: 'podman',
    },
  ];
}

function buildMockImages(): ImageInfo[] {
  return [
    {
      Id: 'sha256:mockimagewebv1000000000000000000000000000000000000000000000',
      RepoTags: ['quay.io/demo/web-frontend:v1'],
      Created: CREATED - 86_400,
      Size: 182_000_000,
      VirtualSize: 182_000_000,
      SharedSize: 0,
      Containers: 0,
      Labels: {},
      Digest: 'sha256:mockdigestv1',
      ParentId: '',
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      engineType: 'podman',
    } as unknown as ImageInfo,
    {
      Id: 'sha256:mockimagewebv2000000000000000000000000000000000000000000000',
      RepoTags: ['quay.io/demo/web-frontend:v2'],
      Created: CREATED,
      Size: 191_000_000,
      VirtualSize: 191_000_000,
      SharedSize: 0,
      Containers: 1,
      Labels: {},
      Digest: 'sha256:mockdigestv2',
      ParentId: '',
      engineId: DEMO_ENGINE_ID,
      engineName: ENGINE_NAME,
      engineType: 'podman',
    } as unknown as ImageInfo,
  ];
}

function retainSamples<T>(store: Writable<T[]>, samples: T[]): () => void {
  // Adapt renderer writes, rather than feeding a subscription back into itself.
  // Engine refreshes may write often; fixtures stay stable without a notification loop.
  const originalSet = store.set;
  const setSamples = (): void => originalSet(samples);
  store.set = setSamples;
  originalSet(samples);
  return (): void => {
    if (store.set === setSamples) store.set = originalSet;
  };
}

if (import.meta.env.DEV) {
  const containers = buildMockContainers().map(container => new ContainerUtils().getContainerInfoUI(container));
  const pods = buildMockPods().map(pod => new PodUtils().getPodInfoUI(pod));
  const cleanup = [
    retainSamples(containersInfos, containers),
    retainSamples(podsInfos, pods),
    retainSamples(imagesInfos, [
      ...buildMockImages(),
      ...buildMockContainers()
        .slice(1)
        .map(container => ({
          ...buildMockImages()[0],
          Id: container.ImageID,
          RepoTags: [container.Image],
          Containers: 1,
        })),
    ]),
    retainSamples(networksListInfo, buildMockNetworks()),
    retainSamples(volumeListInfos, buildMockVolumes()),
    retainSamples(secretsInfo, buildMockSecrets()),
  ];
  import.meta.hot?.dispose(() => cleanup.forEach(dispose => dispose()));
}

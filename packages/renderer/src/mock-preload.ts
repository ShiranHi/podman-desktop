/**
 * Mock preload for static (non-Electron) builds.
 * Replaces the Electron contextBridge preload by stubbing all window.* APIs
 * with no-ops and providing fixture data for volume-related pages.
 *
 * Loaded before main.ts via index-static.html.
 */

/* eslint-disable */
// @ts-nocheck
import type { ColorInfo } from '@podman-desktop/core-api';
import type { Guide } from '@podman-desktop/core-api/learning-center';

import deployAndTestKubernetesImage from './lib/kube/DeployAndTestKubernetes.png';
import shareYourLocalPodmanImagesWithTheKubernetesImage from './lib/kube/ShareYourLocalPodmanImagesWithTheKubernetes.png';
import workingWithKubernetesImage from './lib/kube/WorkingWithKubernetes.png';
import podmanIcon from '../../../extensions/podman/packages/extension/icon.png';

import MOCK_COLORS_DARK from './mock-colors/dark.json';
import MOCK_COLORS_HC_DARK from './mock-colors/hc-dark.json';
import MOCK_COLORS_HC_LIGHT from './mock-colors/hc-light.json';
import MOCK_COLORS_LIGHT from './mock-colors/light.json';
import { buildHealthScenarioData, readHealthScenarioFromUrl, type HealthScenario } from './mock-health-scenarios';
import { buildMockProviderInfo } from './lib/dashboard/dashboard-mock-provider';
import {
  getRuntimeProviderState,
  getRuntimeStatusBarEntries,
  getRuntimeSystemOverviewStatus,
  mockStartProvider,
  mockStartProviderConnectionLifecycle,
  resetRuntimeProviderState,
} from './mock-provider-lifecycle';

// ─── EventEmitter for window.events ─────────────────────────────────────────

type Listener = (...args: unknown[]) => void;

const eventListeners = new Map<string, Set<Listener>>();

(window as any).events = {
  send(channel: string, ...args: unknown[]): void {
    const listeners = eventListeners.get(channel);
    if (listeners) {
      listeners.forEach(fn => {
        try {
          fn(...args);
        } catch (_) {
          /* noop */
        }
      });
    }
  },
  receive(channel: string, func: Listener): { dispose(): void } {
    if (!eventListeners.has(channel)) {
      eventListeners.set(channel, new Set());
    }
    eventListeners.get(channel)!.add(func);
    return {
      dispose(): void {
        eventListeners.get(channel)?.delete(func);
      },
    };
  },
};

// ─── All window method names from exposedInMainWorld.d.ts ────────────────────

const ALL_METHODS = [
  'addNotification',
  'attachContainer',
  'attachContainerSend',
  'auditConnectionParameters',
  'buildImage',
  'cancelToken',
  'checkImageCredentials',
  'checkImageUpdateStatus',
  'cleanupProviders',
  'cleanupWebviewDevTools',
  'clearNotificationsQueue',
  'clearTask',
  'clearTasks',
  'clipboardWriteText',
  'closeCustomPick',
  'closeFeatureCard',
  'containerfileGetInfo',
  'contextCollectAllValues',
  'createAndStartContainer',
  'createContainerProviderConnection',
  'createHash',
  'createImageRegistry',
  'createKubernetesPortForward',
  'createKubernetesProviderConnection',
  'createManifest',
  'createNetwork',
  'createPod',
  'createTempFile',
  'createVmProviderConnection',
  'createVolume',
  'ddExtensionDelete',
  'ddExtensionInstall',
  'deleteContainer',
  'deleteContainersByLabel',
  'deleteImage',
  'deleteKubernetesPortForward',
  'deleteProviderConnectionLifecycle',
  'disableExperimentalConfiguration',
  'editProviderConnectionLifecycle',
  'enableExperimentalConfiguration',
  'ensureExtensionIsEnabled',
  'executeCommand',
  'executeStatusBarEntryCommand',
  'executeTask',
  'exportContainer',
  'exportVolume',
  'extensionInstallFromImage',
  'extensionSystemIsExtensionsStarted',
  'extensionSystemIsReady',
  'fetchExtensionViewsContributions',
  'generateKube',
  'generatePodmanKube',
  'getAuthenticationProvidersInfo',
  'getCancellableTokenSource',
  'getCatalogExtensions',
  'getCliToolInfos',
  'getCommandPaletteCommands',
  'getCommandPaletteSearchOptions',
  'getConfigurationProperties',
  'getConfigurationValue',
  'getContainerInspect',
  'getContainerStats',
  'getContext',
  'getContributedMenus',
  'getDDPreloadPath',
  'getDashboardSystemOverviewStatus',
  'getDevtoolsConsoleLogs',
  'getDocumentationItems',
  'getExtensionBanners',
  'getFeaturedExtensions',
  'getFeedbackLinks',
  'getFeedbackMessages',
  'getFreePort',
  'getFreePortRange',
  'getGitHubFeedbackLinks',
  'getImageCheckerProviders',
  'getImageFilesProviders',
  'getImageHistory',
  'getImageInspect',
  'getImageRegistries',
  'getImageRegistryProviderNames',
  'getImageSuggestedRegistries',
  'getKubeGeneratorsInfos',
  'getKubernetesPortForwards',
  'getNetworkDrivers',
  'getOnboarding',
  'getOsArch',
  'getOsCpu',
  'getOsFreeDiskSize',
  'getOsHostname',
  'getOsMemory',
  'getOsPlatform',
  'getPodInspect',
  'getPodmanDesktopVersion',
  'getProviderDetectionChecks',
  'getProviderInfos',
  'getProxySettings',
  'getProxyState',
  'getRecommendedRegistries',
  'getRegisteredFeatures',
  'getStatusBarEntries',
  'getStatusBarPinOptions',
  'getSystemDockerSocketMappingStatus',
  'getTelemetryMessages',
  'getTitleBarText',
  'getUrlProtocol',
  'getVolumeInspect',
  'getWebviewPreloadPath',
  'getWebviewRegistryHttpPort',
  'getWelcomeMessages',
  'hasAuthconfigForImage',
  'helpMenuGetItems',
  'imageCheck',
  'imageGetFilesystemLayers',
  'importContainer',
  'initializeProvider',
  'inspectManifest',
  'inspectNetwork',
  'installCliTool',
  'importVolume',
  'installProvider',
  'isExperimentalConfigurationEnabled',
  'isFreePort',
  'kubernetesApplyResourcesFromFile',
  'kubernetesApplyResourcesFromYAML',
  'kubernetesCreateIngress',
  'kubernetesCreatePod',
  'kubernetesCreateResourcesFromFile',
  'kubernetesCreateService',
  'kubernetesDeleteConfigMap',
  'kubernetesDeleteContext',
  'kubernetesDeleteCronJob',
  'kubernetesDeleteDeployment',
  'kubernetesDeleteIngress',
  'kubernetesDeleteJob',
  'kubernetesDeletePersistentVolumeClaim',
  'kubernetesDeletePod',
  'kubernetesDeleteRoute',
  'kubernetesDeleteSecret',
  'kubernetesDeleteService',
  'kubernetesDuplicateContext',
  'kubernetesExec',
  'kubernetesExecResize',
  'kubernetesExecSend',
  'kubernetesGetActiveResourcesCount',
  'kubernetesGetClusters',
  'kubernetesGetContexts',
  'kubernetesGetContextsGeneralState',
  'kubernetesGetContextsHealths',
  'kubernetesGetContextsPermissions',
  'kubernetesGetCurrentContextGeneralState',
  'kubernetesGetCurrentContextName',
  'kubernetesGetCurrentNamespace',
  'kubernetesGetDetailedContexts',
  'kubernetesGetResources',
  'kubernetesGetResourcesCount',
  'kubernetesGetTroubleshootingInformation',
  'kubernetesGetUsers',
  'kubernetesIsAPIGroupSupported',
  'kubernetesListNamespacedPod',
  'kubernetesListNamespaces',
  'kubernetesListRoutes',
  'kubernetesReadNamespacedConfigMap',
  'kubernetesReadNamespacedCronJob',
  'kubernetesReadNamespacedDeployment',
  'kubernetesReadNamespacedIngress',
  'kubernetesReadNamespacedJob',
  'kubernetesReadNamespacedPersistentVolumeClaim',
  'kubernetesReadNamespacedPod',
  'kubernetesReadNamespacedRoute',
  'kubernetesReadNamespacedSecret',
  'kubernetesReadNamespacedService',
  'kubernetesReadNode',
  'kubernetesReadPodLog',
  'kubernetesRefreshContextState',
  'kubernetesRegisterGetCurrentContextResources',
  'kubernetesSetContext',
  'kubernetesSetCurrentNamespace',
  'kubernetesUnregisterGetCurrentContextResources',
  'kubernetesUpdateContext',
  'listColors',
  'listContainers',
  'listContainersFromEngine',
  'listContexts',
  'listContributions',
  'listExtensionDevelopmentFolders',
  'listExtensions',
  'listFeatures',
  'listGuides',
  'listIcons',
  'listImageTagsInRegistry',
  'listImages',
  'listNetworks',
  'listNotifications',
  'listOnboarding',
  'listPods',
  'listSimpleContainersByLabel',
  'listViewsContributions',
  'listVolumes',
  'listWebviews',
  'loadImages',
  'loadListConfig',
  'logsContainer',
  'makeDefaultWebviewVisible',
  'navigateToRoute',
  'onDidUpdateProviderStatus',
  'openDialog',
  'openExternal',
  'openshiftCreateRoute',
  'pathRelative',
  'pinStatusBar',
  'pingContainerEngine',
  'playKube',
  'podmanDesktopGetReleaseNotes',
  'podmanDesktopUpdateAvailable',
  'previewOnGitHub',
  'pruneContainers',
  'pruneImages',
  'prunePods',
  'pruneVolumes',
  'pullImage',
  'pushImage',
  'pushManifest',
  'reconnectContainerProviders',
  'refreshCatalogExtensions',
  'refreshDocumentationItems',
  'registerWebviewDevTools',
  'removeExtension',
  'removeManifest',
  'removeNetwork',
  'removeNotification',
  'removePod',
  'removeTempFile',
  'removeVolume',
  'replicatePodmanContainer',
  'requestAuthenticationProviderSignIn',
  'requestAuthenticationProviderSignOut',
  'resetListConfig',
  'resetOnboarding',
  'resolveShortnameImage',
  'restartContainer',
  'restartContainersByLabel',
  'restartKubernetesPod',
  'restartPod',
  'runInstallPreflightChecks',
  'runUpdatePreflightChecks',
  'saveDialog',
  'saveImages',
  'saveListConfig',
  'searchImageInRegistry',
  'selectCliToolVersionToInstall',
  'selectCliToolVersionToUpdate',
  'sendCustomPickItemsOnConfirmation',
  'sendFeedback',
  'sendNavigationItems',
  'sendShowInputBoxValidate',
  'sendShowInputBoxValue',
  'sendShowMessageBoxOnSelect',
  'sendShowQuickPickOnSelect',
  'sendShowQuickPickValues',
  'setProxyState',
  'shellInContainer',
  'shellInContainerResize',
  'shellInContainerSend',
  'shellInProviderConnection',
  'shellInProviderConnectionClose',
  'shellInProviderConnectionResize',
  'shellInProviderConnectionSend',
  'showAccountsMenu',
  'showMessageBox',
  'startContainer',
  'startContainersByLabel',
  'startExtension',
  'startPod',
  'startProvider',
  'startProviderConnectionLifecycle',
  'startProviderLifecycle',
  'startReceiveLogs',
  'stopContainer',
  'stopContainerStats',
  'stopContainersByLabel',
  'stopExtension',
  'stopPod',
  'stopProviderConnectionLifecycle',
  'stopProviderLifecycle',
  'stopReceiveLogs',
  'tagImage',
  'telemetryConfigure',
  'telemetryPage',
  'telemetryTrack',
  'trackExtensionFolder',
  'troubleshootingSaveLogs',
  'uninstallCliTool',
  'unpinStatusBar',
  'unregisterImageRegistry',
  'untrackExtensionFolder',
  'updateCliTool',
  'updateConfigurationValue',
  'updateExperimentalConfigurationValue',
  'updateExtension',
  'updateImageRegistry',
  'updateNetwork',
  'updatePodmanDesktop',
  'updateProvider',
  'updateProxySettings',
  'updateStepState',
  'windowClose',
  'windowMaximize',
  'windowMinimize',
];

// Stub all methods as async no-ops first
for (const name of ALL_METHODS) {
  if (!(name in window)) {
    Object.defineProperty(window, name, {
      value: async (..._args: unknown[]) => undefined,
      configurable: true,
      writable: true,
    });
  }
}

// ─── Mock fixture data ───────────────────────────────────────────────────────

/** Matches MOCK_PROVIDER.containerConnections[0].name — required for environment chips. */
const MOCK_ENGINE_ID = 'podman.Podman Machine';

const K8S_CONTEXT_NAME = 'minikube';

let activeHealthScenario: HealthScenario = readHealthScenarioFromUrl();
let healthScenarioData = buildHealthScenarioData(activeHealthScenario);
resetRuntimeProviderState(healthScenarioData);

function applyHealthScenario(): void {
  activeHealthScenario = readHealthScenarioFromUrl();
  healthScenarioData = buildHealthScenarioData(activeHealthScenario);
  resetRuntimeProviderState(healthScenarioData);
}

function buildMockProvider() {
  return buildMockProviderInfo();
}

function notifyMockProviderChanged(): void {
  mockProviderSnapshot = buildMockProvider();
  (window as any).events.send('provider-change');
  (window as any).events.send('provider-container-connection-update-status');
  (window as any).events.send('dashboard:system-overview-status', getRuntimeSystemOverviewStatus());
  (window as any).events.send('status-bar-updated');
  (window as any).events.send('kubernetes-resources-count');
}

let mockProviderSnapshot = buildMockProvider();

const MOCK_EXTENSION_BANNERS = [
  {
    extensionId: 'podman-desktop.compose',
    title: 'Install the Compose extension',
    description: 'Manage multi-container applications with Docker Compose files directly in Podman Desktop.',
    icon: podmanIcon,
    thumbnail: podmanIcon,
    featured: {
      id: 'podman-desktop.compose',
      displayName: 'Compose',
      description: 'Install from Extensions',
      icon: podmanIcon,
      fetchable: true,
      installed: false,
      builtin: false,
      categories: ['compose'],
    },
    background: {
      gradient: {
        start: '#ede7f6',
        end: '#e8eaf6',
      },
    },
  },
];

const MOCK_EXPLORE_FEATURES = [
  {
    id: 'dashboard-v2-prototype',
    title: 'Dashboard health monitoring',
    description: 'Review connection status, resource counts, and recommended actions from the System Overview card.',
    buttonIcon: 'fa fa-heart-pulse',
    buttonTitle: 'View System Overview',
    buttonLink: '/',
    show: true,
  },
];

const prototypeApiReturns = new Map<string, unknown>();

(window as any).setPrototypeApiReturn = (name: string, value: unknown | null): void => {
  if (value === null) {
    prototypeApiReturns.delete(name);
    return;
  }
  prototypeApiReturns.set(name, value);
};

(window as any).clearPrototypeApiReturns = (): void => {
  prototypeApiReturns.clear();
};

function getPrototypeApiReturn<T>(name: string): T | undefined {
  if (!prototypeApiReturns.has(name)) {
    return undefined;
  }
  return prototypeApiReturns.get(name) as T;
}

const MOCK_RELEASE_NOTES = {
  notes: {
    title: 'Podman Desktop 1.28.0',
    summary:
      '**Dashboard V2 prototype** — System Overview with connection health cards, Resource Overview tiles, and configurable dashboard sections for design review.',
    image: podmanIcon,
    blog: 'https://podman-desktop.io/blog',
  },
  notesURL: 'https://podman-desktop.io/blog',
};

const DASHBOARD_LAYOUT_STORAGE_KEY = 'prototype-dashboard-layout';

function getDefaultDashboardLayoutItems(availableColumns: string[]) {
  const disabledDashboardSections = new Set(['Learning Center', 'Explore Features']);
  return availableColumns.map((col: string, i: number) => ({
    id: col,
    label: col,
    enabled: !disabledDashboardSections.has(col),
    originalOrder: i,
  }));
}

function loadStoredDashboardLayout(availableColumns: string[]) {
  try {
    const stored = localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
    if (!stored) return undefined;
    const parsed = JSON.parse(stored) as Array<{
      id: string;
      label?: string;
      enabled: boolean;
      originalOrder?: number;
    }>;
    const storedById = new Map(parsed.map(item => [item.id, item]));
    return availableColumns.map((col, i) => {
      const saved = storedById.get(col);
      if (saved) {
        return {
          id: col,
          label: saved.label ?? col,
          enabled: saved.enabled,
          originalOrder: saved.originalOrder ?? i,
        };
      }
      return getDefaultDashboardLayoutItems(availableColumns)[i];
    });
  } catch {
    return undefined;
  }
}

const MOCK_GUIDES: Guide[] = [
  {
    id: 'deploy-kubernetes',
    url: 'https://developers.redhat.com/articles/2023/06/09/deploy-and-test-kubernetes-containers-using-podman-desktop',
    title: 'Deploy and Test Kubernetes',
    description: 'Deploy a local Kubernetes cluster and test workloads with Podman Desktop.',
    categories: ['Kubernetes'],
    icon: deployAndTestKubernetesImage,
  },
  {
    id: 'working-with-kubernetes',
    url: 'https://developers.redhat.com/articles/2023/11/06/working-kubernetes-podman-desktop',
    title: 'Working With Kubernetes',
    description: 'Understand how Podman Desktop helps you manage Kubernetes clusters and workloads.',
    categories: ['Kubernetes'],
    icon: workingWithKubernetesImage,
  },
  {
    id: 'share-images-kubernetes',
    url: 'https://podman-desktop.io/blog/sharing-podman-images-with-kubernetes-cluster',
    title: 'Share Local Podman Images With Kubernetes',
    description: 'Push container images from Podman to your Kubernetes cluster.',
    categories: ['Kubernetes', 'Images'],
    icon: shareYourLocalPodmanImagesWithTheKubernetesImage,
  },
];

const MOCK_VOLUMES = [
  {
    engineName: 'Podman',
    engineId: MOCK_ENGINE_ID,
    Volumes: [
      {
        Name: 'my-app-data',
        Driver: 'local',
        Mountpoint: '/var/lib/containers/storage/volumes/my-app-data/_data',
        CreatedAt: '2026-05-20T10:00:00Z',
        Labels: {},
        Scope: 'local',
        Options: {},
        engineName: 'Podman',
        engineId: MOCK_ENGINE_ID,
        UsageData: { Size: 52428800, RefCount: 0 },
        containersUsage: [],
      },
      {
        Name: 'postgres-data',
        Driver: 'local',
        Mountpoint: '/var/lib/containers/storage/volumes/postgres-data/_data',
        CreatedAt: '2026-05-18T14:30:00Z',
        Labels: { 'com.example.app': 'database' },
        Scope: 'local',
        Options: {},
        engineName: 'Podman',
        engineId: MOCK_ENGINE_ID,
        UsageData: { Size: 209715200, RefCount: 0 },
        containersUsage: [],
      },
      {
        Name: 'redis-cache',
        Driver: 'local',
        Mountpoint: '/var/lib/containers/storage/volumes/redis-cache/_data',
        CreatedAt: '2026-05-22T09:15:00Z',
        Labels: {},
        Scope: 'local',
        Options: {},
        engineName: 'Podman',
        engineId: MOCK_ENGINE_ID,
        UsageData: { Size: 10485760, RefCount: 0 },
        containersUsage: [],
      },
      {
        Name: 'nginx-config',
        Driver: 'local',
        Mountpoint: '/var/lib/containers/storage/volumes/nginx-config/_data',
        CreatedAt: '2026-05-15T08:00:00Z',
        Labels: { 'com.example.app': 'webserver' },
        Scope: 'local',
        Options: {},
        engineName: 'Podman',
        engineId: MOCK_ENGINE_ID,
        UsageData: { Size: 1048576, RefCount: 0 },
        containersUsage: [],
      },
    ],
  },
];

type ColorEntry = ColorInfo;
type AppearancePreference = 'system' | 'dark' | 'light' | 'hc-dark' | 'hc-light';

const THEME_COLORS: Record<string, ColorEntry[]> = {
  dark: MOCK_COLORS_DARK,
  light: MOCK_COLORS_LIGHT,
  'hc-dark': MOCK_COLORS_HC_DARK,
  'hc-light': MOCK_COLORS_HC_LIGHT,
};

function resolveThemeName(preference: AppearancePreference): string {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

function getColorsForTheme(themeName: string): ColorEntry[] {
  return THEME_COLORS[themeName] ?? THEME_COLORS.dark;
}

const MOCK_RESOURCE_CONFIG_VALUES: Record<string, number> = {
  'podman.machine.cpus': 4,
  'podman.machine.cpusUsage': 38,
  'podman.machine.memory': 8 * 1024 * 1024 * 1024,
  'podman.machine.memoryUsage': 52,
  'podman.machine.diskSize': 100 * 1024 * 1024 * 1024,
  'podman.machine.diskSizeUsage': 34,
};

const MOCK_CONTAINER_CONNECTION_RESOURCE_PROPERTIES = {
  'podman.machine.cpus': {
    id: 'podman.machine.cpus',
    parentId: 'preferences.podman',
    title: 'CPUs',
    description: 'CPUs',
    type: 'number',
    scope: 'ContainerConnection',
    format: 'cpu',
  },
  'podman.machine.cpusUsage': {
    id: 'podman.machine.cpusUsage',
    parentId: 'preferences.podman',
    title: 'CPU Usage',
    description: 'CPU Usage',
    type: 'number',
    scope: 'ContainerConnection',
    format: 'cpuUsage',
    hidden: true,
  },
  'podman.machine.memory': {
    id: 'podman.machine.memory',
    parentId: 'preferences.podman',
    title: 'Memory',
    description: 'Memory',
    type: 'number',
    scope: 'ContainerConnection',
    format: 'memory',
  },
  'podman.machine.memoryUsage': {
    id: 'podman.machine.memoryUsage',
    parentId: 'preferences.podman',
    title: 'Memory Usage',
    description: 'Memory Usage',
    type: 'number',
    scope: 'ContainerConnection',
    format: 'memoryUsage',
    hidden: true,
  },
  'podman.machine.diskSize': {
    id: 'podman.machine.diskSize',
    parentId: 'preferences.podman',
    title: 'Disk Size',
    description: 'Disk size',
    type: 'number',
    scope: 'ContainerConnection',
    format: 'diskSize',
  },
  'podman.machine.diskSizeUsage': {
    id: 'podman.machine.diskSizeUsage',
    parentId: 'preferences.podman',
    title: 'Disk Size Usage',
    description: 'Disk Size Usage',
    type: 'number',
    scope: 'ContainerConnection',
    format: 'diskSizeUsage',
    hidden: true,
  },
};

let appearancePreference: AppearancePreference = 'system';

function applyResolvedTheme(preference: AppearancePreference = appearancePreference): void {
  applyThemeColors(getColorsForTheme(resolveThemeName(preference)));
}

function notifyThemeChanged(key: string, value: unknown): void {
  (window as any).events.send('configuration-changed', { key, value });
  (window as any).events.send('onDidChangeConfiguration', { key, value, scope: 'DEFAULT' });
  (window as any).events.send('color-updated');
  window.dispatchEvent(new CustomEvent('appearance-changed', {}));
}

// ─── Mock Containers ─────────────────────────────────────────────────────────

const now = Date.now();
const HOUR = 3600;
const DAY = 86400;

const MOCK_CONTAINERS = [
  {
    Id: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    Names: ['/my-web-app'],
    Image: 'docker.io/library/nginx:latest',
    ImageID: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
    ImageBase64RepoTag: btoa('docker.io/library/nginx:latest'),
    Command: 'nginx -g "daemon off;"',
    Created: Math.floor(now / 1000) - 2 * DAY,
    Ports: [{ IP: '0.0.0.0', PrivatePort: 80, PublicPort: 8080, Type: 'tcp' }],
    Labels: { 'com.example.app': 'frontend', maintainer: 'team-web', 'io.kubernetes.context': K8S_CONTEXT_NAME },
    State: 'running',
    Status: 'Up 2 days',
    StartedAt: new Date(now - 2 * DAY * 1000).toISOString(),
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    engineType: 'podman' as const,
  },
  {
    Id: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    Names: ['/postgres-db'],
    Image: 'docker.io/library/postgres:16',
    ImageID: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
    ImageBase64RepoTag: btoa('docker.io/library/postgres:16'),
    Command: 'docker-entrypoint.sh postgres',
    Created: Math.floor(now / 1000) - 5 * DAY,
    Ports: [{ IP: '0.0.0.0', PrivatePort: 5432, PublicPort: 5432, Type: 'tcp' }],
    Labels: { 'com.example.app': 'database' },
    State: 'running',
    Status: 'Up 5 days',
    StartedAt: new Date(now - 5 * DAY * 1000).toISOString(),
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    engineType: 'podman' as const,
  },
  {
    Id: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    Names: ['/redis-sidecar'],
    Image: 'docker.io/library/redis:7-alpine',
    ImageID: 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
    ImageBase64RepoTag: btoa('docker.io/library/redis:7-alpine'),
    Command: 'redis-server',
    Created: Math.floor(now / 1000) - 3 * DAY,
    Ports: [{ IP: '0.0.0.0', PrivatePort: 6379, PublicPort: 6379, Type: 'tcp' }],
    Labels: {},
    State: 'running',
    Status: 'Up 3 days',
    StartedAt: new Date(now - 3 * DAY * 1000).toISOString(),
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    engineType: 'podman' as const,
  },
  {
    Id: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    Names: ['/build-runner'],
    Image: 'docker.io/library/golang:1.22',
    ImageID: 'sha256:4444444444444444444444444444444444444444444444444444444444444444',
    ImageBase64RepoTag: btoa('docker.io/library/golang:1.22'),
    Command: 'go build -o /app/main .',
    Created: Math.floor(now / 1000) - 1 * DAY,
    Ports: [],
    Labels: { 'com.example.purpose': 'ci-build' },
    State: 'exited',
    Status: 'Exited (0) 6 hours ago',
    StartedAt: new Date(now - 1 * DAY * 1000).toISOString(),
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    engineType: 'podman' as const,
  },
  {
    Id: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    Names: ['/dev-tools'],
    Image: 'docker.io/library/alpine:3.19',
    ImageID: 'sha256:5555555555555555555555555555555555555555555555555555555555555555',
    ImageBase64RepoTag: btoa('docker.io/library/alpine:3.19'),
    Command: '/bin/sh',
    Created: Math.floor(now / 1000) - 6 * HOUR,
    Ports: [],
    Labels: {},
    State: 'created',
    Status: 'Created',
    StartedAt: '',
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    engineType: 'podman' as const,
  },
];

// ─── Mock Images ─────────────────────────────────────────────────────────────

const MOCK_IMAGES = [
  {
    Id: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
    ParentId: '',
    RepoTags: ['docker.io/library/nginx:latest'],
    RepoDigests: ['docker.io/library/nginx@sha256:aaa111'],
    Created: Math.floor(now / 1000) - 7 * DAY,
    Size: 187_000_000,
    VirtualSize: 187_000_000,
    SharedSize: 0,
    Labels: { maintainer: 'NGINX Docker Maintainers' },
    Containers: 1,
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    Digest: 'sha256:aaa111',
    Arch: 'amd64',
  },
  {
    Id: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
    ParentId: '',
    RepoTags: ['docker.io/library/postgres:16'],
    RepoDigests: ['docker.io/library/postgres@sha256:bbb222'],
    Created: Math.floor(now / 1000) - 14 * DAY,
    Size: 432_000_000,
    VirtualSize: 432_000_000,
    SharedSize: 0,
    Labels: {},
    Containers: 1,
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    Digest: 'sha256:bbb222',
    Arch: 'amd64',
  },
  {
    Id: 'sha256:3333333333333333333333333333333333333333333333333333333333333333',
    ParentId: '',
    RepoTags: ['docker.io/library/redis:7-alpine'],
    RepoDigests: ['docker.io/library/redis@sha256:ccc333'],
    Created: Math.floor(now / 1000) - 10 * DAY,
    Size: 38_000_000,
    VirtualSize: 38_000_000,
    SharedSize: 0,
    Labels: {},
    Containers: 1,
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    Digest: 'sha256:ccc333',
    Arch: 'amd64',
  },
  {
    Id: 'sha256:4444444444444444444444444444444444444444444444444444444444444444',
    ParentId: '',
    RepoTags: ['docker.io/library/golang:1.22'],
    RepoDigests: ['docker.io/library/golang@sha256:ddd444'],
    Created: Math.floor(now / 1000) - 21 * DAY,
    Size: 814_000_000,
    VirtualSize: 814_000_000,
    SharedSize: 0,
    Labels: {},
    Containers: 1,
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    Digest: 'sha256:ddd444',
    Arch: 'amd64',
  },
  {
    Id: 'sha256:5555555555555555555555555555555555555555555555555555555555555555',
    ParentId: '',
    RepoTags: ['docker.io/library/alpine:3.19'],
    RepoDigests: ['docker.io/library/alpine@sha256:eee555'],
    Created: Math.floor(now / 1000) - 30 * DAY,
    Size: 7_800_000,
    VirtualSize: 7_800_000,
    SharedSize: 0,
    Labels: {},
    Containers: 1,
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    Digest: 'sha256:eee555',
    Arch: 'amd64',
  },
  {
    Id: 'sha256:6666666666666666666666666666666666666666666666666666666666666666',
    ParentId: '',
    RepoTags: ['docker.io/library/node:20-slim'],
    RepoDigests: ['docker.io/library/node@sha256:fff666'],
    Created: Math.floor(now / 1000) - 3 * DAY,
    Size: 245_000_000,
    VirtualSize: 245_000_000,
    SharedSize: 0,
    Labels: {},
    Containers: 0,
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    Digest: 'sha256:fff666',
    Arch: 'amd64',
  },
];

// ─── Mock Pods ───────────────────────────────────────────────────────────────

const MOCK_PODS = [
  {
    Cgroup: 'machine',
    Containers: [
      { Id: 'pod1-infra-000000000000', Names: 'web-stack-infra', Status: 'running' },
      { Id: MOCK_CONTAINERS[0].Id, Names: 'my-web-app', Status: 'running' },
      { Id: MOCK_CONTAINERS[2].Id, Names: 'redis-sidecar', Status: 'running' },
    ],
    Created: new Date(now - 2 * DAY * 1000).toISOString(),
    Id: 'pod1aaaaaaaabbbbbbbbccccccccdddddddd',
    InfraId: 'pod1-infra-000000000000',
    Labels: { app: 'web-stack' },
    Name: 'web-stack',
    Namespace: '',
    Networks: ['podman'],
    Status: 'Running',
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    kind: 'podman' as const,
  },
  {
    Cgroup: 'machine',
    Containers: [
      { Id: 'pod2-infra-000000000000', Names: 'monitoring-infra', Status: 'running' },
      { Id: 'pod2-grafana-0000000000', Names: 'grafana', Status: 'running' },
      { Id: 'pod2-prom-000000000000', Names: 'prometheus', Status: 'running' },
    ],
    Created: new Date(now - 4 * DAY * 1000).toISOString(),
    Id: 'pod2eeeeeeeeffffffffffgggggggghhhhhhh',
    InfraId: 'pod2-infra-000000000000',
    Labels: { app: 'monitoring', team: 'sre' },
    Name: 'monitoring',
    Namespace: '',
    Networks: ['podman'],
    Status: 'Running',
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    kind: 'podman' as const,
  },
  {
    Cgroup: 'machine',
    Containers: [
      { Id: 'pod3-infra-000000000000', Names: 'batch-jobs-infra', Status: 'running' },
      { Id: MOCK_CONTAINERS[3].Id, Names: 'build-runner', Status: 'exited' },
    ],
    Created: new Date(now - 1 * DAY * 1000).toISOString(),
    Id: 'pod3iiiiiiiijjjjjjjjkkkkkkkkllllllll',
    InfraId: 'pod3-infra-000000000000',
    Labels: { app: 'batch-jobs' },
    Name: 'batch-jobs',
    Namespace: '',
    Networks: ['podman'],
    Status: 'Degraded',
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    kind: 'podman' as const,
  },
];

// ─── Mock Networks ───────────────────────────────────────────────────────────

const MOCK_NETWORKS = [
  {
    Name: 'podman',
    Id: 'net0000000000000000000000000000000000000000000000000000000000000001',
    Created: new Date(now - 30 * DAY * 1000).toISOString(),
    Scope: 'local',
    Driver: 'bridge',
    EnableIPv6: false,
    IPAM: { Driver: 'default', Options: {}, Config: [{ Subnet: '10.88.0.0/16', Gateway: '10.88.0.1' }] },
    Internal: false,
    Attachable: false,
    Ingress: false,
    ConfigOnly: false,
    Containers: {},
    Options: {},
    Labels: {},
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    engineType: 'podman' as const,
  },
  {
    Name: 'my-app-network',
    Id: 'net0000000000000000000000000000000000000000000000000000000000000002',
    Created: new Date(now - 5 * DAY * 1000).toISOString(),
    Scope: 'local',
    Driver: 'bridge',
    EnableIPv6: false,
    IPAM: { Driver: 'default', Options: {}, Config: [{ Subnet: '172.20.0.0/16', Gateway: '172.20.0.1' }] },
    Internal: false,
    Attachable: true,
    Ingress: false,
    ConfigOnly: false,
    Containers: {
      [MOCK_CONTAINERS[0].Id]: {
        Name: 'my-web-app',
        EndpointID: 'ep1',
        MacAddress: '02:42:ac:14:00:02',
        IPv4Address: '172.20.0.2/16',
        IPv6Address: '',
      },
      [MOCK_CONTAINERS[1].Id]: {
        Name: 'postgres-db',
        EndpointID: 'ep2',
        MacAddress: '02:42:ac:14:00:03',
        IPv4Address: '172.20.0.3/16',
        IPv6Address: '',
      },
    },
    Options: {},
    Labels: { 'com.example.project': 'my-app' },
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    engineType: 'podman' as const,
  },
  {
    Name: 'isolated-net',
    Id: 'net0000000000000000000000000000000000000000000000000000000000000003',
    Created: new Date(now - 10 * DAY * 1000).toISOString(),
    Scope: 'local',
    Driver: 'bridge',
    EnableIPv6: false,
    IPAM: { Driver: 'default', Options: {}, Config: [{ Subnet: '172.30.0.0/16', Gateway: '172.30.0.1' }] },
    Internal: true,
    Attachable: false,
    Ingress: false,
    ConfigOnly: false,
    Containers: {},
    Options: {},
    Labels: { purpose: 'testing' },
    engineId: MOCK_ENGINE_ID,
    engineName: 'Podman',
    engineType: 'podman' as const,
  },
];

// ─── Mock Kubernetes ─────────────────────────────────────────────────────────

const MOCK_K8S_CONTEXT = {
  name: K8S_CONTEXT_NAME,
  cluster: 'minikube',
  user: 'minikube',
  namespace: 'default',
  clusterInfo: { name: 'minikube', server: 'https://192.168.49.2:8443', skipTLSVerify: false },
  currentContext: true,
};

const MOCK_K8S_GENERAL_STATE = {
  reachable: true,
  resources: { pods: 4, deployments: 2 },
};

const MOCK_K8S_PODS = [
  {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'nginx-deployment-7fb96c846b-abc12',
      namespace: 'default',
      uid: 'k8s-pod-1',
      creationTimestamp: new Date(now - 1 * DAY * 1000).toISOString(),
      labels: { app: 'nginx', 'pod-template-hash': '7fb96c846b' },
      ownerReferences: [{ kind: 'ReplicaSet', name: 'nginx-deployment-7fb96c846b' }],
    },
    spec: {
      containers: [{ name: 'nginx', image: 'nginx:1.25', ports: [{ containerPort: 80 }] }],
      nodeName: 'minikube',
    },
    status: {
      phase: 'Running',
      conditions: [{ type: 'Ready', status: 'True' }],
      containerStatuses: [
        {
          name: 'nginx',
          ready: true,
          restartCount: 0,
          state: { running: { startedAt: new Date(now - 1 * DAY * 1000).toISOString() } },
          image: 'nginx:1.25',
          imageID: 'docker.io/library/nginx@sha256:aaa',
        },
      ],
    },
  },
  {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'nginx-deployment-7fb96c846b-def34',
      namespace: 'default',
      uid: 'k8s-pod-2',
      creationTimestamp: new Date(now - 1 * DAY * 1000).toISOString(),
      labels: { app: 'nginx', 'pod-template-hash': '7fb96c846b' },
      ownerReferences: [{ kind: 'ReplicaSet', name: 'nginx-deployment-7fb96c846b' }],
    },
    spec: {
      containers: [{ name: 'nginx', image: 'nginx:1.25', ports: [{ containerPort: 80 }] }],
      nodeName: 'minikube',
    },
    status: {
      phase: 'Running',
      conditions: [{ type: 'Ready', status: 'True' }],
      containerStatuses: [
        {
          name: 'nginx',
          ready: true,
          restartCount: 0,
          state: { running: { startedAt: new Date(now - 1 * DAY * 1000).toISOString() } },
          image: 'nginx:1.25',
          imageID: 'docker.io/library/nginx@sha256:aaa',
        },
      ],
    },
  },
  {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'redis-master-0',
      namespace: 'default',
      uid: 'k8s-pod-3',
      creationTimestamp: new Date(now - 3 * DAY * 1000).toISOString(),
      labels: { app: 'redis', role: 'master' },
    },
    spec: { containers: [{ name: 'redis', image: 'redis:7', ports: [{ containerPort: 6379 }] }], nodeName: 'minikube' },
    status: {
      phase: 'Running',
      conditions: [{ type: 'Ready', status: 'True' }],
      containerStatuses: [
        {
          name: 'redis',
          ready: true,
          restartCount: 0,
          state: { running: { startedAt: new Date(now - 3 * DAY * 1000).toISOString() } },
          image: 'redis:7',
          imageID: 'docker.io/library/redis@sha256:ccc',
        },
      ],
    },
  },
  {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'coredns-5dd5756b68-xyz99',
      namespace: 'kube-system',
      uid: 'k8s-pod-4',
      creationTimestamp: new Date(now - 10 * DAY * 1000).toISOString(),
      labels: { 'k8s-app': 'kube-dns' },
    },
    spec: {
      containers: [
        { name: 'coredns', image: 'registry.k8s.io/coredns/coredns:v1.11.1', ports: [{ containerPort: 53 }] },
      ],
      nodeName: 'minikube',
    },
    status: {
      phase: 'Running',
      conditions: [{ type: 'Ready', status: 'True' }],
      containerStatuses: [
        {
          name: 'coredns',
          ready: true,
          restartCount: 0,
          state: { running: { startedAt: new Date(now - 10 * DAY * 1000).toISOString() } },
          image: 'registry.k8s.io/coredns/coredns:v1.11.1',
          imageID: 'registry.k8s.io/coredns@sha256:xxx',
        },
      ],
    },
  },
];

const MOCK_K8S_DEPLOYMENTS = [
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: 'nginx-deployment',
      namespace: 'default',
      uid: 'k8s-dep-1',
      creationTimestamp: new Date(now - 1 * DAY * 1000).toISOString(),
      labels: { app: 'nginx' },
    },
    spec: {
      replicas: 2,
      selector: { matchLabels: { app: 'nginx' } },
      template: {
        metadata: { labels: { app: 'nginx' } },
        spec: { containers: [{ name: 'nginx', image: 'nginx:1.25' }] },
      },
    },
    status: {
      replicas: 2,
      readyReplicas: 2,
      availableReplicas: 2,
      conditions: [{ type: 'Available', status: 'True', reason: 'MinimumReplicasAvailable' }],
    },
  },
  {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: 'redis-master',
      namespace: 'default',
      uid: 'k8s-dep-2',
      creationTimestamp: new Date(now - 3 * DAY * 1000).toISOString(),
      labels: { app: 'redis' },
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: 'redis' } },
      template: { metadata: { labels: { app: 'redis' } }, spec: { containers: [{ name: 'redis', image: 'redis:7' }] } },
    },
    status: {
      replicas: 1,
      readyReplicas: 1,
      availableReplicas: 1,
      conditions: [{ type: 'Available', status: 'True', reason: 'MinimumReplicasAvailable' }],
    },
  },
];

const MOCK_K8S_SERVICES = [
  {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: 'kubernetes',
      namespace: 'default',
      uid: 'k8s-svc-1',
      creationTimestamp: new Date(now - 30 * DAY * 1000).toISOString(),
    },
    spec: { type: 'ClusterIP', clusterIP: '10.96.0.1', ports: [{ port: 443, targetPort: 8443, protocol: 'TCP' }] },
  },
  {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: 'nginx-service',
      namespace: 'default',
      uid: 'k8s-svc-2',
      creationTimestamp: new Date(now - 1 * DAY * 1000).toISOString(),
      labels: { app: 'nginx' },
    },
    spec: {
      type: 'ClusterIP',
      clusterIP: '10.96.0.50',
      ports: [{ port: 80, targetPort: 80, protocol: 'TCP' }],
      selector: { app: 'nginx' },
    },
  },
  {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: 'redis-service',
      namespace: 'default',
      uid: 'k8s-svc-3',
      creationTimestamp: new Date(now - 3 * DAY * 1000).toISOString(),
      labels: { app: 'redis' },
    },
    spec: {
      type: 'ClusterIP',
      clusterIP: '10.96.0.60',
      ports: [{ port: 6379, targetPort: 6379, protocol: 'TCP' }],
      selector: { app: 'redis' },
    },
  },
];

const MOCK_K8S_NODES = [
  {
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name: 'minikube',
      uid: 'k8s-node-1',
      creationTimestamp: new Date(now - 30 * DAY * 1000).toISOString(),
      labels: { 'kubernetes.io/hostname': 'minikube', 'node-role.kubernetes.io/control-plane': '' },
    },
    status: {
      conditions: [{ type: 'Ready', status: 'True' }],
      nodeInfo: {
        kubeletVersion: 'v1.30.0',
        osImage: 'Ubuntu 22.04.4 LTS',
        containerRuntimeVersion: 'containerd://1.7.15',
        architecture: 'amd64',
      },
      capacity: { cpu: '4', memory: '8156080Ki', pods: '110' },
      allocatable: { cpu: '4', memory: '8156080Ki', pods: '110' },
    },
  },
];

// ─── Mock Extensions ─────────────────────────────────────────────────────────

const MOCK_EXTENSIONS = [
  {
    id: 'podman.podman',
    name: 'podman',
    displayName: 'Podman',
    description: 'Integration for Podman and Podman Machine',
    publisher: 'podman-desktop',
    removable: false,
    devMode: false,
    version: '1.28.0',
    state: 'started',
    path: '/app/extensions/podman',
    readme: '# Podman Extension\n\nProvides Podman container engine integration.',
  },
  {
    id: 'podman.compose',
    name: 'compose',
    displayName: 'Compose',
    description: 'Run multi-container applications with Compose',
    publisher: 'podman-desktop',
    removable: false,
    devMode: false,
    version: '0.5.0',
    state: 'started',
    path: '/app/extensions/compose',
    readme: '# Compose Extension\n\nSupport for Compose files.',
  },
  {
    id: 'redhat.openshift-local',
    name: 'openshift-local',
    displayName: 'Red Hat OpenShift Local',
    description: 'Run a local OpenShift cluster with CRC',
    publisher: 'Red Hat',
    removable: true,
    devMode: false,
    version: '1.6.0',
    state: 'stopped',
    path: '/app/extensions/openshift-local',
    readme: '# OpenShift Local\n\nCreate and manage local OpenShift clusters.',
  },
  {
    id: 'redhat.authentication',
    name: 'authentication',
    displayName: 'Red Hat Authentication',
    description: 'Manage Red Hat SSO authentication',
    publisher: 'Red Hat',
    removable: true,
    devMode: false,
    version: '1.2.0',
    state: 'started',
    path: '/app/extensions/authentication',
    readme: '# Red Hat Authentication\n\nSSO and registry authentication support.',
  },
  {
    id: 'containers.registries',
    name: 'registries',
    displayName: 'Registries',
    description: 'Manage container image registries',
    publisher: 'podman-desktop',
    removable: false,
    devMode: false,
    version: '1.0.0',
    state: 'started',
    path: '/app/extensions/registries',
    readme: '# Registries\n\nContainer image registry management.',
  },
];

// ─── Implement specific methods with mock data ───────────────────────────────

// Boot lifecycle
(window as any).extensionSystemIsReady = async () => true;
(window as any).extensionSystemIsExtensionsStarted = async () => true;

// Provider info
(window as any).getProviderInfos = async () => {
  mockProviderSnapshot = buildMockProvider();
  return [mockProviderSnapshot];
};

(window as any).startProviderConnectionLifecycle = async (
  _internalId: string,
  connectionSnapshot: unknown,
  loggerHandlerKey: symbol,
  eventCollect: (key: symbol, eventName: 'log' | 'warn' | 'error' | 'finish', args: string[]) => void,
): Promise<void> => {
  await mockStartProviderConnectionLifecycle(
    connectionSnapshot as import('@podman-desktop/core-api').ProviderConnectionInfo,
    loggerHandlerKey,
    eventCollect,
    notifyMockProviderChanged,
  );
};

(window as any).startProvider = async (_internalId: string): Promise<void> => {
  await mockStartProvider(notifyMockProviderChanged);
};

// Volumes
function addMockVolume(name: string): void {
  const engine = MOCK_VOLUMES[0];
  if (!engine.Volumes.some(volume => volume.Name === name)) {
    engine.Volumes.unshift({
      Name: name,
      Driver: 'local',
      Mountpoint: `/var/lib/containers/storage/volumes/${name}/_data`,
      CreatedAt: new Date().toISOString(),
      Labels: {},
      Scope: 'local',
      Options: {},
      engineName: 'Podman',
      engineId: MOCK_ENGINE_ID,
      UsageData: { Size: 52428800, RefCount: 0 },
      containersUsage: [],
    });
  }
}

function notifyVolumeListChanged(): void {
  (window as any).events.send('volume-event');
}

(window as any).listVolumes = async () => MOCK_VOLUMES;
(window as any).getVolumeInspect = async (_engine: string, volumeName: string) => {
  const vol = MOCK_VOLUMES[0].Volumes.find(v => v.Name === volumeName);
  return vol ?? {};
};
(window as any).createVolume = async (_provider: unknown, options?: { Name?: string }) => {
  if (options?.Name) {
    addMockVolume(options.Name);
    notifyVolumeListChanged();
  }
};
(window as any).removeVolume = async (_engine: string, volumeName: string) => {
  const engine = MOCK_VOLUMES[0];
  engine.Volumes = engine.Volumes.filter(volume => volume.Name !== volumeName);
  notifyVolumeListChanged();
};
(window as any).pruneVolumes = async () => '';
(window as any).getContributedMenus = async () => [];
(window as any).showMessageBox = async () => ({ response: 0 });

// Volume export/import
(window as any).exportVolume = async (_engine: string, options: { volumeName: string; outputTarget: string }) => {
  await new Promise(r => setTimeout(r, 1500));
  // Simulate a successful export in the browser prototype.
  if (typeof document !== 'undefined') {
    const blob = new Blob(['Mock Podman Desktop volume export archive'], { type: 'application/x-tar' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = options.outputTarget.split('/').pop() ?? `${options.volumeName}.tar`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
};

(window as any).importVolume = async (options: { volumeName: string; archivePath: string }) => {
  await new Promise(r => setTimeout(r, 1500));
  addMockVolume(options.volumeName);
  notifyVolumeListChanged();
};

// File dialogs — use a real file picker in the browser prototype.
(window as any).openDialog = async (options?: { selectors?: string[] }) => {
  const wantsFile = options?.selectors?.includes('openFile');
  const allowMultiple = options?.selectors?.includes('multiSelections');

  if (typeof document !== 'undefined' && wantsFile) {
    return new Promise<string[] | undefined>(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.tar,application/x-tar,application/tar';
      input.multiple = allowMultiple ?? false;
      input.style.display = 'none';

      input.addEventListener('change', () => {
        const files = input.files;
        input.remove();
        if (!files || files.length === 0) {
          resolve(undefined);
          return;
        }
        resolve(
          Array.from(files).map(file => (file.name.includes('/') ? file.name : `/home/user/Downloads/${file.name}`)),
        );
      });

      document.body.appendChild(input);
      input.click();
    });
  }

  return ['/home/user/Downloads/my-app-data-example.tar'];
};

(window as any).saveDialog = async (options?: { defaultUri?: { fsPath?: string; path?: string } }) => {
  const defaultPath =
    options?.defaultUri?.fsPath ?? options?.defaultUri?.path ?? '/home/user/Downloads/volume-export.tar';
  const fileName = defaultPath.split('/').pop() ?? 'volume-export.tar';
  const fsPath = defaultPath.includes('/') ? defaultPath : `/home/user/Downloads/${fileName}`;

  return {
    scheme: 'file',
    path: fsPath,
    fsPath,
    authority: '',
    query: '',
    fragment: '',
  };
};

// Theme / appearance
(window as any).listColors = async (themeName?: string) => {
  const effective = themeName ?? resolveThemeName(appearancePreference);
  return getColorsForTheme(effective);
};
(window as any).getConfigurationValue = async (key: string) => {
  if (key === 'preferences.appearance') return appearancePreference;
  if (key === 'preferences.ShowBadgeOnDashboard') return false;
  if (key === 'preferences.navigationBarLayout') return 'icon + title';
  if (key === 'welcome.version') return 'already-seen';
  if (key === 'telemetry.check') return true;
  if (key === 'telemetry.enabled') return false;
  if (key.endsWith('.expanded')) return true;
  if (key === 'systemOverview.expanded') return true;
  if (key === 'learningCenter.expanded') return true;
  if (key === 'exploreFeatures.expanded') return true;
  if (key === 'releaseNotesBanner.show') return '1.27.0';
  if (key in MOCK_RESOURCE_CONFIG_VALUES) {
    return MOCK_RESOURCE_CONFIG_VALUES[key];
  }
  return undefined;
};
(window as any).getConfigurationProperties = async () => ({
  ...MOCK_CONTAINER_CONNECTION_RESOURCE_PROPERTIES,
  'preferences.appearance': {
    id: 'preferences.appearance',
    parentId: 'preferences',
    title: 'Appearance',
    description: 'Select light, dark, high-contrast light, high-contrast dark, or use your system setting.',
    type: 'string',
    enum: ['system', 'dark', 'light'],
    default: 'system',
    scope: 'DEFAULT',
  },
  'preferences.navigationBarLayout': {
    id: 'preferences.navigationBarLayout',
    parentId: 'preferences',
    title: 'Navigation Bar Layout',
    description: 'Select icon and title or just icon for navigation icons',
    type: 'string',
    enum: ['icon + title', 'icon'],
    default: 'icon + title',
    scope: 'DEFAULT',
  },
});
(window as any).updateConfigurationValue = async (key: string, value: unknown) => {
  if (key === 'preferences.appearance' && typeof value === 'string') {
    appearancePreference = value as AppearancePreference;
    applyResolvedTheme(appearancePreference);
    notifyThemeChanged(key, value);
  }
  window.dispatchEvent(new CustomEvent(key, { detail: { key, value } }));
  (window as any).events.send('configuration-changed', { key, value });
  (window as any).events.send('onDidChangeConfiguration', { key, value, scope: 'DEFAULT' });
};

(window as any).onDidUpdateProviderStatus = async (_internalId: string, _callback: () => void) => ({
  dispose(): void {},
});

// Containers
(window as any).listContainers = async () => MOCK_CONTAINERS;
(window as any).getContainerInspect = async (_engineId: string, containerId: string) => {
  const c = MOCK_CONTAINERS.find(ct => ct.Id === containerId);
  if (!c) return {};
  return {
    Id: c.Id,
    Name: c.Names[0],
    Image: c.Image,
    Created: new Date(c.Created * 1000).toISOString(),
    State: {
      Status: c.State,
      Running: c.State === 'running',
      Paused: false,
      Restarting: false,
      StartedAt: c.StartedAt,
    },
    Config: { Image: c.Image, Labels: c.Labels, Cmd: [c.Command] },
    NetworkSettings: { Ports: {} },
    Mounts: [],
  };
};
(window as any).getContainerStats = async () => ({
  cpu_stats: { cpu_usage: { total_usage: 0 } },
  memory_stats: { usage: 0, limit: 0 },
});

function notifyContainerListChanged(): void {
  (window as any).events.send('container-started-event');
  (window as any).events.send('provider-change');
}

function findMockContainer(containerId: string) {
  return MOCK_CONTAINERS.find(container => container.Id === containerId);
}

(window as any).startContainer = async (_engineId: string, containerId: string) => {
  const container = findMockContainer(containerId);
  if (container) {
    container.State = 'running';
    container.Status = 'Up less than a second';
    container.StartedAt = new Date().toISOString();
    notifyContainerListChanged();
  }
};

(window as any).stopContainer = async (_engineId: string, containerId: string) => {
  const container = findMockContainer(containerId);
  if (container) {
    container.State = 'exited';
    container.Status = 'Exited (0) just now';
    notifyContainerListChanged();
  }
};

(window as any).restartContainer = async (_engineId: string, containerId: string) => {
  const container = findMockContainer(containerId);
  if (container) {
    container.State = 'running';
    container.Status = 'Up less than a second';
    container.StartedAt = new Date().toISOString();
    notifyContainerListChanged();
  }
};

(window as any).deleteContainer = async (_engineId: string, containerId: string) => {
  const index = MOCK_CONTAINERS.findIndex(container => container.Id === containerId);
  if (index >= 0) {
    MOCK_CONTAINERS.splice(index, 1);
    notifyContainerListChanged();
  }
};

function notifyPodListChanged(): void {
  (window as any).events.send('pod-event');
  (window as any).events.send('provider-change');
}

function findMockPod(podId: string) {
  return MOCK_PODS.find(pod => pod.Id === podId);
}

(window as any).startPod = async (_engineId: string, podId: string) => {
  const pod = findMockPod(podId);
  if (pod) {
    pod.Status = 'Running';
    notifyPodListChanged();
  }
};

(window as any).stopPod = async (_engineId: string, podId: string) => {
  const pod = findMockPod(podId);
  if (pod) {
    pod.Status = 'Exited';
    notifyPodListChanged();
  }
};

(window as any).restartPod = async (_engineId: string, podId: string) => {
  const pod = findMockPod(podId);
  if (pod) {
    pod.Status = 'Running';
    notifyPodListChanged();
  }
};

(window as any).removePod = async (_engineId: string, podId: string) => {
  const index = MOCK_PODS.findIndex(pod => pod.Id === podId);
  if (index >= 0) {
    MOCK_PODS.splice(index, 1);
    notifyPodListChanged();
  }
};

// Images
(window as any).listImages = async () => MOCK_IMAGES;
(window as any).getImageInspect = async (_engineId: string, imageId: string) => {
  const img = MOCK_IMAGES.find(i => i.Id === imageId);
  if (!img) return {};
  return {
    Id: img.Id,
    RepoTags: img.RepoTags,
    Created: new Date(img.Created * 1000).toISOString(),
    Size: img.Size,
    VirtualSize: img.VirtualSize,
    Labels: img.Labels,
    Architecture: img.Arch,
    Os: 'linux',
    Config: { Cmd: ['/bin/sh'], Env: [], Labels: img.Labels },
    RootFS: { Type: 'layers', Layers: [] },
  };
};
(window as any).getImageHistory = async () => [];

// Pods
(window as any).listPods = async () => MOCK_PODS;
(window as any).getPodInspect = async (_engineId: string, podId: string) => {
  const pod = MOCK_PODS.find(p => p.Id === podId);
  if (!pod) return {};
  return { ...pod };
};

// Networks
(window as any).listNetworks = async () => MOCK_NETWORKS;
(window as any).inspectNetwork = async (_engineId: string, networkId: string) => {
  const net = MOCK_NETWORKS.find(n => n.Id === networkId);
  return net ?? {};
};

// Extensions
(window as any).listExtensions = async () => {
  if (healthScenarioData.composeExtensionEnabled) {
    return MOCK_EXTENSIONS;
  }
  return MOCK_EXTENSIONS.filter(ext => !ext.id.includes('compose'));
};
(window as any).listContributions = async () => [];
(window as any).listIcons = async () => [];
(window as any).listOnboarding = async () => [];
(window as any).listNotifications = async () => [];
(window as any).listWebviews = async () => [];
(window as any).listViewsContributions = async () => [];
(window as any).listContexts = async () => [];
(window as any).listFeatures = async () => MOCK_EXPLORE_FEATURES;
(window as any).listGuides = async () => MOCK_GUIDES;
(window as any).openExternal = async (url: string) => {
  if (typeof url === 'string' && url.length > 0) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
(window as any).listExtensionDevelopmentFolders = async () => [];
(window as any).getDocumentationItems = async () => [];
(window as any).getCatalogExtensions = async () => [];
(window as any).getFeaturedExtensions = async () => [];
(window as any).getExtensionBanners = async () => MOCK_EXTENSION_BANNERS;
(window as any).getRecommendedRegistries = async () => [];
(window as any).getStatusBarEntries = async () => getRuntimeStatusBarEntries();
(window as any).getStatusBarPinOptions = async () => [];
(window as any).getCliToolInfos = async () => [];
(window as any).getImageRegistries = async () => [];
(window as any).getImageSuggestedRegistries = async () => [];
(window as any).getImageRegistryProviderNames = async () => [];
(window as any).getCommandPaletteCommands = async () => [];
(window as any).getCommandPaletteSearchOptions = async () => [];
(window as any).getAuthenticationProvidersInfo = async () => {
  const override = getPrototypeApiReturn<unknown[]>('getAuthenticationProvidersInfo');
  if (override !== undefined) {
    return override;
  }
  return [];
};
(window as any).getImageCheckerProviders = async () => [];
(window as any).getImageFilesProviders = async () => [];
(window as any).getKubeGeneratorsInfos = async () => [];
(window as any).getKubernetesPortForwards = async () => [];
(window as any).helpMenuGetItems = async () => [];
(window as any).getRegisteredFeatures = async () => [];
(window as any).getContributedMenus = async () => [];
(window as any).getWelcomeMessages = async () => ({ messages: [] });
(window as any).getFeedbackMessages = async () => ({});
(window as any).getTelemetryMessages = async () => ({});
(window as any).getDevtoolsConsoleLogs = async () => [];
(window as any).contextCollectAllValues = async () => ({});

// Kubernetes
(window as any).kubernetesGetCurrentContextName = async () => K8S_CONTEXT_NAME;
(window as any).kubernetesGetContexts = async () => [MOCK_K8S_CONTEXT];
(window as any).kubernetesGetDetailedContexts = async () => [MOCK_K8S_CONTEXT];
(window as any).kubernetesGetContextsGeneralState = async () => {
  const m = new Map();
  m.set(K8S_CONTEXT_NAME, MOCK_K8S_GENERAL_STATE);
  return m;
};
(window as any).kubernetesGetCurrentContextGeneralState = async () => MOCK_K8S_GENERAL_STATE;
(window as any).kubernetesGetContextsHealths = async () => [];
(window as any).kubernetesGetContextsPermissions = async () => [];
(window as any).kubernetesGetResourcesCount = async () => {
  const k8sConnections = getRuntimeProviderState().kubernetesConnections;
  const clusterRunning = k8sConnections.some(connection => connection.status === 'started' && !connection.error);
  if (!clusterRunning) {
    return [{ contextName: K8S_CONTEXT_NAME, resourceName: 'pods', count: 0 }];
  }
  return [
    { contextName: K8S_CONTEXT_NAME, resourceName: 'pods', count: 4 },
    { contextName: K8S_CONTEXT_NAME, resourceName: 'deployments', count: 2 },
    { contextName: K8S_CONTEXT_NAME, resourceName: 'services', count: 3 },
    { contextName: K8S_CONTEXT_NAME, resourceName: 'nodes', count: 1 },
  ];
};
(window as any).kubernetesGetActiveResourcesCount = async () => [];
(window as any).kubernetesGetClusters = async () => [{ name: 'minikube', server: 'https://192.168.49.2:8443' }];
(window as any).kubernetesGetUsers = async () => [{ name: 'minikube' }];
(window as any).kubernetesGetCurrentNamespace = async () => 'default';
(window as any).kubernetesListNamespaces = async () => ({
  items: [
    { metadata: { name: 'default', uid: 'ns-1', creationTimestamp: new Date(now - 30 * DAY * 1000).toISOString() } },
    {
      metadata: { name: 'kube-system', uid: 'ns-2', creationTimestamp: new Date(now - 30 * DAY * 1000).toISOString() },
    },
  ],
});
(window as any).kubernetesRegisterGetCurrentContextResources = async (resourceName: string) => {
  const resources: Record<string, unknown[]> = {
    pods: MOCK_K8S_PODS,
    deployments: MOCK_K8S_DEPLOYMENTS,
    services: MOCK_K8S_SERVICES,
    nodes: MOCK_K8S_NODES,
    configmaps: [],
    secrets: [],
    persistentvolumeclaims: [],
    ingresses: [],
    routes: [],
    jobs: [],
    cronjobs: [],
    events: [],
  };
  return resources[resourceName] ?? [];
};
(window as any).kubernetesUnregisterGetCurrentContextResources = async () => [];

// OS info
(window as any).getOsPlatform = async () => 'linux';
(window as any).getOsArch = async () => 'x64';
(window as any).getOsHostname = async () => 'prototype';
(window as any).getOsFreeDiskSize = async () => '100 GB';
(window as any).getOsMemory = async () => '16 GB';
(window as any).getOsCpu = async () => '8 cores';

// Misc
(window as any).getPodmanDesktopVersion = async () => '1.28.0';
(window as any).getTitleBarText = async () => 'Podman Desktop — Dashboard V2 Prototype';
(window as any).podmanDesktopUpdateAvailable = async () => false;
(window as any).podmanDesktopGetReleaseNotes = async () => MOCK_RELEASE_NOTES;
(window as any).getUrlProtocol = async () => 'podman-desktop';
(window as any).isExperimentalConfigurationEnabled = async (key: string) => key === 'dashboard.enhancedDashboard';
(window as any).getDashboardSystemOverviewStatus = async () => getRuntimeSystemOverviewStatus();
(window as any).getSystemDockerSocketMappingStatus = async () => ({});

// Telemetry — no-op
(window as any).telemetryTrack = async () => {};
(window as any).telemetryPage = async () => {};
(window as any).telemetryConfigure = async () => {};

// Window controls — no-op
(window as any).windowMinimize = async () => {};
(window as any).windowMaximize = async () => {};
(window as any).windowClose = async () => {};

// Column config
(window as any).loadListConfig = async (kind: string, availableColumns: string[]) => {
  if (kind === 'dashboard') {
    return loadStoredDashboardLayout(availableColumns) ?? getDefaultDashboardLayoutItems(availableColumns);
  }
  return availableColumns.map((col: string, i: number) => ({
    id: col,
    label: col,
    enabled: true,
    originalOrder: i,
  }));
};
(window as any).saveListConfig = async (kind: string, items: unknown[]) => {
  if (kind === 'dashboard') {
    localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(items));
  }
};
(window as any).resetListConfig = async (kind: string, availableColumns: string[]) => {
  if (kind === 'dashboard') {
    localStorage.removeItem(DASHBOARD_LAYOUT_STORAGE_KEY);
    return getDefaultDashboardLayoutItems(availableColumns);
  }
  return availableColumns.map((col: string, i: number) => ({
    id: col,
    label: col,
    enabled: true,
    originalOrder: i,
  }));
};

// ─── Trigger boot lifecycle (repeat to avoid store subscription race) ────────

function triggerBootLifecycle(): void {
  applyHealthScenario();
  mockProviderSnapshot = buildMockProvider();
  (window as any).events.send('starting-extensions', 'true');
  window.dispatchEvent(new CustomEvent('system-ready', {}));
  window.dispatchEvent(new CustomEvent('extensions-already-started', {}));
  (window as any).events.send('extensions-started');
  (window as any).events.send('enhanced-dashboard-enabled', true);
  (window as any).events.send('explore-features-loaded');
  (window as any).events.send('dashboard:system-overview-status', getRuntimeSystemOverviewStatus());
  (window as any).events.send('status-bar-updated');
  (window as any).events.send('provider-change');
  (window as any).events.send('container-started-event');
  (window as any).events.send('pod-event');
  (window as any).events.send('volume-event');
}

triggerBootLifecycle();
setTimeout(triggerBootLifecycle, 100);
setTimeout(triggerBootLifecycle, 500);
setTimeout(triggerBootLifecycle, 1500);
document.addEventListener('DOMContentLoaded', triggerBootLifecycle);

// ─── Inject CSS color variables directly (bypasses ColorsStyle event store) ──

function applyThemeColors(colors: ColorEntry[]): void {
  let el = document.getElementById('mock-preload-colors');
  if (!el) {
    el = document.createElement('style');
    el.id = 'mock-preload-colors';
    document.head.appendChild(el);
  }
  el.textContent = `:root {\n${colors.map(c => `  ${c.cssVar}: ${c.value};`).join('\n')}\n}`;
}

applyResolvedTheme();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (appearancePreference === 'system') {
    applyResolvedTheme();
    notifyThemeChanged('preferences.appearance', appearancePreference);
  }
});

// ─── Hide Electron-only UI ───────────────────────────────────────────────────

const staticStyles = document.createElement('style');
staticStyles.textContent = `
  /* Hide Electron window drag region */
  [style*="-webkit-app-region: drag"] {
    -webkit-app-region: no-drag !important;
  }
  /* Hide window control buttons (minimize/maximize/close) */
  .window-controls,
  [class*="WindowControls"],
  [aria-label="Window controls"] {
    display: none !important;
  }
  /* List page search: underline-only field (match Electron) */
  [role="region"][aria-label="search"] {
    align-items: flex-end;
  }
  [role="region"][aria-label="search"] .flex.flex-col.grow,
  [role="region"][aria-label="search"] .flex.flex-row.grow {
    flex-grow: 0;
    width: 100%;
  }
  [role="region"][aria-label="search"] .group {
    background-color: transparent;
    border-bottom: 1px solid var(--pd-input-field-stroke, #aaabac);
  }
  [role="region"][aria-label="search"] input {
    background-color: transparent;
  }
  /* Status icons on colored backgrounds */
  [role="status"][title="RUNNING"],
  [role="status"][title="USED"],
  [role="status"][title="STARTING"],
  [role="status"][title="DEGRADED"] {
    color: var(--pd-status-contrast, #ffffff);
  }
  [role="status"][title="RUNNING"] svg,
  [role="status"][title="USED"] svg,
  [role="status"][title="STARTING"] svg,
  [role="status"][title="DEGRADED"] svg {
    color: inherit;
  }
  /* Table row action buttons — ensure icons are visible in static prototype */
  [role="table"] button[title*="Container"],
  [role="table"] button[title*="Pod"],
  [role="table"] button[aria-label="kebab menu"] {
    color: var(--pd-action-button-text, #36363d);
  }
  [role="table"] button[title*="Container"] svg,
  [role="table"] button[title*="Pod"] svg,
  [role="table"] button[aria-label="kebab menu"] svg {
    color: inherit;
    fill: currentColor;
  }
  [role="table"] [role="cell"]:has(button[title*="Container"]),
  [role="table"] [role="cell"]:has(button[title*="Pod"]) {
    overflow: visible;
  }
`;
document.head.appendChild(staticStyles);

console.log('[mock-preload] Static prototype mode initialized with mock data.');

<script lang="ts">
import {
  faArrowsRotate,
  faExternalLinkSquareAlt,
  faFileCode,
  faPlay,
  faRocket,
  faStop,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import type { Menu } from '@podman-desktop/core-api';
import { MenuContext } from '@podman-desktop/core-api';
import { DropdownMenu } from '@podman-desktop/ui-svelte';
import { createEventDispatcher, onMount } from 'svelte';
import { router } from 'tinro';

import ContributionActions from '/@/lib/actions/ContributionActions.svelte';
import { ContainerUtils } from '/@/lib/container/container-utils';
import { withConfirmation } from '/@/lib/dialogs/messagebox-utils';
import { withPrototypeActionDelay } from '/@/lib/layout/compact-nav-action-status.svelte';
import FlatMenu from '/@/lib/ui/FlatMenu.svelte';
import ListItemButtonIcon from '/@/lib/ui/ListItemButtonIcon.svelte';
import { clearPodActionInProgress, setPodActionError, setPodStatus } from '/@/stores/pods';

import type { PodInfoUI } from './PodInfoUI';

interface Props {
  pod: PodInfoUI;
  dropdownMenu?: boolean;
  /** When true, all actions (including start/stop/delete) go in the kebab menu. */
  menuOnly?: boolean;
  detailed?: boolean;
  onUpdate?: (update: PodInfoUI) => void;
}

const dispatch = createEventDispatcher<{ update: PodInfoUI }>();

let {
  pod = $bindable(),
  dropdownMenu = false,
  menuOnly = false,
  detailed = false,
  onUpdate = (update): void => {
    dispatch('update', update);
  },
}: Props = $props();

let contributions = $state<Menu[]>([]);
onMount(async () => {
  contributions = await window.getContributedMenus(MenuContext.DASHBOARD_POD);
});

let urls: Array<string> = $state([]);
const openingUrls = $derived(urls);

const portRegexp = RegExp(/:(\d+)/);

function extractPort(urlString: string): number | undefined {
  const match = portRegexp.exec(urlString);
  return match ? parseInt(match[1], 10) : undefined;
}

onMount(async () => {
  const containerUtils = new ContainerUtils();

  const containerIds = pod.containers.map(podContainer => podContainer.Id);
  const podContainers = (await window.listContainers()).filter(
    container => containerIds.findIndex(containerInfo => containerInfo === container.Id) >= 0,
  );

  podContainers.forEach(container => {
    const openingUrls = containerUtils.getOpeningUrls(container);
    urls = [...new Set([...urls, ...openingUrls])];
  });
});

function inProgress(isStarting: boolean, state?: string): void {
  if (state) {
    setPodStatus(pod.engineId, pod.id, state);
  } else if (!isStarting) {
    clearPodActionInProgress(pod.engineId, pod.id);
  }
}

function handleError(errorMessage: string): void {
  setPodActionError(pod.engineId, pod.id, errorMessage);
}

async function runStatusAction(loadingStatus: string, finalStatus: string, action: () => Promise<void>): Promise<void> {
  inProgress(true, loadingStatus);
  try {
    if (menuOnly) {
      await withPrototypeActionDelay(action);
      inProgress(false, finalStatus);
    } else {
      await action();
      inProgress(false);
    }
  } catch (error) {
    handleError(String(error));
    inProgress(false);
  }
}

async function startPod(): Promise<void> {
  const hasPaused = pod.containers.some(c => c.Status === 'paused');
  const hasExited = pod.containers.some(c => c.Status === 'exited');

  await runStatusAction('STARTING', 'RUNNING', async () => {
    if (hasPaused) {
      await window.unpausePod(pod.engineId, pod.id);
    }
    if (hasExited) {
      await window.startPod(pod.engineId, pod.id);
    }
  });
}

async function restartPod(): Promise<void> {
  await runStatusAction('RESTARTING', 'RUNNING', () => window.restartPod(pod.engineId, pod.id));
}

async function stopPod(): Promise<void> {
  await runStatusAction('STOPPING', 'EXITED', () => window.stopPod(pod.engineId, pod.id));
}

async function deletePod(): Promise<void> {
  await runStatusAction('DELETING', 'DELETING', () => window.removePod(pod.engineId, pod.id));
}

function openGenerateKube(): void {
  router.goto(`/pods/podman/${encodeURI(pod.name)}/${encodeURIComponent(pod.engineId)}/kube`);
}

function deployToKubernetes(): void {
  router.goto(`/deploy-to-kube/${pod.id}/${pod.engineId}`);
}
// If dropdownMenu / menuOnly = true, use kebab; otherwise flat icons.
const asMenu = $derived(dropdownMenu || menuOnly);
const MenuComponent = $derived(asMenu ? DropdownMenu : FlatMenu);
</script>

{#if !menuOnly}
  <ListItemButtonIcon
    title="Start Pod"
    onClick={startPod}
    hidden={pod.status === 'RUNNING' || pod.status === 'STOPPING'}
    detailed={detailed}
    inProgress={pod.actionInProgress && pod.status === 'STARTING'}
    icon={faPlay} />
  <ListItemButtonIcon
    title="Stop Pod"
    onClick={stopPod}
    hidden={!(pod.status === 'RUNNING' || pod.status === 'STOPPING')}
    detailed={detailed}
    inProgress={pod.actionInProgress && pod.status === 'STOPPING'}
    icon={faStop} />
  <ListItemButtonIcon
    title="Delete Pod"
    onClick={(): void => withConfirmation(deletePod, `delete pod ${pod.name}`, { title: 'Delete Pod?', variant: 'delete' })}
    icon={faTrash}
    detailed={detailed}
    inProgress={pod.actionInProgress && pod.status === 'DELETING'} />
{/if}

<!-- If dropdownMenu / menuOnly is true, use kebab; otherwise just show the regular buttons -->
<MenuComponent>
  {#if menuOnly}
    <ListItemButtonIcon
      title="Start Pod"
      onClick={startPod}
      menu={true}
      hidden={pod.status === 'RUNNING' || pod.status === 'STOPPING'}
      detailed={detailed}
      inProgress={pod.actionInProgress && pod.status === 'STARTING'}
      icon={faPlay} />
    <ListItemButtonIcon
      title="Stop Pod"
      onClick={stopPod}
      menu={true}
      hidden={!(pod.status === 'RUNNING' || pod.status === 'STOPPING')}
      detailed={detailed}
      inProgress={pod.actionInProgress && pod.status === 'STOPPING'}
      icon={faStop} />
    <ListItemButtonIcon
      title="Delete Pod"
      onClick={(): void => withConfirmation(deletePod, `delete pod ${pod.name}`, { title: 'Delete Pod?', variant: 'delete' })}
      menu={true}
      icon={faTrash}
      detailed={detailed}
      inProgress={pod.actionInProgress && pod.status === 'DELETING'} />
  {/if}
  {#if !detailed}
    <ListItemButtonIcon
      title="Generate Kube"
      onClick={openGenerateKube}
      menu={asMenu}
      detailed={detailed}
      icon={faFileCode} />
  {/if}
  <ListItemButtonIcon
    title="Deploy to Kubernetes"
    onClick={deployToKubernetes}
    menu={asMenu}
    detailed={detailed}
    icon={faRocket} />
  {#if openingUrls.length === 0}
    <ListItemButtonIcon
      title="Open Exposed Port"
      menu={asMenu}
      enabled={false}
      hidden={asMenu}
      detailed={detailed}
      icon={faExternalLinkSquareAlt} />
  {:else if openingUrls.length === 1}
    <ListItemButtonIcon
      title="Open {extractPort(openingUrls[0])}"
      onClick={(): Promise<void> => window.openExternal(openingUrls[0])}
      menu={asMenu}
      enabled={pod.status === 'RUNNING'}
      hidden={asMenu}
      detailed={detailed}
      icon={faExternalLinkSquareAlt} />
  {:else if openingUrls.length > 1}
    <DropdownMenu icon={faExternalLinkSquareAlt} hidden={asMenu} shownAsMenuActionItem={true}>
      {#each openingUrls as url, index (index)}
        <ListItemButtonIcon
          title="Open {extractPort(url)}"
          onClick={(): Promise<void> => window.openExternal(url)}
          menu={!asMenu}
          enabled={pod.status === 'RUNNING'}
          hidden={asMenu}
          detailed={detailed}
          icon={faExternalLinkSquareAlt} />
      {/each}
    </DropdownMenu>
  {/if}
  <ListItemButtonIcon
    title="Restart Pod"
    onClick={restartPod}
    menu={asMenu}
    detailed={detailed}
    icon={faArrowsRotate} />
  <ContributionActions
    args={[pod]}
    contextPrefix="podItem"
    dropdownMenu={asMenu}
    contributions={contributions}
    detailed={detailed}
    onError={handleError} />
</MenuComponent>

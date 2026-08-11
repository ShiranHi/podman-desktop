<script lang="ts">
import {
  faAlignLeft,
  faArrowsRotate,
  faDownload,
  faExternalLinkSquareAlt,
  faFileCode,
  faPlay,
  faRocket,
  faStop,
  faTerminal,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import type { Menu } from '@podman-desktop/core-api';
import { MenuContext, NavigationPage } from '@podman-desktop/core-api';
import { DropdownMenu } from '@podman-desktop/ui-svelte';
import { createEventDispatcher, onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/store';

import ContributionActions from '/@/lib/actions/ContributionActions.svelte';
import { ContextUI } from '/@/lib/context/context';
import { withConfirmation } from '/@/lib/dialogs/messagebox-utils';
import { withPrototypeActionDelay } from '/@/lib/layout/compact-nav-action-status.svelte';
import FlatMenu from '/@/lib/ui/FlatMenu.svelte';
import ListItemButtonIcon from '/@/lib/ui/ListItemButtonIcon.svelte';
import { handleNavigation } from '/@/navigation';
import { context } from '/@/stores/context';

import { ContainerGroupInfoTypeUI, type ContainerInfoUI } from './ContainerInfoUI';

export let container: ContainerInfoUI;
export let dropdownMenu = false;
/** When true, all actions (including start/stop/delete) go in the kebab menu. */
export let menuOnly = false;
export let detailed = false;

let globalContext: ContextUI;
let contextsUnsubscribe: Unsubscriber;

const dispatch = createEventDispatcher<{ update: ContainerInfoUI }>();
export let onUpdate: (update: ContainerInfoUI) => void = update => {
  dispatch('update', update);
};
let contributions: Menu[] = [];
onMount(async () => {
  contributions = await window.getContributedMenus(MenuContext.DASHBOARD_CONTAINER);
  contextsUnsubscribe = context.subscribe(value => {
    // Copy context, do not use reference
    globalContext = new ContextUI();
    const allValues = value.collectAllValues();
    for (const k in allValues) {
      globalContext.setValue(k, allValues[k]);
    }
    globalContext.setValue('containerImageName', container.image);
  });
});

onDestroy(() => {
  // unsubscribe from the store
  contextsUnsubscribe?.();
});

function inProgress(inProgress: boolean, state?: string): void {
  container.actionInProgress = inProgress;
  // reset error when starting task
  if (inProgress) {
    container.actionError = '';
  }
  if (state) {
    container.state = state;
  }
  onUpdate(container);
}

function handleError(errorMessage: string): void {
  container.actionError = errorMessage;
  container.state = 'ERROR';
  onUpdate(container);
}

async function runStatusAction(loadingStatus: string, finalStatus: string, action: () => Promise<void>): Promise<void> {
  inProgress(true, loadingStatus);
  try {
    if (menuOnly) {
      // Compact-nav prototype: keep loading visible, then land on the expected final status.
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

async function startContainer(): Promise<void> {
  await runStatusAction('STARTING', 'RUNNING', () => window.startContainer(container.engineId, container.id));
}

async function unpauseContainer(): Promise<void> {
  await runStatusAction('STARTING', 'RUNNING', () => window.unpauseContainer(container.engineId, container.id));
}

async function restartContainer(): Promise<void> {
  await runStatusAction('RESTARTING', 'RUNNING', () => window.restartContainer(container.engineId, container.id));
}

async function stopContainer(): Promise<void> {
  await runStatusAction('STOPPING', 'EXITED', () => window.stopContainer(container.engineId, container.id));
}

function openBrowser(): void {
  if (!container.openingUrl) {
    return;
  }
  window
    .openExternal(container.openingUrl)
    .catch((err: unknown) => console.error(`Error opening URL ${container.openingUrl}`, err));
}

function openLogs(): void {
  handleNavigation({
    page: NavigationPage.CONTAINER_LOGS,
    parameters: {
      id: container.id,
    },
  });
}

async function deleteContainer(): Promise<void> {
  await runStatusAction('DELETING', 'DELETING', () => window.deleteContainer(container.engineId, container.id));
}

async function exportContainer(): Promise<void> {
  handleNavigation({
    page: NavigationPage.CONTAINER_EXPORT,
    parameters: {
      id: container.id,
    },
  });
}

function openTerminalContainer(): void {
  handleNavigation({
    page: NavigationPage.CONTAINER_TERMINAL,
    parameters: {
      id: container.id,
    },
  });
}

function openGenerateKube(): void {
  handleNavigation({
    page: NavigationPage.CONTAINER_KUBE,
    parameters: {
      id: container.id,
    },
  });
}

function deployToKubernetes(): void {
  handleNavigation({
    page: NavigationPage.DEPLOY_TO_KUBE,
    parameters: {
      id: container.id,
      engineId: container.engineId,
    },
  });
}

// If dropdownMenu / menuOnly = true, use the kebab dropdown; otherwise flat icons.
const asMenu = dropdownMenu || menuOnly;
let actionsStyle: typeof DropdownMenu | typeof FlatMenu;
if (asMenu) {
  actionsStyle = DropdownMenu;
} else {
  actionsStyle = FlatMenu;
}
</script>

{#if !menuOnly}
  <ListItemButtonIcon
    title="Start Container"
    onClick={container.state === 'PAUSED' ? unpauseContainer : startContainer}
    hidden={container.state === 'RUNNING' || container.state === 'STOPPING'}
    detailed={detailed}
    inProgress={container.actionInProgress && container.state === 'STARTING'}
    icon={faPlay}/>

  <ListItemButtonIcon
    title="Stop Container"
    onClick={stopContainer}
    hidden={!(container.state === 'RUNNING' || container.state === 'STOPPING')}
    detailed={detailed}
    inProgress={container.actionInProgress && container.state === 'STOPPING'}
    icon={faStop} />

  <ListItemButtonIcon
    title="Delete Container"
    onClick={(): void => withConfirmation(deleteContainer, `delete container ${container.name}`, { title: 'Delete Container?', variant: 'delete' })}
    icon={faTrash}
    detailed={detailed}
    inProgress={container.actionInProgress && container.state === 'DELETING'} />
{/if}

<!-- If dropdownMenu / menuOnly is true, use kebab; otherwise just show the regular buttons -->
<svelte:component this={actionsStyle}>
  {#if menuOnly}
    <ListItemButtonIcon
      title="Start Container"
      onClick={container.state === 'PAUSED' ? unpauseContainer : startContainer}
      menu={true}
      hidden={container.state === 'RUNNING' || container.state === 'STOPPING'}
      detailed={detailed}
      inProgress={container.actionInProgress && container.state === 'STARTING'}
      icon={faPlay}/>
    <ListItemButtonIcon
      title="Stop Container"
      onClick={stopContainer}
      menu={true}
      hidden={!(container.state === 'RUNNING' || container.state === 'STOPPING')}
      detailed={detailed}
      inProgress={container.actionInProgress && container.state === 'STOPPING'}
      icon={faStop} />
    <ListItemButtonIcon
      title="Delete Container"
      onClick={(): void => withConfirmation(deleteContainer, `delete container ${container.name}`, { title: 'Delete Container?', variant: 'delete' })}
      menu={true}
      icon={faTrash}
      detailed={detailed}
      inProgress={container.actionInProgress && container.state === 'DELETING'} />
  {/if}
  {#if !detailed}
    <ListItemButtonIcon
      title="Open Logs"
      onClick={openLogs}
      menu={asMenu}
      detailed={false}
      icon={faAlignLeft} />
    <ListItemButtonIcon
      title="Generate Kube"
      onClick={openGenerateKube}
      menu={asMenu}
      hidden={!(container.engineType === 'podman' && container.groupInfo.type === ContainerGroupInfoTypeUI.STANDALONE)}
      detailed={detailed}
      icon={faFileCode} />
  {/if}
  <ListItemButtonIcon
    title="Deploy to Kubernetes"
    onClick={deployToKubernetes}
    menu={asMenu}
    hidden={!(container.engineType === 'podman' && container.groupInfo.type === ContainerGroupInfoTypeUI.STANDALONE)}
    detailed={detailed}
    icon={faRocket} />
  <ListItemButtonIcon
    title="Open Browser"
    tooltip={
      container.state === 'RUNNING' && container.hasPublicPort
        ? 'Open the published port in your browser'
        : 'Requires a running container with at least one published port'
    }
    onClick={openBrowser}
    menu={asMenu}
    enabled={container.state === 'RUNNING' && container.hasPublicPort}
    hidden={asMenu && container.state !== 'RUNNING'}
    detailed={detailed}
    icon={faExternalLinkSquareAlt} />
  {#if !detailed}
    <ListItemButtonIcon
      title="Open Terminal"
      onClick={openTerminalContainer}
      menu={asMenu}
      hidden={container.state !== 'RUNNING'}
      detailed={false}
      icon={faTerminal} />
  {/if}
  <ListItemButtonIcon
    title="Restart Container"
    onClick={restartContainer}
    menu={asMenu}
    detailed={detailed}
    icon={faArrowsRotate} />
  <ListItemButtonIcon
    title="Export Container"
    tooltip="Exports container's filesystem contents as a tar archive and saves it on the local machine"
    onClick={exportContainer}
    menu={asMenu}
    detailed={detailed}
    icon={faDownload} />
  <ContributionActions
    args={[container]}
    contextPrefix="containerItem"
    dropdownMenu={asMenu}
    contributions={contributions}
    detailed={detailed}
    onError={handleError}
    contextUI={globalContext} />
</svelte:component>

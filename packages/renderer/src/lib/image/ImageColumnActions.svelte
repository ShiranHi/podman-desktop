<script lang="ts">
import ImageActions from './ImageActions.svelte';
import type { ImageInfoUI } from './ImageInfoUI';
import ManifestActions from './ManifestActions.svelte';
import PushImageModal from './PushImageModal.svelte';
import PushManifestModal from './PushManifestModal.svelte';
import RenameImageModal from './RenameImageModal.svelte';

interface Props {
  object: ImageInfoUI;
  menuOnly?: boolean;
  onUpdate?: (image: ImageInfoUI) => void;
}

let { object, menuOnly = false, onUpdate }: Props = $props();

function forwardUpdate(event: { detail: ImageInfoUI }): void {
  onUpdate?.(event.detail);
}

let pushImageModal = $state(false);
let pushImageModalImageInfo: ImageInfoUI | undefined = $state(undefined);
function handlePushImageModal(imageInfo: ImageInfoUI): void {
  pushImageModalImageInfo = imageInfo;
  pushImageModal = true;
}

let renameImageModal = $state(false);
let renameImageModalImageInfo: ImageInfoUI | undefined = $state(undefined);
function handleRenameImageModal(imageInfo: ImageInfoUI): void {
  renameImageModalImageInfo = imageInfo;
  renameImageModal = true;
}

let pushManifestModal = $state(false);
let pushManifestModalInfo: ImageInfoUI | undefined = $state(undefined);
function handlePushManifestModal(imageInfo: ImageInfoUI): void {
  pushManifestModalInfo = imageInfo;
  pushManifestModal = true;
}

function closeModals(): void {
  pushImageModal = false;
  renameImageModal = false;
  pushManifestModal = false;
}
</script>

<!-- There is no support for interacting with manifests yet, so do not show any manifest-related-image-actions. -->

{#if object.isManifest}
  <ManifestActions
    manifest={object}
    onPushManifest={handlePushManifestModal}
    dropdownMenu={true}
    menuOnly={menuOnly}
    on:update={forwardUpdate} />

  {#if pushManifestModal && pushManifestModalInfo}
    <PushManifestModal
      manifestInfoToPush={pushManifestModalInfo}
      closeCallback={closeModals} />
  {/if}
{:else}
  <ImageActions
    image={object}
    onPushImage={handlePushImageModal}
    onRenameImage={handleRenameImageModal}
    dropdownMenu={true}
    menuOnly={menuOnly}
    on:update={forwardUpdate} />

  {#if pushImageModal && pushImageModalImageInfo}
    <PushImageModal
      imageInfoToPush={pushImageModalImageInfo}
      closeCallback={closeModals} />
  {/if}
  {#if renameImageModal && renameImageModalImageInfo}
    <RenameImageModal
      imageInfoToRename={renameImageModalImageInfo}
      closeCallback={closeModals} />
  {/if}
{/if}

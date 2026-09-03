<!--**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************-->
<script lang="ts">
import { faArrowUpRightFromSquare, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@podman-desktop/ui-svelte';

interface Props {
  url: string;
  title: string;
}

let { url, title }: Props = $props();
let reloadKey = $state(0);

function reload(): void {
  reloadKey += 1;
}

function openExternal(): void {
  window.openExternal(url).catch((err: unknown) => console.error(`Error opening URL ${url}`, err));
}
</script>

<div class="flex flex-col h-full min-h-0 bg-[var(--pd-content-bg)]">
  <div class="flex items-center gap-2 px-3 py-2 border-b border-[var(--pd-content-divider)]">
    <span class="grow min-w-0 truncate rounded bg-[var(--pd-content-card-bg)] px-3 py-1.5 font-mono text-xs" title={url}>
      {url}
    </span>
    <Button type="secondary" title="Reload preview" icon={faRotateRight} on:click={reload}></Button>
    <Button type="secondary" title="Open in browser" icon={faArrowUpRightFromSquare} on:click={openExternal}>
      Browser
    </Button>
  </div>
  {#key reloadKey}
    <iframe class="grow min-h-0 w-full border-0 bg-white" src={url} title="{title} running app preview"></iframe>
  {/key}
</div>

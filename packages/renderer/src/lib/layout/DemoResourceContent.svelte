<script lang="ts">
import MonacoEditor from '/@/lib/editor/MonacoEditor.svelte';

interface Props {
  content: string;
  language?: string;
}
let { content, language = 'json' }: Props = $props();
</script>
<div class="h-full min-h-0 flex flex-col">
  <div class="grow min-h-0"><MonacoEditor {content} {language} readOnly /></div>
</div>

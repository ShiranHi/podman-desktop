<script lang="ts">
import logo from './red-hat-desktop-logo.svg';
import reverseLogo from './red-hat-desktop-logo-reverse.svg';

interface Props {
  compact?: boolean;
  white?: boolean;
}

let { compact = false, white = false }: Props = $props();
</script>

<span class="inline-flex shrink-0 items-center rounded {white ? '' : 'bg-white'} {compact ? 'h-5 px-1' : 'p-2'}">
  <img src={white ? reverseLogo : logo} class="{compact ? 'h-4 w-auto' : 'h-10 w-auto'}" alt="Red Hat Desktop" />
</span>

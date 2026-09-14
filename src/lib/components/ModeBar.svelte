<script lang="ts">
  import Icon from './Icon.svelte';
  import { MODES } from '$lib/practice.svelte';
  import type { Mode } from '$lib/progress.svelte';
  let { mode, onselect }: { mode: Mode; onselect: (m: Mode) => void } = $props();
</script>

<div class="modes card">
  {#each MODES as m (m.id)}
    <button class={{ on: mode === m.id }} onclick={() => onselect(m.id)}
      ><Icon name={m.icon} size={20} /> {m.label}</button
    >
  {/each}
</div>

<style>
  .modes {
    display: flex;
    padding: 4px;
  }
  button {
    flex: 1;
    padding: 10px;
    border-radius: 16px;
    font-weight: bold;
    color: var(--sub);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .on {
    background: var(--teal);
    color: #fff;
  }
</style>

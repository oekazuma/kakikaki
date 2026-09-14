<script lang="ts">
  import BackButton from './BackButton.svelte';
  import { LEVEL_NAME, type Level } from '$lib/quiz';
  let { title, level, i, total }: { title: string; level: Level; i: number; total: number } = $props();
</script>

<header>
  <BackButton />
  <h1>{title} <small>{LEVEL_NAME[level]}</small></h1>
  <span class="prog">{Math.min(i + 1, total)} / {total}</span>
</header>

<style>
  header {
    grid-column: 1 / -1;
    display: flex;
    gap: 14px;
    align-items: center;
  }
  h1 {
    margin: 0;
    font-size: 22px;
    flex: 1;
  }
  small {
    font-size: 14px;
    color: var(--sub);
    margin-left: 6px;
  }
  .prog {
    font-weight: bold;
    color: var(--sub);
    background: #fff;
    padding: 8px 14px;
    border-radius: 14px;
  }
</style>

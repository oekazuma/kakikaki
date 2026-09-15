<script lang="ts">
  import { resolve } from '$app/paths';
  import { fade, scale } from 'svelte/transition';
  import BackButton from './BackButton.svelte';
  import { LEVEL_NAME, type Level } from '$lib/quiz';
  let { title, level, i, total, done }: { title: string; level: Level; i: number; total: number; done: boolean } =
    $props();
  // 2 問目からは、うっかり もどる を押しても進みが消えないように一度きく
  const guard = $derived(i > 0 && !done);
  let asking = $state(false);
</script>

<header>
  <BackButton onclick={guard ? () => (asking = true) : undefined} />
  <h1>{title} <span class="sub">{LEVEL_NAME[level]}</span></h1>
  <span class="prog">{Math.min(i + 1, total)} / {total}</span>
</header>

{#if asking}
  <div class="dim" transition:fade={{ duration: 150 }} role="presentation" onclick={() => (asking = false)}></div>
  <section class="card leave" transition:scale={{ duration: 200, start: 0.9 }}>
    <p>クイズの とちゅうだよ。<br />やめて もどる？</p>
    <div class="btns">
      <button class="stay" onclick={() => (asking = false)}>つづける</button>
      <a class="go" href={resolve('/')}>もどる</a>
    </div>
  </section>
{/if}

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
  .sub {
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
  .leave {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 440px;
    padding: 28px 30px;
    display: grid;
    gap: 20px;
    justify-items: center;
    z-index: 71;
  }
  .leave p {
    margin: 0;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    line-height: 1.5;
  }
  .btns {
    display: flex;
    gap: 14px;
  }
  .btns > * {
    padding: 14px 26px;
    border-radius: 16px;
    font-weight: bold;
    font-size: 19px;
    text-decoration: none;
  }
  .stay {
    background: var(--blue);
    color: #fff;
  }
  .go {
    background: var(--danger);
    color: #fff;
  }
</style>

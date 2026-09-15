<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import Avatar from '../Avatar.svelte';
  import Icon from '../Icon.svelte';
  import LangDetail from './LangDetail.svelte';
  import { LANGS } from '$lib/lang.svelte';
  import type { Profile } from '$lib/profiles.svelte';
  import { detailOf, streakOf } from '$lib/progress.svelte';
  // 1 人ぶんの詳細（3 ことば を縦に並べる）。保存値を直接読むので、開いている間の記録の変化は追わない
  let { p, onclose }: { p: Profile; onclose: () => void } = $props();
  const details = $derived(LANGS.map((l) => ({ l, d: detailOf(p.id, l) })));
  const streak = $derived(streakOf(p.id));
</script>

<div class="dim" transition:fade={{ duration: 150 }} role="presentation" onclick={onclose}></div>
<div class="card detail" transition:scale={{ duration: 200, start: 0.95 }} role="dialog" aria-labelledby="pd-title">
  <header>
    <Avatar avatar={p.avatar} size={48} />
    <h2 id="pd-title">{p.name}</h2>
    {#if streak > 0}<span class="streak">{streak} 日 連続で練習中</span>{/if}
    <button class="close" onclick={onclose} aria-label="閉じる"><Icon name="close" size={22} /></button>
  </header>
  <div class="body">
    {#each details as { l, d } (l)}
      <LangDetail {l} {d} />
    {/each}
  </div>
</div>

<style>
  .detail {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(760px, calc(100vw - 60px));
    max-height: calc(100vh - 60px);
    display: grid;
    grid-template-rows: auto 1fr;
    z-index: 71;
    font-size: 14px;
    line-height: 1.6;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #e6e9ed;
  }
  h2 {
    margin: 0;
    font-size: 22px;
    color: var(--ink);
  }
  .streak {
    color: var(--warn);
    font-weight: bold;
  }
  .close {
    margin-left: auto;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--pill);
    display: grid;
    place-content: center;
  }
  .body {
    overflow: auto;
    padding: 4px 20px 20px;
    display: grid;
    gap: 14px;
  }
</style>

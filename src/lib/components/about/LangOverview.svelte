<script lang="ts">
  import Ring from './Ring.svelte';
  import { info, type Lang } from '$lib/lang.svelte';
  import { TOTAL } from '$lib/badges';
  import type { Detail } from '$lib/progress.svelte';
  // 1 ことば の概要カード（リング + 数字）。押すと下の詳細がその ことば に切り替わる
  let { l, d, on, onselect }: { l: Lang; d: Detail; on: boolean; onselect: () => void } = $props();
  const total = $derived(TOTAL(l));
  const empty = $derived(d.chars + d.words + d.medals + d.days + Object.keys(d.quiz).length === 0);
  // {#if} の中を「· 王冠」で始めると、フラグメント先頭の空白が Svelte に刈られて「·王冠」とくっつくため文字列で組む
  const sub = $derived(
    `金の星 ${d.gold}${total.words ? ` · 王冠 ${d.crowns}` : ''} · メダル ${d.medals}/${d.medalTotal}`
  );
</script>

<button class={['card', 'lang', { on }]} onclick={onselect} aria-pressed={on}>
  <span class="name">{info(l).glyph} {info(l).short}</span>
  {#if empty}
    <span class="none">まだ記録がありません</span>
  {:else}
    <Ring chars={[d.chars, total.chars]} words={total.words ? [d.words, total.words] : undefined} />
    <span
      ><span class="c">●</span> 文字 {d.chars}/{total.chars}
      {#if total.words}<span class="w">●</span> 単語 {d.words}/{total.words}{/if}</span
    >
    <span class="sub">{sub}</span>
  {/if}
</button>

<style>
  .lang {
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 12px 10px;
    text-align: center;
    border: 3px solid transparent;
    transition: border-color 0.2s;
  }
  .lang.on {
    border-color: var(--blue);
  }
  .name {
    margin-bottom: 4px;
    font-size: 16px;
    font-weight: bold;
    color: var(--ink);
  }
  .lang > span {
    font-size: 13px;
  }
  .name {
    font-size: 16px;
  }
  .c {
    color: var(--blue);
  }
  .w {
    color: var(--teal);
  }
  .sub,
  .none {
    color: var(--sub);
  }
  .none {
    padding: 40px 0;
  }
</style>

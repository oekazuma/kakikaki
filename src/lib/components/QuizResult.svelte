<script lang="ts">
  import { resolve } from '$app/paths';
  import { fly } from 'svelte/transition';
  import Stars from './Stars.svelte';
  import { levelName, levelsOf, type Kind, type Level } from '$lib/quiz';
  import { lang } from '$lib/lang.svelte';
  // 次の級があればそちらを主ボタンにする（クリア後は もういちど より次へ進みたくなるため）
  let {
    correct,
    total,
    kind,
    level,
    onRetry
  }: { correct: number; total: number; kind: Kind; level: Level; onRetry: () => void } = $props();
  const next = $derived(level < levelsOf(lang.v).length ? ((level + 1) as Level) : null);
  const stars = $derived(correct === total ? 3 : correct >= total * 0.7 ? 2 : 1);
  const msg = $derived(
    correct === total
      ? 'ぜんもん せいかい！ すごい！'
      : correct >= total * 0.7
        ? 'じょうず！'
        : 'また ちょうせん してね！'
  );
</script>

<div class="result card" in:fly={{ y: 40, duration: 350 }}>
  <div class="score">{total} もん中 <b>{correct}</b> もん せいかい</div>
  <Stars n={3} k={stars} size={56} />
  <p>{msg}</p>
  <div class="btns">
    {#if next}
      <a class="main" href="{resolve(`/quiz/${kind}`)}?level={next}">つぎは {levelName(next, lang.v)}</a>
    {/if}
    <button class={next ? 'sub' : 'main'} onclick={onRetry}>もういちど</button>
    <a class="sub" href={resolve('/quiz')}>クイズを えらぶ</a>
  </div>
</div>

<style>
  .result {
    position: fixed;
    inset: 0;
    margin: auto;
    width: 520px;
    height: 340px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 10px;
    z-index: 80;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  }
  .score {
    font-size: 24px;
    font-weight: bold;
  }
  .score b {
    font-size: 40px;
    color: var(--blue);
  }
  p {
    margin: 0;
    font-size: 20px;
    font-weight: bold;
  }
  .btns {
    display: flex;
    gap: 14px;
    margin-top: 8px;
  }
  .main,
  .sub {
    padding: 12px 22px;
    border-radius: 16px;
    font-weight: bold;
    font-size: 18px;
    text-decoration: none;
  }
  .main {
    background: var(--blue);
    color: #fff;
  }
  .sub {
    background: var(--pill);
    color: var(--ink);
  }
</style>

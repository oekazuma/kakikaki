<script lang="ts">
  import { resolve } from '$app/paths';
  import { fly } from 'svelte/transition';
  import Stars from './Stars.svelte';
  let { correct, total, onRetry }: { correct: number; total: number; onRetry: () => void } = $props();
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
    <button class="retry" onclick={onRetry}>もういちど</button>
    <a class="home" href={resolve('/quiz')}>クイズを えらぶ</a>
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
  .retry,
  .home {
    padding: 12px 22px;
    border-radius: 16px;
    font-weight: bold;
    font-size: 18px;
    text-decoration: none;
  }
  .retry {
    background: var(--blue);
    color: #fff;
  }
  .home {
    background: #eef1f4;
    color: var(--ink);
  }
</style>

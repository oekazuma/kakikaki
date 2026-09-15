<script lang="ts">
  import { imageUrl } from '$lib/image';
  import { WORDS } from '$lib/words';
  import { flipFor } from '$lib/facing';
  // スプラッシュのおまけ: 5 回に 1 回くらい、どうぶつ のイラストが画面の下を右から左へ走り抜ける
  // 虫は走らせない（気持ち悪いと言われたため）
  const BUGS = new Set(['ant', 'beetle', 'bee', 'ladybug', 'butterfly', 'snail']);
  const ANIMALS = WORDS.filter((w) => w.category === 'どうぶつ' && !BUGS.has(w.id));
  const runner = Math.random() < 1 / 5 ? ANIMALS[Math.floor(Math.random() * ANIMALS.length)] : null;
</script>

{#if runner}
  <div class="run">
    <img
      src={imageUrl(runner)}
      alt=""
      width="200"
      height="140"
      loading="eager"
      style:scale={flipFor(runner.id, 'left') ? '-1 1' : '1 1'}
    />
  </div>
{/if}

<style>
  .run {
    position: fixed;
    right: -220px;
    bottom: 6vh;
    animation: run 1.25s linear 0.15s both;
    pointer-events: none;
  }
  img {
    display: block;
    height: 140px;
    width: auto;
    animation: bob 0.22s ease-in-out infinite alternate;
  }
  @keyframes run {
    to {
      transform: translateX(calc(-100vw - 240px));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .run {
      display: none;
    }
  }
  @keyframes bob {
    from {
      transform: translateY(0) rotate(-4deg);
    }
    to {
      transform: translateY(-16px) rotate(4deg);
    }
  }
</style>

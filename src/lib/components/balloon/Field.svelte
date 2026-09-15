<script lang="ts">
  import type { Balloon } from '$lib/balloon.svelte';
  // 風船の描画。位置は画面の割合、タップで onpop
  let { balloons, onpop }: { balloons: Balloon[]; onpop: (b: Balloon, e: PointerEvent) => void } = $props();
</script>

<div class="field">
  {#each balloons as b (b.id)}
    <button
      class="balloon"
      style:translate="calc({b.x * 100}cqw - 50%) {b.y * 100}cqh"
      style:--size="{b.size}px"
      style:--c={b.color}
      onpointerdown={(e) => onpop(b, e)}
      aria-label="ふうせん"
    >
      <span class="body"></span>
      <span class="knot"></span>
      <span class="string"></span>
    </button>
  {/each}
</div>

<style>
  .field {
    position: absolute;
    inset: 0;
    overflow: hidden;
    touch-action: none;
    container-type: size; /* translate の cqw/cqh を left/top の % の代わりに使うため */
  }
  .balloon {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--size);
    height: calc(var(--size) * 1.6);
    /* 毎フレームの位置更新は left/top ではなく translate（transform とは別プロパティで、
       sway の transform: rotate アニメーションと干渉しない）で行い、レイアウトの再計算を避ける */
    will-change: translate;
    display: grid;
    justify-items: center;
    align-content: start;
    background: none;
    touch-action: none;
    animation: sway 1.6s ease-in-out infinite alternate;
  }
  .body {
    width: var(--size);
    height: calc(var(--size) * 1.18);
    background: radial-gradient(circle at 32% 28%, #fff9 0 14%, transparent 15%), var(--c);
    border-radius: 50% 50% 50% 50% / 42% 42% 58% 58%;
  }
  .knot {
    width: 0;
    height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-bottom: 10px solid var(--c);
    margin-top: -4px;
  }
  .string {
    width: 2px;
    height: calc(var(--size) * 0.35);
    background: #9e9e9e;
  }
  @keyframes sway {
    from {
      transform: rotate(-5deg);
    }
    to {
      transform: rotate(5deg);
    }
  }
</style>

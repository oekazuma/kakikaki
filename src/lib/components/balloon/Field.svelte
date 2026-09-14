<script lang="ts">
  import type { Balloon } from '$lib/balloon.svelte';
  // 風船の描画。位置は画面の割合、タップで onpop
  let { balloons, onpop }: { balloons: Balloon[]; onpop: (b: Balloon, e: PointerEvent) => void } = $props();
</script>

<div class="field">
  {#each balloons as b (b.id)}
    <button
      class="balloon"
      style:left="{b.x * 100}%"
      style:top="{b.y * 100}%"
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
  }
  .balloon {
    position: absolute;
    width: var(--size);
    height: calc(var(--size) * 1.6);
    transform: translate(-50%, 0);
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
      transform: translate(-50%, 0) rotate(-5deg);
    }
    to {
      transform: translate(-50%, 0) rotate(5deg);
    }
  }
</style>

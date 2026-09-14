<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { fx } from '$lib/fx';
  import { sfx, unlock } from '$lib/audio';
  import { COLORS } from '$lib/balloon.svelte';
  // かくしゲームの入口。10 回タップで風船がふくらんで割れ、ゲームへ
  const TAPS = 10;
  let taps = $state(0);
  let popping = $state(false);
  function tap(e: MouseEvent) {
    unlock();
    if (popping) return;
    taps++;
    sfx.pon();
    if (taps < TAPS) return;
    popping = true;
    fx.burst(e.clientX, e.clientY, 40, COLORS);
    setTimeout(() => goto(resolve('/balloon')), 350);
  }
</script>

<button class={['egg', { popping }]} style:--s={1 + taps * 0.12} onclick={tap} aria-label="ふうせん" data-taps={taps}>
  <svg viewBox="0 0 40 56" width="40" height="56" aria-hidden="true">
    <path d="M20 2C10 2 4 10 4 20c0 9 8 17 14 21l-2 4h8l-2-4c6-4 14-12 14-21C36 10 30 2 20 2z" fill="#ec407a" />
    <ellipse cx="13" cy="14" rx="4" ry="6" fill="#fff" opacity="0.5" />
    <path d="M20 45c0 4-4 5-2 10" fill="none" stroke="#9e9e9e" stroke-width="1.5" />
  </svg>
</button>

<style>
  .egg {
    position: fixed;
    right: 18px;
    bottom: 14px;
    opacity: 0.45;
    transform: scale(var(--s));
    transform-origin: bottom center;
    transition:
      transform 0.15s cubic-bezier(0.34, 1.6, 0.64, 1),
      opacity 0.2s;
    z-index: 5;
  }
  .egg:hover,
  .egg:active {
    opacity: 1;
  }
  .popping {
    transform: scale(0);
    opacity: 0;
    transition: transform 0.15s ease-in;
  }
</style>

<script lang="ts">
  import { fx } from '$lib/fx';
  import Icon from '$lib/components/Icon.svelte';
  import { lang } from '$lib/lang.svelte';
  let { children } = $props();
  $effect(() => {
    document.documentElement.dataset.lang = lang.v;
  });

  // 練習画面（左 240 + 書き取り面 + 右 120）が操作できる最小サイズ。iPad 横向きはすべて満たす
  const MIN_W = 900;
  const MIN_H = 520;
  let w = $state(0);
  let h = $state(0);
  const tooSmall = $derived(w > 0 && (w < MIN_W || h < MIN_H));
  const portrait = $derived(h > w);
</script>

<svelte:window bind:innerWidth={w} bind:innerHeight={h} />

<canvas class="fx" {@attach (c) => fx.mount(c)}></canvas>
{@render children()}
{#if tooSmall}
  <div class="guard card">
    {#if portrait}
      <!-- タブレットが縦から横へ回るアニメーション -->
      <svg class="tablet" viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
        <g class="spin">
          <rect x="35" y="15" width="50" height="90" rx="8" fill="#fff" stroke="var(--blue)" stroke-width="5" />
          <rect x="41" y="25" width="38" height="66" rx="3" fill="#dfe7f0" />
          <circle cx="60" cy="99" r="2.5" fill="var(--blue)" />
        </g>
        <path
          class="arrow"
          d="M96 40 A40 40 0 0 1 96 80"
          fill="none"
          stroke="var(--star)"
          stroke-width="5"
          stroke-linecap="round"
        />
        <path
          class="arrow"
          d="M90 74 L97 82 L105 75"
          fill="none"
          stroke="var(--star)"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <p>タブレットを よこむきに してね</p>
    {:else}
      <div class="icon"><Icon name="help" size={80} /></div>
      <p>がめんを もっと おおきく してね</p>
    {/if}
    <small>
      推奨: 横向きのタブレット、または {MIN_W}×{MIN_H}px 以上のブラウザ画面<br />
      いまの画面: {w}×{h}px
    </small>
  </div>
{/if}

<style>
  .fx {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 50;
  }
  .guard {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-content: center;
    gap: 8px;
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    background: var(--bg);
    padding: 24px;
  }
  .guard p {
    margin: 0;
  }
  .icon {
    color: var(--blue);
  }
  .tablet {
    margin: 0 auto;
  }
  .spin {
    transform-box: fill-box;
    transform-origin: center;
    animation: turn 2.4s ease-in-out infinite;
  }
  .arrow {
    animation: blink 2.4s ease-in-out infinite;
  }
  @keyframes turn {
    0%,
    25% {
      transform: rotate(0deg);
    }
    55%,
    85% {
      transform: rotate(90deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
  @keyframes blink {
    0%,
    25% {
      opacity: 1;
    }
    55%,
    100% {
      opacity: 0;
    }
  }
  small {
    font-size: 14px;
    font-weight: normal;
    color: var(--sub);
    line-height: 1.7;
  }
</style>

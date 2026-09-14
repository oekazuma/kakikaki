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
      <svg class="tablet" viewBox="0 0 140 160" width="150" height="171" aria-hidden="true">
        <g class="spin">
          <rect x="38" y="42" width="64" height="96" rx="7" fill="#fff" stroke="var(--blue)" stroke-width="5" />
          <rect x="44" y="50" width="52" height="80" rx="2" fill="#dfe7f0" />
          <circle cx="70" cy="46.5" r="1.6" fill="var(--blue)" />
        </g>
        <!-- 反時計回りの矢印 -->
        <g
          class="arrow"
          fill="none"
          stroke="var(--star)"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M24 66 A48 48 0 0 0 24 114" />
          <path d="M31 107 L23 115 L15 107" />
        </g>
        <!-- タブレットの真上: 縦は ✕、横は ✓ -->
        <g class="ng">
          <circle cx="70" cy="18" r="15" fill="#e53935" />
          <path d="M64 12 L76 24 M76 12 L64 24" stroke="#fff" stroke-width="4" stroke-linecap="round" />
        </g>
        <g class="ok">
          <circle cx="70" cy="18" r="15" fill="#43a047" />
          <path
            d="M62 18 L68 24 L79 12"
            fill="none"
            stroke="#fff"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
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
    animation: turn 4.5s ease-in-out infinite;
  }
  .arrow {
    animation: blink 4.5s ease-in-out infinite;
  }
  .ng {
    animation: blink 4.5s ease-in-out infinite;
  }
  .ok {
    animation: blink 4.5s ease-in-out infinite reverse;
  }
  @keyframes turn {
    0%,
    25% {
      transform: rotate(0deg);
    }
    55%,
    85% {
      transform: rotate(-90deg);
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
    85% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  small {
    font-size: 14px;
    font-weight: normal;
    color: var(--sub);
    line-height: 1.7;
  }
</style>

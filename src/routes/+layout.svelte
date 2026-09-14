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
    <div class="icon"><Icon name={portrait ? 'rotate' : 'help'} size={80} /></div>
    <p>{portrait ? 'よこむきに してね' : 'がめんを もっと おおきく してね'}</p>
    <small>
      推奨: 横向きの iPad、または {MIN_W}×{MIN_H}px 以上のブラウザ画面<br />
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
  small {
    font-size: 14px;
    font-weight: normal;
    color: var(--sub);
    line-height: 1.7;
  }
</style>

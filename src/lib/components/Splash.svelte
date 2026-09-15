<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { lang, info } from '$lib/lang.svelte';
  import { vp } from '$lib/viewport.svelte';
  // 起動画面。見栄えのために出す（最短 1 秒）。あわせて、iPad のホーム画面アプリが起動直後に縦向きの座標系で
  // 一度描かれてから横向きに組み替わるのを隠す: 画面サイズが 200ms 変わらなくなり、フォントが読めたら消す（最長約 2.5 秒）。
  // 背景は画面より大きく取り、ずれて描かれても縁が見えないようにする
  let show = $state(true);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function settled() {
    let last = '';
    let stable = 0;
    for (let t = 0; t < 2500 && stable < 200; t += 100) {
      const now = `${vp.w}x${vp.h}x${vp.portrait}`;
      stable = now === last ? stable + 100 : 0;
      last = now;
      await sleep(100);
    }
  }
  onMount(async () => {
    const start = Date.now();
    await Promise.all([Promise.race([document.fonts?.ready, sleep(1500)]), settled()]);
    await sleep(Math.max(0, 1000 - (Date.now() - start)));
    show = false;
  });
</script>

{#if show}
  <div class="splash" out:fade={{ duration: 300 }} role="presentation">
    <div class="logo">
      <img src="{base}/logo-mark{lang.v === 'ja' ? '' : `-${lang.v}`}.svg" alt="" width="120" height="120" />
      <b><span class="kaki">かきかき</span> <span class="hira">{info().short}</span></b>
    </div>
  </div>
{/if}

<style>
  .splash {
    position: fixed;
    inset: -50vmax;
    z-index: 110;
    background: var(--bg);
  }
  .logo {
    position: fixed;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 18px;
  }
  img {
    width: 120px;
    height: 120px;
    animation: pop 0.5s ease-out;
  }
  b {
    font-size: 30px;
  }
  .kaki {
    color: var(--blue);
  }
  .hira {
    color: var(--teal);
  }
  @keyframes pop {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
  }
</style>

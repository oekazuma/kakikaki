<script lang="ts">
  import { base } from '$app/paths';
  import { fade } from 'svelte/transition';
  import { lang, info } from '$lib/lang.svelte';
  import { vp } from '$lib/viewport.svelte';
  // 起動画面。iPad のホーム画面アプリは起動直後に縦向きサイズで一度描かれてから横向きに直るので、
  // 画面サイズが落ち着き、フォントが読めるまで（最短 350ms・最長 2.5 秒）ロゴで覆って組み替えを見せない
  let show = $state(true);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function settled() {
    let last = '';
    let stable = 0;
    for (let t = 0; t < 2000 && stable < 200; t += 100) {
      const now = `${vp.w}x${vp.h}`;
      stable = now === last ? stable + 100 : 0;
      last = now;
      await sleep(100);
    }
  }
  $effect(() => {
    const start = Date.now();
    Promise.all([Promise.race([document.fonts?.ready, sleep(1500)]), settled()]).then(async () => {
      await sleep(Math.max(0, 350 - (Date.now() - start)));
      show = false;
    });
  });
</script>

{#if show}
  <div class="splash" out:fade={{ duration: 250 }} role="presentation">
    <img src="{base}/logo-mark{lang.v === 'ja' ? '' : `-${lang.v}`}.svg" alt="" width="120" height="120" />
    <b><span class="kaki">かきかき</span> <span class="hira">{info().short}</span></b>
  </div>
{/if}

<style>
  .splash {
    position: fixed;
    inset: 0;
    z-index: 110;
    background: var(--bg);
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

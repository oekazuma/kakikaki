<script lang="ts">
  import { fade } from 'svelte/transition';
  import { vp, measure } from '$lib/viewport.svelte';
  // 起動直後の覆い。iPad のホーム画面アプリは起動直後に縦向きのままの座標系で描かれ、この覆い自体もずれて見えるため、
  // ロゴなどは置かず背景色だけにする（ずれても見分けがつかない）。ロゴ入りの起動画面は iOS が manifest の
  // アイコンと background_color から出すものに任せる。画面サイズが 200ms 変わらなくなり、フォントが読めたら消す
  let show = $state(true);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function settled() {
    let last = '';
    let stable = 0;
    for (let t = 0; t < 2500 && stable < 200; t += 100) {
      measure();
      const now = `${vp.w}x${vp.h}x${vp.portrait}`;
      stable = now === last ? stable + 100 : 0;
      last = now;
      await sleep(100);
    }
  }
  $effect(() => {
    const start = Date.now();
    Promise.all([Promise.race([document.fonts?.ready, sleep(1500)]), settled()]).then(async () => {
      await sleep(Math.max(0, 250 - (Date.now() - start)));
      show = false;
    });
  });
</script>

{#if show}
  <div class="splash" out:fade={{ duration: 300 }} role="presentation"></div>
{/if}

<style>
  .splash {
    position: fixed;
    inset: -50vmax;
    z-index: 110;
    background: var(--bg);
  }
</style>

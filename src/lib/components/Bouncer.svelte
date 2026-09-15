<script lang="ts">
  import { untrack } from 'svelte';
  import { imageUrl } from '$lib/image';
  import { Bouncer, SIZE } from '$lib/bouncer.svelte';
  import { vp } from '$lib/viewport.svelte';
  import { sfx, unlock } from '$lib/audio';
  import { fx } from '$lib/fx';
  import type { Word } from '$lib/words';
  // かくし演出: イラストがカード（from の中心）から跳び出して走り、タップすると弾かれて飛び回る。
  // 出ている間は透明な覆いで他の操作を止める（もどる だけは覆いより上に置いてある）
  let { word, from, onend }: { word: Word; from: { x: number; y: number }; onend: () => void } = $props();
  const b = new Bouncer(
    untrack(() => vp.w),
    untrack(() => vp.h),
    untrack(() => from)
  );
  $effect(() => b.resize(vp.w, vp.h));
  $effect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      b.tick(Math.min(0.05, (t - last) / 1000));
      last = t;
      if (b.phase === 'done') return onend();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
  function kick(e: PointerEvent) {
    unlock();
    b.kick();
    sfx.pon();
    fx.burst(e.clientX, e.clientY, 18);
  }
</script>

<div class="shield" role="presentation"></div>
<img
  class="bouncer"
  src={imageUrl(word)}
  alt=""
  width={SIZE}
  height={SIZE}
  draggable="false"
  style:transform="translate({b.x}px, {b.y}px) rotate({b.rot}deg)"
  onpointerdown={kick}
  onerror={onend}
/>

<style>
  .shield {
    position: fixed;
    inset: 0;
    z-index: 59;
    touch-action: none;
  }
  .bouncer {
    position: fixed;
    left: 0;
    top: 0;
    width: 160px;
    height: 160px;
    object-fit: contain;
    z-index: 60;
    cursor: pointer;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
    will-change: transform;
  }
</style>

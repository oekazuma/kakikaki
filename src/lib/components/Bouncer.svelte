<script lang="ts">
  import { untrack } from 'svelte';
  import { imageUrl } from '$lib/image';
  import { Bouncer, SIZE, GOAL, type EggStyle } from '$lib/bouncer.svelte';
  import { vp } from '$lib/viewport.svelte';
  import { sfx, unlock } from '$lib/audio';
  import { fx } from '$lib/fx';
  import { flipFor } from '$lib/facing';
  import { lettersOf, strokesOf } from '$lib/lang.svelte';
  import { pathToPoints } from '$lib/geometry';
  import { profiles } from '$lib/profiles.svelte';
  import { recordEgg, recordPinball } from '$lib/secret';
  import type { Word } from '$lib/words';
  // かくし演出: イラストがカード（from の中心）から跳び出し、単語の頭文字を書き順どおりに走って書いてから戻る。
  // 走っている間にタップすると弾かれて飛び回る。出るたびに「頭文字を書く」と「壁で折り返して足あとを残して歩いて帰る」を半々で選ぶ。
  // 左右反転は transform の最後に入れる（scale プロパティだと translate ごと反転して画面外へ出る）
  // 出ている間は透明な覆いで他の操作を止める（もどる だけは覆いより上に置いてある）
  let { word, from, onend }: { word: Word; from: { x: number; y: number }; onend: () => void } = $props();
  const letter = untrack(() => (strokesOf()[lettersOf(word)[0]] ?? []).map((d) => pathToPoints(d)));
  const b = new Bouncer(
    untrack(() => vp.w),
    untrack(() => vp.h),
    untrack(() => from),
    Math.random,
    letter,
    (Math.random() < 0.5 ? 'write' : 'walk') as EggStyle
  );
  $effect(() => b.resize(vp.w, vp.h));
  let celebrated = false;
  let written = false;
  $effect(() => {
    untrack(() => recordEgg(profiles.cur));
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      b.tick(Math.min(0.05, (t - last) / 1000));
      last = t;
      // 文字を書き終えて帰り始めた瞬間に、跡に沿ってキラキラ
      if (b.phase === 'home' && b.trails.length && !written) {
        written = true;
        sfx.kira();
        for (const tr of b.trails) for (const p of tr.filter((_, k) => k % 8 === 0)) fx.burst(p.x, p.y, 3);
      }
      if (b.hits >= GOAL && !celebrated) {
        celebrated = true;
        fx.confetti(300);
        sfx.fanfare();
      }
      if (b.phase === 'done') {
        recordPinball(profiles.cur, b.hits);
        return onend();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // もどる で離脱しても壁当て回数は残す（recordPinball は Math.max なので冪等）
    return () => {
      cancelAnimationFrame(raf);
      recordPinball(profiles.cur, b.hits);
    };
  });
  function kick(e: PointerEvent) {
    unlock();
    b.kick();
    sfx.pon();
    fx.burst(e.clientX, e.clientY, 18);
  }
</script>

<div class="shield" role="presentation"></div>
{#if b.trails.length || b.steps.length}
  <svg class="trail" aria-hidden="true">
    {#each b.trails as tr (tr)}
      <polyline points={tr.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} />
    {/each}
    {#each b.steps as p (p)}
      <ellipse cx={p.x} cy={p.y} rx="9" ry="6" class="step" />
    {/each}
  </svg>
{/if}
{#if b.phase === 'pinball'}
  <div class={['count', { goal: b.hits >= GOAL }]}>
    {#key b.hits}<b>{b.hits}</b>{/key}
    <small>{b.hits >= GOAL ? 'すごい！' : 'かい'}</small>
  </div>
{/if}
<img
  class="bouncer"
  src={imageUrl(word)}
  alt=""
  width={SIZE}
  height={SIZE}
  draggable="false"
  style:transform="translate({b.x}px, {b.y}px) rotate({b.rot}deg) scale({flipFor(word.id, b.right ? 'right' : 'left')
    ? -1
    : 1}, 1)"
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
  .trail {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 60;
    pointer-events: none;
  }
  .step {
    fill: var(--sub);
    opacity: 0.35;
  }
  .trail polyline {
    fill: none;
    stroke: var(--blue);
    stroke-width: 14;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.85;
  }
  .count {
    position: fixed;
    left: 50%;
    top: calc(var(--sat) + 16px);
    transform: translateX(-50%);
    z-index: 60;
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 22px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.85);
    color: var(--blue);
    font-weight: bold;
    pointer-events: none;
  }
  .count b {
    display: inline-block;
    font-size: 44px;
    line-height: 1;
    animation: bump 0.25s ease-out;
  }
  .count small {
    font-size: 18px;
  }
  .count.goal {
    color: var(--warn);
  }
  @keyframes bump {
    from {
      transform: scale(1.6);
    }
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

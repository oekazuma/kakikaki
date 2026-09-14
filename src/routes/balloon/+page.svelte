<script lang="ts">
  import { untrack } from 'svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import Field from '$lib/components/balloon/Field.svelte';
  import Ranking from '$lib/components/balloon/Ranking.svelte';
  import { BalloonGame, MISS_MAX, saveScore, loadBests, type Balloon } from '$lib/balloon.svelte';
  import { profiles } from '$lib/profiles.svelte';
  import { today } from '$lib/progress.svelte';
  import { info } from '$lib/lang.svelte';
  import { fx } from '$lib/fx';
  import { sfx, unlock } from '$lib/audio';

  // かくしゲーム。プロフィール画面の風船を 10 回タップすると来る
  const g = untrack(() => new BalloonGame());
  let isBest = $state(false);
  let settled = false; // 終了処理は 1 回だけ（自己ベスト未更新でも毎フレーム走らせない）
  let floater = $state<{ x: number; y: number; pts: number; id: number } | null>(null);
  let best = $state(loadBests()[profiles.cur]?.score ?? 0);

  function start() {
    isBest = false;
    settled = false;
    g.start();
  }
  $effect(() => {
    start();
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      g.tick(Math.min(0.05, (t - last) / 1000));
      last = t;
      if (g.over && !settled) finish();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
  function finish() {
    settled = true;
    isBest = saveScore(profiles.cur, g.score, today());
    if (isBest) {
      best = g.score;
      fx.confetti(200);
      sfx.fanfare();
    }
  }
  function pop(b: Balloon, e: PointerEvent) {
    unlock();
    const pts = g.pop(b.id);
    if (!pts) return;
    sfx.pon();
    fx.burst(e.clientX, e.clientY, 22, [b.color, '#fff']);
    floater = { x: e.clientX, y: e.clientY, pts, id: b.id };
    setTimeout(() => (floater = null), 600);
  }
</script>

<svelte:head>
  <title>ふうせん ぽん | {info().title}</title>
  <meta name="description" content="かくしゲーム。上がってくる風船をタップして割ろう。" />
</svelte:head>

<main>
  <header>
    <BackButton />
    <h1>ふうせん ぽん</h1>
    <div class="hud">
      <span class="score">{g.score} <small>てん</small></span>
      {#if g.combo >= 2}<span class="combo">{g.combo} コンボ！</span>{/if}
      {#if g.level > 0}{#key g.level}<span class="level">レベル {g.level}</span>{/key}{/if}
      <span class="lives" role="img" aria-label="のこり {MISS_MAX - g.misses}">
        {#each Array.from({ length: MISS_MAX }, (_, i) => i) as i (i)}
          <span class={{ lost: i < g.misses }}><Icon name="heart" size={26} fill /></span>
        {/each}
      </span>
      <span class="best">ベスト {best}</span>
    </div>
  </header>
  <Field balloons={g.balloons} onpop={pop} />
  {#if floater}
    {#key floater.id}<span class="pts" style:left="{floater.x}px" style:top="{floater.y}px">+{floater.pts}</span>{/key}
  {/if}
  {#if g.over}
    <Ranking score={g.score} combo={g.maxCombo} {isBest} onretry={start} onback={() => history.back()} />
  {/if}
</main>

<style>
  main {
    position: relative;
    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
    overflow: hidden;
    background: linear-gradient(#dff1ff, #f4f5f0 70%);
    -webkit-user-select: none;
    user-select: none;
  }
  header {
    position: relative;
    z-index: 2;
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 16px 22px;
  }
  h1 {
    margin: 0;
    font-size: 22px;
    flex: 1;
  }
  .hud {
    display: flex;
    align-items: center;
    gap: 16px;
    font-weight: bold;
  }
  .score {
    font-size: 30px;
    color: var(--ink);
  }
  .score small {
    font-size: 14px;
    color: var(--sub);
  }
  .combo {
    color: #e08a00;
    font-size: 20px;
    animation: pop 0.3s;
  }
  .level {
    color: #fff;
    background: #e53935;
    padding: 4px 10px;
    border-radius: 10px;
    font-size: 15px;
    animation: pop 0.4s;
  }
  .lives {
    display: flex;
    gap: 2px;
    color: #e53935;
  }
  .lives .lost {
    color: #d5d9de;
  }
  .best {
    font-size: 14px;
    color: var(--sub);
    background: #fff;
    padding: 6px 12px;
    border-radius: 12px;
  }
  .pts {
    position: fixed;
    transform: translate(-50%, -100%);
    font-size: 30px;
    font-weight: bold;
    color: #e08a00;
    pointer-events: none;
    animation: rise 0.6s ease-out forwards;
    z-index: 2;
  }
  @keyframes rise {
    to {
      transform: translate(-50%, -220%);
      opacity: 0;
    }
  }
  @keyframes pop {
    50% {
      transform: scale(1.2);
    }
  }
</style>

<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import SplashRunner from './SplashRunner.svelte';
  import { lang, info } from '$lib/lang.svelte';
  import { vp } from '$lib/viewport.svelte';
  // 起動画面。見栄えのために出す（最短 1.3 秒。ロゴが跳ねて、文字が 1 つずつ飛び出し、星が瞬き、線が引かれる演出が終わる長さ）。
  // あわせて、iPad のホーム画面アプリが起動直後に縦向きの座標系で一度描かれてから横向きに組み替わるのを隠す:
  // 画面サイズが 200ms 変わらなくなり、フォントが読めたら消す（最長約 2.5 秒）。
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
    await sleep(Math.max(0, 1300 - (Date.now() - start)));
    show = false;
  });
  // ロゴのまわりで瞬く星: 位置（ロゴ中心からの px）・大きさ・色・出るタイミング
  const STARS = [
    { x: -96, y: -70, s: 26, c: 'var(--star)', t: 0.45 },
    { x: 92, y: -84, s: 20, c: 'var(--teal)', t: 0.6 },
    { x: 112, y: 10, s: 16, c: 'var(--star)', t: 0.75 },
    { x: -116, y: 24, s: 18, c: 'var(--blue)', t: 0.9 },
    { x: -44, y: -104, s: 22, c: 'var(--star)', t: 1.0 }
  ];
  const title = $derived([...'かきかき', ' ', ...info().short].map((ch, i) => ({ ch, i, id: `${i}${ch}` })));
</script>

{#if show}
  <div class="splash" out:fade={{ duration: 300 }} role="presentation">
    <SplashRunner />
    <div class="logo">
      <div class="mark">
        <img src="{base}/logo-mark{lang.v === 'ja' ? '' : `-${lang.v}`}.svg" alt="" width="120" height="120" />
        {#each STARS as st (st.t)}
          <span class="star" style:--x="{st.x}px" style:--y="{st.y}px" style:--t="{st.t}s" style:color={st.c}
            ><Icon name="star" size={st.s} fill /></span
          >
        {/each}
      </div>
      <b>
        {#each title as { ch, i, id } (id)}
          <span class={{ hira: i > 4 }} style:--i={i}>{ch === ' ' ? ' ' : ch}</span>
        {/each}
      </b>
      <svg class="line" viewBox="0 0 240 12" width="240" height="12" aria-hidden="true">
        <path
          d="M4 8c40-6 80-6 118-2s78 4 114-2"
          fill="none"
          stroke="var(--star)"
          stroke-width="5"
          stroke-linecap="round"
          pathLength="1"
        />
      </svg>
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
    gap: 14px;
  }
  .mark {
    position: relative;
  }
  img {
    display: block;
    width: 120px;
    height: 120px;
    border-radius: 26px;
    animation:
      pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both,
      wobble 1.6s ease-in-out 0.7s infinite;
  }
  .star {
    position: absolute;
    left: 50%;
    top: 50%;
    margin: -12px 0 0 -12px;
    transform: translate(var(--x), var(--y)) scale(0);
    animation: twinkle 0.9s ease-out var(--t) both;
  }
  b {
    display: flex;
    font-size: 32px;
    color: var(--blue);
  }
  b span {
    display: inline-block;
    animation: hop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) calc(0.25s + var(--i) * 0.07s) both;
  }
  b .hira {
    color: var(--teal);
  }
  .line path {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 0.5s ease-out 0.85s forwards;
  }
  @keyframes pop {
    from {
      transform: scale(0.3) rotate(-12deg);
      opacity: 0;
    }
  }
  @keyframes wobble {
    0%,
    100% {
      transform: rotate(-3deg);
    }
    50% {
      transform: rotate(3deg);
    }
  }
  @keyframes twinkle {
    0% {
      transform: translate(var(--x), var(--y)) scale(0) rotate(-40deg);
    }
    60% {
      transform: translate(var(--x), var(--y)) scale(1.3) rotate(10deg);
    }
    100% {
      transform: translate(var(--x), var(--y)) scale(1) rotate(0);
    }
  }
  @keyframes hop {
    from {
      transform: translateY(26px) scale(0.6);
      opacity: 0;
    }
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    img,
    .star,
    b span,
    .line path {
      animation: none;
      transform: none;
      opacity: 1;
      stroke-dashoffset: 0;
    }
    .star {
      transform: translate(var(--x), var(--y));
    }
  }
</style>

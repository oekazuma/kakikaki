<script lang="ts">
  import type { Pt } from '$lib/geometry';
  import { ribbon, polyline, type Sample } from '$lib/ribbon';
  import { info } from '$lib/lang.svelte';
  import type { Mode } from '$lib/progress.svelte';
  import type { Tracer } from '$lib/tracer.svelte';

  // 書き取り面の描画と座標変換だけを担当する。判定は Tracer、演出とタイマーは Canvas
  let {
    t,
    mode,
    ui,
    on
  }: {
    t: Tracer;
    mode: Mode;
    ui: { demo: boolean; bounce: number; shake: boolean };
    on: {
      down: (p: Sample, id: number) => boolean;
      move: (p: Sample, id: number) => void;
      up: (id: number) => void;
      demoend: () => void;
    };
  } = $props();
  const ds = $derived(t.strokes[t.char]);
  // 線の太さ。画数が多い漢字は 14 のままだと線が重なって潰れる（暮 など）ので 5 画目から細くする（20 画で半分弱）
  const k = $derived(Math.max(0.45, Math.min(1, 1 - (ds.length - 4) * 0.045)));
  let svg: SVGSVGElement;

  // 画面 ↔ viewBox の行列は指を置いたときに 1 回だけ取る（pointermove ごとに getScreenCTM を呼ぶとレイアウトを強制する）
  let ctm: DOMMatrix | null = null,
    inv: DOMMatrix | null = null;
  const refresh = () => {
    ctm = svg.getScreenCTM();
    inv = ctm?.inverse() ?? null;
  };
  const toView = (e: PointerEvent): Sample => {
    if (!inv) refresh();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(inv!);
    // 時刻と Pencil の筆圧は毛筆風の太さに使う（指の筆圧は一定値なので入れない）
    return { x: p.x, y: p.y, t: e.timeStamp, p: e.pointerType === 'pen' ? e.pressure : undefined };
  };
  export const toScreen = (p: Pt) => {
    if (!ctm) refresh();
    return new DOMPoint(p.x, p.y).matrixTransform(ctm!);
  };
</script>

{#snippet ink(tr: Sample[])}
  {#if info().brush}<path d={ribbon(tr, 14 * k)} style:fill="var(--blue)" />{:else}<polyline
      points={polyline(tr)}
      class="ink live"
    />{/if}
{/snippet}

<div class={['wrap', { shake: ui.shake }]}>
  <svg
    bind:this={svg}
    viewBox="0 0 109 109"
    role="img"
    aria-label="かきとりめん"
    style:--sw={14 * k}
    style:--si={10 * k}
    style:--sd={5 * k}
    onpointerdown={(e) => (refresh(), on.down(toView(e), e.pointerId) && svg.setPointerCapture(e.pointerId))}
    onpointermove={(e) => on.move(toView(e), e.pointerId)}
    onpointerup={(e) => on.up(e.pointerId)}
    onpointercancel={(e) => on.up(e.pointerId)}
  >
    <rect x="1" y="1" width="107" height="107" rx="6" class="frame" />
    <line x1="54.5" y1="2" x2="54.5" y2="107" class="grid" />
    <line x1="2" y1="54.5" x2="107" y2="54.5" class="grid" />
    {#if mode !== 'test'}
      {#each ds as d (d)}
        <path {d} class="guide" />
      {/each}
    {/if}
    {#each ds as d, i (d)}
      {#if i < t.si}<path {d} class={['ink', { bounce: ui.bounce === i }]} />{/if}
    {/each}
    {#if mode === 'trace' && !t.finished}
      <path
        d={ds[t.si]}
        class="ink live"
        pathLength={t.current.length - 1}
        stroke-dasharray={t.current.length - 1}
        stroke-dashoffset={t.current.length - 1 - t.cursor}
      />
    {/if}
    {#if mode !== 'trace'}
      {#each t.trails as tr (tr)}{@render ink(tr)}{/each}
      {#if t.tracing}{@render ink(t.trail)}{/if}
    {/if}
    {#if ui.demo && !t.finished}
      <path d={ds[t.si]} class="demo" pathLength="1" onanimationend={on.demoend} />
    {/if}
    {#if mode !== 'test' && !t.finished && !t.tracing}
      <circle cx={t.current[0].x} cy={t.current[0].y} r="6.5" class="start" />
      <text x={t.current[0].x} y={t.current[0].y} class="num">{t.si + 1}</text>
    {/if}
  </svg>
</div>

<style>
  .wrap {
    height: 100%;
    aspect-ratio: 1;
    margin: 0 auto;
  }
  .shake {
    animation: shake 0.3s;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
  /* 書ける範囲。白いカードの中で面の境界が分かるように薄く塗って枠を引く */
  .frame {
    fill: #f7f9fb;
    stroke: var(--guide);
    stroke-width: 1.5;
  }
  .grid {
    stroke: #e1e5ea;
    stroke-width: 0.6;
    stroke-dasharray: 2 2;
  }
  .guide,
  .ink,
  .demo {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .guide {
    stroke: var(--guide);
    stroke-width: var(--sw);
  }
  /* 書き終えた画は細くして潰れを防ぐ。描いている途中の線はお手本と同じ太さ */
  .ink {
    stroke: var(--blue);
    stroke-width: var(--si);
    transform-box: fill-box;
    transform-origin: center;
  }
  .ink.live {
    stroke-width: var(--sw);
  }
  .bounce {
    animation: bounce 0.4s ease-out;
  }
  .demo {
    stroke: var(--star);
    stroke-width: var(--sd);
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 1.2s ease-in-out forwards;
  }
  .start {
    fill: var(--blue);
    transform-box: fill-box;
    transform-origin: center;
    animation: pulse 1s ease-in-out infinite;
  }
  .num {
    fill: #fff;
    font-size: 7px;
    font-weight: bold;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }
  @keyframes bounce {
    40% {
      transform: scale(1.07);
    }
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes pulse {
    50% {
      transform: scale(1.4);
      opacity: 0.6;
    }
  }
  @keyframes shake {
    25% {
      transform: translateX(-8px);
    }
    75% {
      transform: translateX(8px);
    }
  }
</style>

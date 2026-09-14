<script lang="ts">
  import type { Pt } from '$lib/geometry';
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
    on: { down: (p: Pt) => boolean; move: (p: Pt) => void; up: () => void; demoend: () => void };
  } = $props();
  const ds = $derived(t.strokes[t.char]);
  let svg: SVGSVGElement;

  const toView = (e: PointerEvent): Pt => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };
  export const toScreen = (p: Pt) => new DOMPoint(p.x, p.y).matrixTransform(svg.getScreenCTM()!);
  const poly = (pts: Pt[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
</script>

<div class={['wrap', { shake: ui.shake }]}>
  <svg
    bind:this={svg}
    viewBox="0 0 109 109"
    role="img"
    aria-label="かきとりめん"
    onpointerdown={(e) => on.down(toView(e)) && svg.setPointerCapture(e.pointerId)}
    onpointermove={(e) => on.move(toView(e))}
    onpointerup={on.up}
    onpointercancel={on.up}
  >
    <line x1="54.5" y1="2" x2="54.5" y2="107" class="grid" />
    <line x1="2" y1="54.5" x2="107" y2="54.5" class="grid" />
    {#if mode !== 'test'}
      {#each ds as d, i (d)}
        <path {d} class="guide" />
        {#if i > t.si}<path {d} class="dash" />{/if}
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
      {#each t.trails as tr (tr)}<polyline points={poly(tr)} class="ink live" />{/each}
      {#if t.tracing}<polyline points={poly(t.trail)} class="ink live" />{/if}
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
  .grid {
    stroke: #e1e5ea;
    stroke-width: 0.6;
    stroke-dasharray: 2 2;
  }
  .guide,
  .ink,
  .dash,
  .demo {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .guide {
    stroke: var(--guide);
    stroke-width: 14;
  }
  .dash {
    stroke: #b9c3cc;
    stroke-width: 1.2;
    stroke-dasharray: 3 2.5;
  }
  /* 書き終えた画は細くして潰れを防ぐ。描いている途中の線はお手本と同じ太さ */
  .ink {
    stroke: var(--blue);
    stroke-width: 10;
    transform-box: fill-box;
    transform-origin: center;
  }
  .ink.live {
    stroke-width: 14;
  }
  .bounce {
    animation: bounce 0.4s ease-out;
  }
  .demo {
    stroke: var(--star);
    stroke-width: 5;
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

<script module lang="ts">
  import type { Mode } from '$lib/progress.svelte';
  export type Result = { mode: Mode; score: number; ok: boolean; top: string };
</script>

<script lang="ts">
  import { pathToPoints, type Pt } from '$lib/geometry';
  import { canStart, advance, traceDone, coverage, JUDGE } from '$lib/judge';
  import { strokeScore } from '$lib/score';
  import { recognize, passes, testScore, templatesFor } from '$lib/recognize';
  import { sfx, unlock } from '$lib/audio';
  import { fx } from '$lib/fx';

  let {
    char,
    strokes,
    mode,
    onDone,
    onStroke,
    onDraw
  }: {
    char: string;
    strokes: Record<string, string[]>;
    mode: Mode;
    onDone: (r: Result) => void;
    onStroke?: (i: number) => void;
    onDraw?: () => void;
  } = $props();

  const ds = $derived(strokes[char]);
  const samples = $derived(ds.map((d) => pathToPoints(d)));

  let si = $state(0);
  let cursor = $state(0);
  let trail = $state<Pt[]>([]);
  let trails = $state<Pt[][]>([]);
  let scores: number[] = [];
  let tracing = $state(false);
  let shake = $state(false);
  let bounce = $state(-1);
  let demo = $state(false);
  let svg: SVGSVGElement;
  let idle: ReturnType<typeof setTimeout> | undefined;

  export function reset() {
    si = 0;
    cursor = 0;
    trail = [];
    trails = [];
    scores = [];
    tracing = false;
    demo = false;
    armIdle();
  }
  function playDemo() {
    demo = false;
    requestAnimationFrame(() => (demo = true));
  }
  export function judge() {
    clearTimeout(idle);
    if (trails.length === 0) return;
    const r = recognize(trails, templatesFor(strokes));
    const mine = r.find((x) => x.char === char)!;
    onDone({ mode: 'test', score: testScore(mine.dist), ok: passes(char, r), top: r[0].char });
  }

  // 文字・モードの切替は親が {#key} で再マウントする。なぞるは最初に書く軌跡を見せる
  $effect(() => {
    if (mode === 'trace') playDemo();
    armIdle();
    return () => clearTimeout(idle);
  });

  function armIdle() {
    clearTimeout(idle);
    if (mode !== 'test') idle = setTimeout(playDemo, 6000);
  }
  function toView(e: PointerEvent): Pt {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  }
  function toScreen(p: Pt) {
    return new DOMPoint(p.x, p.y).matrixTransform(svg.getScreenCTM()!);
  }

  function down(e: PointerEvent) {
    if (si >= ds.length) return;
    unlock();
    demo = false;
    clearTimeout(idle);
    const p = toView(e);
    if (mode === 'trace') {
      if (!canStart(samples[si], p)) return;
      cursor = 0;
    }
    tracing = true;
    trail = [p];
    svg.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!tracing) return;
    const p = toView(e);
    trail.push(p);
    if (mode === 'trace') {
      const c = advance(samples[si], cursor, p);
      if (c === -1) fail();
      else cursor = c;
    }
  }
  function up() {
    if (!tracing) return;
    tracing = false;
    if (mode === 'trace') {
      if (traceDone(samples[si], cursor)) complete(1);
      else fail();
    } else if (mode === 'free') {
      trails.push(trail);
      trail = [];
      const all = trails.flat();
      if (coverage(samples[si], all) >= JUDGE.FREE_DONE) complete(strokeScore(all, samples[si]));
    } else {
      trails.push(trail);
      trail = [];
      onDraw?.();
      clearTimeout(idle);
      idle = setTimeout(judge, 4000);
    }
  }
  function fail() {
    tracing = false;
    cursor = 0;
    trail = [];
    shake = true;
    setTimeout(() => (shake = false), 300);
    sfx.buu();
    armIdle();
  }
  function complete(score: number) {
    scores.push(score);
    bounce = si;
    setTimeout(() => (bounce = -1), 400);
    sfx.pon();
    for (const p of samples[si].filter((_, k) => k % 5 === 0)) {
      const q = toScreen(p);
      fx.burst(q.x, q.y, 3);
    }
    onStroke?.(si);
    trail = [];
    trails = [];
    cursor = 0;
    si += 1;
    if (si >= ds.length) {
      const s = scores.reduce((a, b) => a + b, 0) / scores.length;
      setTimeout(() => onDone({ mode, score: s, ok: true, top: char }), 400);
    } else {
      if (mode === 'trace') playDemo();
      armIdle();
    }
  }
  const poly = (pts: Pt[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
</script>

<div class={['wrap', { shake }]}>
  <svg
    bind:this={svg}
    viewBox="0 0 109 109"
    role="img"
    aria-label="かきとりめん"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
  >
    <line x1="54.5" y1="2" x2="54.5" y2="107" class="grid" />
    <line x1="2" y1="54.5" x2="107" y2="54.5" class="grid" />
    {#if mode !== 'test'}
      {#each ds as d, i (d)}
        <path {d} class="guide" />
        {#if i > si}<path {d} class="dash" />{/if}
      {/each}
    {/if}
    {#each ds as d, i (d)}
      {#if i < si}<path {d} class={['ink', { bounce: bounce === i }]} />{/if}
    {/each}
    {#if mode === 'trace' && si < ds.length}
      <path
        d={ds[si]}
        class="ink live"
        pathLength={samples[si].length - 1}
        stroke-dasharray={samples[si].length - 1}
        stroke-dashoffset={samples[si].length - 1 - cursor}
      />
    {/if}
    {#if mode !== 'trace'}
      {#each trails as t (t)}<polyline points={poly(t)} class="ink live" />{/each}
      {#if tracing}<polyline points={poly(trail)} class="ink live" />{/if}
    {/if}
    {#if demo && si < ds.length}
      <path d={ds[si]} class="demo" pathLength="1" onanimationend={() => (demo = false)} />
    {/if}
    {#if mode !== 'test' && si < ds.length && !tracing}
      <circle cx={samples[si][0].x} cy={samples[si][0].y} r="6.5" class="start" />
      <text x={samples[si][0].x} y={samples[si][0].y} class="num">{si + 1}</text>
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

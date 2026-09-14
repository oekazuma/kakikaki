<script lang="ts">
  import { untrack } from 'svelte';
  import type { Pt } from '$lib/geometry';
  import type { Mode } from '$lib/progress.svelte';
  import { Tracer, type Result } from '$lib/tracer.svelte';
  import { sfx, unlock } from '$lib/audio';
  import { fx } from '$lib/fx';
  import Board from './Board.svelte';

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

  // 文字・モードの切替は親が {#key} で再マウントするので、判定器は初期値で 1 回だけ作る
  const t = untrack(() => new Tracer(char, strokes, mode));
  let board = $state<Board>();
  let shake = $state(false);
  let bounce = $state(-1);
  let demo = $state(false);
  let idle: ReturnType<typeof setTimeout> | undefined;

  export function judge() {
    clearTimeout(idle);
    const r = t.judge();
    if (r) onDone(r);
  }
  function playDemo() {
    demo = false;
    requestAnimationFrame(() => (demo = true));
  }
  // なぞるは最初に書く軌跡を見せる。放置時も再生する
  $effect(() => {
    if (mode === 'trace') playDemo();
    armIdle();
    return () => clearTimeout(idle);
  });
  function armIdle() {
    clearTimeout(idle);
    if (mode !== 'test') idle = setTimeout(playDemo, 6000);
  }

  function down(p: Pt) {
    unlock();
    demo = false;
    clearTimeout(idle);
    return t.down(p);
  }
  function move(p: Pt) {
    if (t.move(p) === 'fail') failed();
  }
  function up() {
    const i = t.si;
    const ev = t.up();
    if (ev === 'fail') failed();
    else if (ev === 'stroke' || ev === 'done') completed(i, ev === 'done');
    else if (ev === 'drawn') {
      onDraw?.();
      clearTimeout(idle);
      idle = setTimeout(judge, 4000);
    }
  }
  function failed() {
    shake = true;
    setTimeout(() => (shake = false), 300);
    sfx.buu();
    armIdle();
  }
  function completed(i: number, all: boolean) {
    bounce = i;
    setTimeout(() => (bounce = -1), 400);
    sfx.pon();
    for (const p of t.samples[i].filter((_, k) => k % 5 === 0)) {
      const q = board!.toScreen(p);
      fx.burst(q.x, q.y, 3);
    }
    onStroke?.(i);
    if (all) setTimeout(() => onDone(t.result()), 400);
    else {
      if (mode === 'trace') playDemo();
      armIdle();
    }
  }
</script>

<Board
  bind:this={board}
  {t}
  {mode}
  ui={{ demo, bounce, shake }}
  on={{ down, move, up, demoend: () => (demo = false) }}
/>

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
    accept,
    onDone,
    onStroke
  }: {
    char: string;
    strokes: Record<string, string[]>;
    mode: Mode;
    accept?: string[]; // おてほんなし で正解にする字
    onDone: (r: Result) => void;
    // 盤面にある画の数。なぞる／じぶんでかく は完成した画の数、おてほんなし は引いた線の数（0 なら できた を押せない）
    onStroke?: (n: number) => void;
  } = $props();

  // 文字・モードの切替は親が {#key} で再マウントするので、判定器は初期値で 1 回だけ作る
  const t = untrack(() => new Tracer(char, strokes, mode, accept));
  let board = $state<Board>();
  let shake = $state(false);
  let bounce = $state(-1);
  let demo = $state(false);
  let idle: ReturnType<typeof setTimeout> | undefined;
  // 演出と完了通知のタイマー。{#key} で作り直されたあとに古い方が発火して別の文字に記録を付けないよう、破棄時に全部止める。
  // 描画には使わないので反応性は不要
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };

  export function judge() {
    clearTimeout(idle);
    const r = t.judge();
    if (r) onDone(r);
  }
  // ひとつ もどる。画を取り消したら画数の表示も戻し、おてほんなし では線の数を親に知らせる
  export function undo() {
    clearTimeout(idle);
    const r = t.undo();
    if (!r) return;
    if (r === 'stroke') onStroke?.(t.si);
    if (mode !== 'test') return armIdle();
    onStroke?.(t.trails.length);
    armJudge();
  }
  // おてほんなし の自動判定。画数がそろう前に手が止まっても判定しない（漢字は 18 画まであり、思い出している間に不合格にしないため）
  function armJudge() {
    clearTimeout(idle);
    if (t.trails.length >= strokes[char].length) idle = setTimeout(judge, 4000);
  }
  // 書き順の再生。なぞる では自動で、他のモードでは右の「みる」から
  export function playDemo() {
    demo = false;
    requestAnimationFrame(() => (demo = true));
  }
  // なぞるは最初に書く軌跡を見せる。放置時も再生する
  $effect(() => {
    if (mode === 'trace') playDemo();
    armIdle();
    return () => {
      clearTimeout(idle);
      for (const t of timers) clearTimeout(t);
      timers.clear();
    };
  });
  function armIdle() {
    clearTimeout(idle);
    if (mode !== 'test') idle = setTimeout(playDemo, 6000);
  }

  function down(p: Pt, id: number) {
    unlock();
    demo = false;
    clearTimeout(idle);
    return t.down(p, id);
  }
  function move(p: Pt, id: number) {
    if (t.move(p, id) === 'fail') failed();
  }
  function up(id: number) {
    const i = t.si;
    const ev = t.up(id);
    if (ev === 'fail') failed();
    else if (ev === 'stroke' || ev === 'done') completed(i, ev === 'done');
    else if (ev === 'drawn') {
      onStroke?.(t.trails.length);
      armJudge();
    }
  }
  function failed() {
    shake = true;
    later(() => (shake = false), 300);
    sfx.buu();
    armIdle();
  }
  function completed(i: number, all: boolean) {
    bounce = i;
    later(() => (bounce = -1), 400);
    sfx.pon();
    for (const p of t.samples[i].filter((_, k) => k % 5 === 0)) {
      const q = board!.toScreen(p);
      fx.burst(q.x, q.y, 3);
    }
    onStroke?.(t.si);
    if (all) later(() => onDone(t.result()), 400);
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

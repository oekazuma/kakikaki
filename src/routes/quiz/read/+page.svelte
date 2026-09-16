<script lang="ts">
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import QuizHeader from '$lib/components/QuizHeader.svelte';
  import QuizResult from '$lib/components/QuizResult.svelte';
  import ReadQuestion from '$lib/components/ReadQuestion.svelte';
  import { lang, info } from '$lib/lang.svelte';
  import { ReadQuiz, levelFromParam } from '$lib/quiz-session.svelte';
  import { levelName } from '$lib/quiz';
  import { sfx, unlock } from '$lib/audio';
  import { fx } from '$lib/fx';

  const level = $derived(levelFromParam(page.url.searchParams.get('level')));
  // 級が変わったときだけ作り直す（コンストラクタが読む言語ストアには反応させない）
  const r = $derived.by(() => {
    void level;
    return untrack(
      () => new ReadQuiz(level, { buu: sfx.buu, kira: sfx.kira, fanfare: sfx.fanfare, confetti: (n) => fx.confetti(n) })
    );
  });

  $effect(() => {
    const q = r;
    return () => q.dispose();
  });

  function pick(key: string, e: MouseEvent) {
    unlock();
    if (r.pick(key) === 'hit') fx.burst(e.clientX, e.clientY, 24);
  }
</script>

<svelte:head>
  <title>よみクイズ {levelName(level, lang.v)} | {info().title}</title>
  <meta name="description" content="もじを よんで えを えらぶ クイズ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <QuizHeader title="よみクイズ" {level} i={r.i} total={r.qs.length} done={r.done} />
  {#if r.q}
    {#key r.i}
      <div class="qwrap" in:fly={{ x: 60, duration: 300 }}><ReadQuestion {r} onpick={pick} /></div>
    {/key}
  {/if}
  {#if r.hit}
    <div class="ok" in:scale={{ duration: 300, start: 0.5 }}>○</div>
  {/if}
  {#if r.done}
    <QuizResult correct={r.correct} total={r.qs.length} kind="read" {level} onRetry={() => r.start()} />
  {/if}
</main>

<style>
  main {
    padding: 16px 22px 30px;
    height: calc(100vh - var(--sat) - var(--sab));
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 14px;
  }
  .qwrap {
    min-height: 0;
  }
  .ok {
    position: fixed;
    inset: 0;
    display: grid;
    place-content: center;
    font-size: 320px;
    font-weight: bold;
    color: var(--danger);
    opacity: 0.6;
    pointer-events: none;
    z-index: 60;
  }
</style>

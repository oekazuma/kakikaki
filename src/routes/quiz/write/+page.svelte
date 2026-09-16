<script lang="ts">
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import QuizHeader from '$lib/components/QuizHeader.svelte';
  import QuizResult from '$lib/components/QuizResult.svelte';
  import Canvas from '$lib/components/Canvas.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import ActionButton from '$lib/components/ActionButton.svelte';
  import LetterSlots from '$lib/components/LetterSlots.svelte';
  import { imageUrl } from '$lib/image';
  import { kanjiReading } from '$lib/kanji';
  import { lang, info, nameOf, strokesOf } from '$lib/lang.svelte';
  import { WriteQuiz, levelFromParam } from '$lib/quiz-session.svelte';
  import { levelName } from '$lib/quiz';
  import { sfx, speaker } from '$lib/audio';
  import { fx } from '$lib/fx';

  const level = $derived(levelFromParam(page.url.searchParams.get('level')));
  const w = $derived.by(() => {
    void level;
    return untrack(
      () =>
        new WriteQuiz(level, {
          buu: sfx.buu,
          pon: sfx.pon,
          kira: sfx.kira,
          fanfare: sfx.fanfare,
          confetti: (n) => fx.confetti(n)
        })
    );
  });
  $effect(() => {
    const q = w;
    return () => q.dispose();
  });
  const strokes = $derived(strokesOf());
  let canvas = $state<Canvas>();
  let speaking = $state(false);
  const hear = speaker((on) => (speaking = on));
</script>

<svelte:head>
  <title>かきクイズ {levelName(level, lang.v)} | {info().title}</title>
  <meta name="description" content="えを みて もじを かく クイズ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <QuizHeader title="かきクイズ" {level} i={w.i} total={w.qs.length} done={w.done} />
  {#if w.word}
    <div class="left">
      <div class="card pic">
        {#if w.kind === 'kanji'}
          <b class="yomi kyokasho">{kanjiReading(w.word.name)}</b>
          <button class={['hear', { speaking }]} onclick={() => hear(kanjiReading(w.word.name), info().speech)}
            ><Icon name="speaker" size={22} /> きく</button
          >
        {:else if w.kind === 'listen'}
          <button class={['hear', 'big', { speaking }]} onclick={() => hear(nameOf(w.word), info().speech)}
            ><Icon name="speaker" size={40} /> きく</button
          >
          <small>きこえた ことばを かこう</small>
        {:else}
          <img src={imageUrl(w.word)} alt="" width="210" height="150" loading="eager" />
          <button class={['hear', { speaking }]} onclick={() => hear(nameOf(w.word), info().speech)}
            ><Icon name="speaker" size={22} /> きく</button
          >
        {/if}
      </div>
      <LetterSlots {w} />
    </div>

    <section class="center">
      <div class="board card">
        {#key `${w.i}-${w.k}-${w.mode}-${w.gen}`}
          <Canvas
            bind:this={canvas}
            char={w.c}
            {strokes}
            mode={w.mode}
            accept={w.accept}
            onDone={(r) => w.onDone(r)}
            onStroke={(n) => (w.drawn = n > 0)}
          />
        {/key}
      </div>
      <p class="hint">
        {w.msg ||
          (w.mode === 'test'
            ? w.kind === 'blank'
              ? '？ の もじを かこう'
              : w.kind === 'kanji'
                ? 'よみを みて かんじを かこう'
                : `${w.k + 1} もじめを かいてみよう`
            : 'まるから せんに そって なぞろう')}
      </p>
    </section>

    <div class="right">
      {#if w.mode === 'test'}
        <ActionButton icon="undo" label="ひとつ もどる" onclick={() => canvas?.undo()} />
      {/if}
      <ActionButton icon="refresh" label="やりなおす" onclick={() => w.nextLetter(w.k)} />
      {#if w.mode === 'test'}
        <ActionButton icon="check" label="できた" done ready={w.drawn} onclick={() => canvas?.judge()} />
      {/if}
    </div>
  {/if}
  {#if w.done}
    <QuizResult correct={w.correct} total={w.qs.length} kind="write" {level} onRetry={() => w.start()} />
  {/if}
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 240px 1fr 110px;
    grid-template-rows: auto 1fr;
    gap: 12px 18px;
    height: calc(100vh - var(--sat) - var(--sab));
    padding: 16px 22px;
  }
  .left {
    display: grid;
    gap: 12px;
    align-content: start;
  }
  .pic {
    padding: 14px;
    display: grid;
    justify-items: center;
    gap: 10px;
  }
  .pic img {
    height: 150px;
  }
  .yomi {
    font-size: 56px;
    color: var(--blue);
  }
  .hear {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--pill);
    color: var(--blue);
    padding: 10px 16px;
    border-radius: 14px;
    font-weight: bold;
    transition:
      transform 0.1s,
      background-color 0.2s,
      color 0.2s;
  }
  .hear:active {
    transform: scale(0.94);
  }
  /* 聞いて書く: 絵の代わりに大きな きく */
  .hear.big {
    height: 150px;
    width: 100%;
    justify-content: center;
    flex-direction: column;
    font-size: 26px;
    border-radius: 20px;
  }
  .pic small {
    color: var(--sub);
    font-weight: bold;
  }
  .hear.speaking {
    background: var(--blue);
    color: #fff;
  }
  .center {
    display: grid;
    grid-template-rows: 1fr auto;
    gap: 10px;
    min-height: 0;
  }
  .board {
    min-height: 0;
    padding: 12px;
  }
  .hint {
    margin: 0;
    text-align: center;
    color: var(--sub);
    font-size: 15px;
    min-height: 22px;
    font-weight: bold;
  }
  .right {
    display: grid;
    gap: 26px;
    align-content: center;
    justify-items: center;
  }
</style>

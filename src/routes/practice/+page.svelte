<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { practiceUrl } from '$lib/nav';
  import Canvas from '$lib/components/Canvas.svelte';
  import WordWithHear from '$lib/components/WordWithHear.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import ModeBar from '$lib/components/ModeBar.svelte';
  import CharTabs from '$lib/components/CharTabs.svelte';
  import ActionButton from '$lib/components/ActionButton.svelte';
  import CompleteModal from '$lib/components/CompleteModal.svelte';
  import BadgeToast from '$lib/components/BadgeToast.svelte';
  import Hint from '$lib/components/Hint.svelte';
  import DriveBy from '$lib/components/DriveBy.svelte';
  import { lang, info, nameOf, strokesOf } from '$lib/lang.svelte';
  import { PracticeSession, resolveWord } from '$lib/practice.svelte';
  import { speaker, sfx, speechOf } from '$lib/audio';
  import { fx } from '$lib/fx';

  const word = $derived(resolveWord(page.url.searchParams.get('w'), lang.v));
  const strokes = $derived(strokesOf());
  // 単語が切り替わったときだけセッションを作り直す。コンストラクタが読む進捗ストアには反応させない
  const effects = { buu: sfx.buu, kira: sfx.kira, fanfare: sfx.fanfare, confetti: (n: number) => fx.confetti(n) };
  const s = $derived.by(() => {
    void word.id;
    return untrack(() => new PracticeSession(word, effects));
  });
  // 単語が切り替わったときと画面を離れるときに、待っている演出（メダルのトーストと紙吹雪）を止める
  $effect(() => {
    const cur = s;
    return () => cur.dispose();
  });
  let canvas = $state<Canvas>();
  let speaking = $state(false);
  const total = $derived(strokes[s.c].length);

  // 右の きく はいまの 1 文字だけ（単語全体は左の単語カードのスピーカー）
  const hear = speaker((on) => (speaking = on));
  function goNext() {
    s.complete = false;
    const id = s.nextId();
    goto(id ? practiceUrl(id) : resolve('/'));
  }
</script>

<svelte:head>
  <title>{nameOf(word)} を かく | {info().title}</title>
  <meta
    name="description"
    content="「{nameOf(word)}」の文字を なぞる・じぶんで かく・おてほんなし で練習するページ。"
  />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1>{s.cur.title}</h1>
  </header>

  <div class="left">
    <WordWithHear {word} onegg={() => s.celebrate()} />
    <CharTabs {s} />
  </div>

  <section class="center">
    <ModeBar mode={s.mode} onselect={(m) => s.select(s.i, m)} />
    <div class="board card">
      {#if s.mode !== 'test'}
        <span class="count">{Math.min(s.stroke + 1, total)} / {total}</span>
      {/if}
      {#key `${lang.v}-${s.c}-${s.mode}-${s.gen}`}
        <Canvas
          bind:this={canvas}
          char={s.c}
          {strokes}
          mode={s.mode}
          onDone={(r) => s.done(r)}
          onStroke={(n) => ((s.stroke = n), (s.drawn = n > 0))}
        />
      {/key}
      {#if s.flyStar}<div class="flystar"><Icon name="star" size={90} fill /></div>{/if}
    </div>
    <Hint {s} {total} />
  </section>

  <div class="right">
    <ActionButton icon="speaker" label="きく" active={speaking} onclick={() => hear(speechOf(s.c), info().speech)} />
    {#if s.mode !== 'test'}
      <ActionButton icon="eye" label="みる" onclick={() => canvas?.playDemo()} />
    {/if}
    {#if s.mode !== 'trace'}
      <ActionButton icon="undo" label="ひとつ もどる" onclick={() => canvas?.undo()} />
    {/if}
    <ActionButton icon="refresh" label="やりなおす" onclick={() => s.select(s.i, s.mode)} />
    {#if s.mode === 'test'}
      <ActionButton icon="check" label="できた" done ready={s.drawn} onclick={() => canvas?.judge()} />
    {/if}
  </div>

  {#if s.drive}
    <DriveBy {word} onend={() => (s.drive = false)} />
  {/if}
  {#if s.complete}
    <CompleteModal {word} onnext={goNext} onreplay={() => s.replay()} onchallenge={() => s.challenge()} />
  {/if}
  {#if s.toast}
    <BadgeToast badge={s.toast} />
  {/if}
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 240px 1fr 120px;
    grid-template-rows: auto 1fr;
    gap: 14px 22px;
    height: calc(100vh - var(--sat) - var(--sab));
    padding: 16px 22px;
  }
  header {
    grid-column: 1 / -1;
    display: flex;
    gap: 14px;
    align-items: center;
  }
  h1 {
    margin: 0;
    font-size: 22px;
  }
  /* 左カラムは高さを超えても画面全体を伸ばさず、内部でスクロールする */
  .left {
    display: grid;
    gap: 20px;
    align-content: start;
    min-height: 0;
    overflow-y: auto;
    padding: 2px;
  }
  .center {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 10px;
    min-height: 0;
  }
  .board {
    position: relative;
    min-height: 0;
    padding: 12px;
  }
  .count {
    position: absolute;
    top: 10px;
    left: 14px;
    font-size: 13px;
    color: var(--sub);
    background: var(--pill);
    padding: 4px 10px;
    border-radius: 12px;
  }
  .right {
    display: grid;
    gap: 26px;
    align-content: center;
    justify-items: center;
  }
  .flystar {
    position: absolute;
    left: 50%;
    top: 50%;
    color: var(--star);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    animation: fly 0.9s ease-in forwards;
    pointer-events: none;
  }
  @keyframes fly {
    0% {
      transform: translate(-50%, -50%) scale(0.2);
      opacity: 0;
    }
    30% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(calc(-50% - 60vw), calc(-50% + 10vh)) scale(0.2);
      opacity: 0;
    }
  }
</style>

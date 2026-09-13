<script lang="ts">
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import BackButton from '$lib/components/BackButton.svelte';
  import QuizResult from '$lib/components/QuizResult.svelte';
  import Canvas, { type Result } from '$lib/components/Canvas.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { imageUrl } from '$lib/image';
  import { info, nameOf, lettersOf, strokesOf, lang } from '$lib/lang.svelte';
  import { recordQuiz, checkBadges, type Mode } from '$lib/progress.svelte';
  import { makeWriteQuiz, LEVEL_NAME, type Level } from '$lib/quiz';
  import { sfx, say } from '$lib/audio';
  import { fx } from '$lib/fx';
  import type { Word } from '$lib/words';

  const level = $derived(Math.min(3, Math.max(1, Number(page.url.searchParams.get('level') ?? 1))) as Level);
  let words = $state<Word[]>([]);
  let i = $state(0); // 問題
  let k = $state(0); // 文字
  let miss = $state(0);
  let helped = $state(false); // この単語でお手本を使った
  let correct = $state(0);
  let mode = $state<Mode>('test');
  let gen = $state(0);
  let msg = $state('');
  let drawn = $state(false);
  let done = $state(false);
  let canvas = $state<Canvas>();
  let speaking = $state(false);
  async function hear() {
    speaking = true;
    await say(nameOf(word), info().speech);
    speaking = false;
  }
  const word = $derived(words[i]);
  const letters = $derived(word ? lettersOf(word) : []);
  const c = $derived(letters[k]);
  const strokes = $derived(strokesOf());

  function start() {
    words = makeWriteQuiz(lang.v, level);
    i = 0;
    correct = 0;
    done = false;
    nextLetter(0);
  }
  // 級が変わったら作り直す。start が書く state を effect の依存に入れない
  $effect(() => {
    void level;
    untrack(start);
  });
  function nextLetter(n: number) {
    k = n;
    miss = 0;
    mode = 'test';
    msg = '';
    drawn = false;
    gen++;
    if (n === 0) helped = false;
  }
  function onDone(r: Result) {
    if (r.mode === 'test' && !r.ok) {
      miss++;
      sfx.buu();
      if (miss >= 2) {
        helped = true;
        mode = 'trace';
        msg = 'おてほんを なぞって みよう';
        gen++;
      } else msg = `おしい！ 「${r.top}」に みえるよ。もういちど！`;
      return;
    }
    sfx.pon();
    if (k < letters.length - 1) {
      nextLetter(k + 1);
      return;
    }
    // 単語完成
    if (!helped) correct++;
    sfx.kira();
    fx.confetti(80);
    msg = helped ? 'かけたね！' : 'せいかい！';
    setTimeout(() => {
      if (i < words.length - 1) {
        i++;
        nextLetter(0);
      } else finish();
    }, 1400);
  }
  function finish() {
    done = true;
    recordQuiz('write', level, correct);
    checkBadges();
    if (correct >= words.length * 0.7) {
      fx.confetti(correct === words.length ? 300 : 120);
      sfx.fanfare();
    }
  }
</script>

<svelte:head>
  <title>かきクイズ {LEVEL_NAME[level]} | {info().title}</title>
  <meta name="description" content="えを みて もじを かく クイズ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1>かきクイズ <small>{LEVEL_NAME[level]}</small></h1>
    <span class="prog">{Math.min(i + 1, words.length)} / {words.length}</span>
  </header>

  {#if word}
    <aside class="left">
      <div class="card pic">
        <img src={imageUrl(word)} alt="" />
        <button class={['hear', { speaking }]} onclick={hear}><Icon name="speaker" size={22} /> きく</button>
      </div>
      <div class="slots">
        {#each letters as ch, n (n)}
          <span class={['slot', 'card', { on: n === k, ok: n < k }]}
            >{n < k ? ch : n === k && mode === 'trace' ? ch : '?'}</span
          >
        {/each}
      </div>
    </aside>

    <section class="center">
      <div class="board card">
        {#key `${i}-${k}-${mode}-${gen}`}
          <Canvas bind:this={canvas} char={c} {strokes} {mode} {onDone} onDraw={() => (drawn = true)} />
        {/key}
      </div>
      <p class="hint">
        {msg || (mode === 'test' ? `${k + 1} もじめを かいてみよう` : 'まるから みちに そって なぞろう')}
      </p>
    </section>

    <aside class="right">
      <button class="rb" onclick={() => nextLetter(k)}
        ><span class="card ic"><Icon name="redo" size={32} /></span>やりなおす</button
      >
      {#if mode === 'test'}
        <button class={['rb', 'done', { ready: drawn }]} onclick={() => canvas?.judge()}
          ><span class="card ic"><Icon name="check" size={36} /></span>できた</button
        >
      {/if}
    </aside>
  {/if}
  {#if done}
    <QuizResult {correct} total={words.length} onRetry={start} />
  {/if}
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 240px 1fr 110px;
    grid-template-rows: auto 1fr;
    gap: 12px 18px;
    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
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
    flex: 1;
  }
  h1 small {
    font-size: 14px;
    color: var(--sub);
    margin-left: 6px;
  }
  .prog {
    font-weight: bold;
    color: var(--sub);
    background: #fff;
    padding: 8px 14px;
    border-radius: 14px;
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
  .hear {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #eef1f4;
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
  .hear.speaking {
    background: var(--blue);
    color: #fff;
  }
  .slots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .slot {
    width: 46px;
    height: 52px;
    display: grid;
    place-content: center;
    font-size: 24px;
    font-weight: bold;
    color: var(--sub);
  }
  .slot.on {
    background: var(--blue);
    color: #fff;
  }
  .slot.ok {
    color: var(--ink);
    background: #fff8dc;
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
  .rb {
    display: grid;
    justify-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: bold;
    color: var(--sub);
  }
  .ic {
    width: 68px;
    height: 68px;
    display: grid;
    place-content: center;
    color: var(--blue);
    transition:
      transform 0.1s,
      background-color 0.2s;
  }
  .rb:active .ic {
    transform: scale(0.9);
    background: #dfe7f0;
  }
  .done .ic {
    background: var(--teal);
    width: 76px;
    height: 76px;
    color: #fff;
  }
  .done:active .ic {
    background: #0f5f58;
  }
  .done {
    font-weight: bold;
    color: var(--teal);
  }
  .done.ready .ic {
    animation: ready 1s ease-in-out infinite;
    box-shadow: 0 0 0 6px rgba(19, 120, 111, 0.25);
  }
  @keyframes ready {
    50% {
      transform: scale(1.12);
    }
  }
</style>

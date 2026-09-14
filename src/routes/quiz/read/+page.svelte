<script lang="ts">
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import BackButton from '$lib/components/BackButton.svelte';
  import QuizResult from '$lib/components/QuizResult.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { imageUrl } from '$lib/image';
  import { info, nameOf, lang } from '$lib/lang.svelte';
  import { recordQuiz, checkBadges } from '$lib/progress.svelte';
  import { makeReadQuiz, LEVEL_NAME, type Level, type ReadQ } from '$lib/quiz';
  import { sfx, say, unlock } from '$lib/audio';
  import { fx } from '$lib/fx';
  import type { Word } from '$lib/words';

  const level = $derived(Math.min(3, Math.max(1, Number(page.url.searchParams.get('level') ?? 1))) as Level);
  let qs = $state<ReadQ[]>([]);
  let i = $state(0);
  let correct = $state(0);
  let wrong = $state<string[]>([]); // この問題で外した選択肢
  let hit = $state<string | null>(null);
  let done = $state(false);
  const q = $derived(qs[i]);

  function start() {
    qs = makeReadQuiz(lang.v, level);
    i = 0;
    correct = 0;
    wrong = [];
    hit = null;
    done = false;
  }
  // 級が変わったら作り直す。start が書く state を effect の依存に入れない
  $effect(() => {
    void level;
    untrack(start);
  });

  function pick(w: Word, e: MouseEvent) {
    if (hit) return;
    unlock();
    if (w.id === q.answer.id) {
      hit = w.id;
      if (wrong.length === 0) correct++;
      sfx.kira();
      fx.burst(e.clientX, e.clientY, 24);
      setTimeout(() => {
        if (i < qs.length - 1) {
          i++;
          wrong = [];
          hit = null;
        } else finish();
      }, 900);
    } else {
      wrong = [...wrong, w.id];
      sfx.buu();
    }
  }
  function finish() {
    done = true;
    recordQuiz('read', level, correct);
    checkBadges();
    if (correct >= qs.length * 0.7) {
      fx.confetti(correct === qs.length ? 300 : 120);
      sfx.fanfare();
    }
  }
</script>

<svelte:head>
  <title>よみクイズ {LEVEL_NAME[level]} | {info().title}</title>
  <meta name="description" content="もじを よんで えを えらぶ クイズ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1>よみクイズ <small>{LEVEL_NAME[level]}</small></h1>
    <span class="prog">{Math.min(i + 1, qs.length)} / {qs.length}</span>
  </header>

  {#if q}
    {#key i}
      <section class="q" in:fly={{ x: 60, duration: 300 }}>
        {#if q.kind === 'word'}
          <div class="prompt card">
            <button class="hear" onclick={() => say(nameOf(q.answer), info().speech)} aria-label="きく"
              ><Icon name="speaker" size={26} /></button
            >
            <b class="word">{nameOf(q.answer)}</b>
            <span>は どれ？</span>
          </div>
          <div class="choices">
            {#each q.choices as w (w.id)}
              <button
                class={['card', 'choice', { hit: hit === w.id, wrong: wrong.includes(w.id) }]}
                disabled={wrong.includes(w.id)}
                onclick={(e) => pick(w, e)}
              >
                <img src={imageUrl(w)} alt={nameOf(w)} width="280" height="200" loading="eager" />
              </button>
            {/each}
          </div>
        {:else}
          <div class="prompt card pic">
            <img src={imageUrl(q.answer)} alt="" width="280" height="200" loading="eager" />
            <span>これは なに？</span>
          </div>
          <div class="choices">
            {#each q.choices as w (w.id)}
              <button
                class={['card', 'choice', 'text', { hit: hit === w.id, wrong: wrong.includes(w.id) }]}
                disabled={wrong.includes(w.id)}
                onclick={(e) => pick(w, e)}
              >
                {nameOf(w)}
              </button>
            {/each}
          </div>
        {/if}
      </section>
    {/key}
  {/if}
  {#if hit}
    <div class="ok" in:scale={{ duration: 300, start: 0.5 }}>○</div>
  {/if}
  {#if done}
    <QuizResult {correct} total={qs.length} onRetry={start} />
  {/if}
</main>

<style>
  main {
    padding: 16px 22px 30px;
    min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  }
  header {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 14px;
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
  .q {
    display: grid;
    gap: 18px;
  }
  .prompt {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 22px;
    font-size: 30px;
    font-weight: bold;
  }
  .prompt.pic {
    flex-direction: column;
    gap: 6px;
    padding: 14px;
  }
  .prompt.pic img {
    height: 200px;
  }
  .word {
    font-size: 56px;
    color: var(--blue);
  }
  .hear {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    background: #eef1f4;
    color: var(--blue);
    display: grid;
    place-content: center;
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
  .choice {
    display: grid;
    place-content: center;
    height: 260px;
    font-size: 40px;
    font-weight: bold;
    border: 4px solid transparent;
    transition:
      transform 0.15s,
      opacity 0.3s,
      border-color 0.2s;
  }
  .choice img {
    height: 200px;
  }
  .choice:active {
    transform: scale(0.97);
  }
  .choice.hit {
    border-color: var(--star);
    background: #fff8dc;
    animation: pop 0.4s;
  }
  .choice.wrong {
    opacity: 0.25;
    animation: shake 0.3s;
  }
  .pic + .choices .choice {
    height: 130px;
  }
  .ok {
    position: fixed;
    inset: 0;
    display: grid;
    place-content: center;
    font-size: 320px;
    font-weight: bold;
    color: #e53935;
    opacity: 0.6;
    pointer-events: none;
    z-index: 60;
  }
  @keyframes pop {
    50% {
      transform: scale(1.05);
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

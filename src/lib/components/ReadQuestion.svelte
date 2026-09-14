<script lang="ts">
  import ReadPrompt from './ReadPrompt.svelte';
  import { imageUrl } from '$lib/image';
  import { nameOf } from '$lib/lang.svelte';
  import type { ReadQuiz } from '$lib/quiz-session.svelte';
  import type { Word } from '$lib/words';
  // よみクイズの 1 問。選択肢は「イラスト」「単語」「文字」のどれか（key で答え合わせ）
  let { r, onpick }: { r: ReadQuiz; onpick: (key: string, e: MouseEvent) => void } = $props();
  const q = $derived(r.q);
  const pictures = $derived(q.kind === 'word' || q.kind === 'listen' || q.kind === 'initial');
  const items: { key: string; label: string; word?: Word }[] = $derived(
    q.kind === 'blank'
      ? q.letters!.map((c) => ({ key: c, label: c }))
      : q.choices.map((w) => ({ key: w.id, label: nameOf(w), word: w }))
  );
</script>

<section class="q">
  <ReadPrompt {q} />
  <div class="choices">
    {#each items as it (it.key)}
      <button
        class={[
          'card',
          'choice',
          'kyokasho',
          { text: !pictures, letter: q.kind === 'blank', hit: r.hit === it.key, wrong: r.wrong.includes(it.key) }
        ]}
        disabled={r.wrong.includes(it.key)}
        onclick={(e) => onpick(it.key, e)}
      >
        {#if pictures && it.word}<img
            src={imageUrl(it.word)}
            alt={it.label}
            width="280"
            height="200"
            loading="eager"
          />{:else}{it.label}{/if}
      </button>
    {/each}
  </div>
</section>

<style>
  /* 出題は上、選択肢は残りの高さいっぱいに広げて、下に余白が残らないようにする */
  .q {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 18px;
    height: 100%;
    min-height: 0;
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    min-height: 0;
  }
  .choice {
    display: grid;
    place-content: center;
    min-height: 160px;
    font-size: 40px;
    font-weight: bold;
    border: 4px solid transparent;
    transition:
      transform 0.15s,
      opacity 0.3s,
      border-color 0.2s;
  }
  .choice img {
    height: clamp(140px, 28vh, 260px);
    width: auto;
  }
  .choice.letter {
    font-size: 72px;
    color: var(--blue);
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

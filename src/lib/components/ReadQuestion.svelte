<script lang="ts">
  import Icon from './Icon.svelte';
  import { imageUrl } from '$lib/image';
  import { info, nameOf } from '$lib/lang.svelte';
  import { say } from '$lib/audio';
  import type { ReadQuiz } from '$lib/quiz-session.svelte';
  import type { Word } from '$lib/words';
  // よみクイズの 1 問（文字→イラスト または イラスト→文字）
  let { r, onpick }: { r: ReadQuiz; onpick: (w: Word, e: MouseEvent) => void } = $props();
  const q = $derived(r.q);
</script>

<section class="q">
  {#if q.kind === 'word'}
    <div class="prompt card">
      <button class="hear" onclick={() => say(nameOf(q.answer), info().speech)} aria-label="きく"
        ><Icon name="speaker" size={26} /></button
      >
      <b class="word kyokasho">{nameOf(q.answer)}</b>
      <span>は どれ？</span>
    </div>
  {:else}
    <div class="prompt card pic">
      <img src={imageUrl(q.answer)} alt="" width="280" height="200" loading="eager" />
      <span>これは なに？</span>
    </div>
  {/if}
  <div class="choices">
    {#each q.choices as w (w.id)}
      <button
        class={[
          'card',
          'choice',
          'kyokasho',
          { text: q.kind === 'picture', hit: r.hit === w.id, wrong: r.wrong.includes(w.id) }
        ]}
        disabled={r.wrong.includes(w.id)}
        onclick={(e) => onpick(w, e)}
      >
        {#if q.kind === 'word'}<img
            src={imageUrl(w)}
            alt={nameOf(w)}
            width="280"
            height="200"
            loading="eager"
          />{:else}{nameOf(w)}{/if}
      </button>
    {/each}
  </div>
</section>

<style>
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
  .choice.text {
    height: 130px;
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

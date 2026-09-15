<script lang="ts">
  import Icon from './Icon.svelte';
  import { imageUrl } from '$lib/image';
  import { info, nameOf, lettersOf } from '$lib/lang.svelte';
  import { speaker } from '$lib/audio';
  import type { ReadQ } from '$lib/quiz';
  // よみクイズの出題部分（形式ごとに見せ方が変わる）
  let { q }: { q: ReadQ } = $props();
  let speaking = $state(false);
  const hear = speaker((on) => (speaking = on));
</script>

<div class={['prompt', 'card', q.kind]} data-kind={q.kind}>
  {#if q.kind === 'word'}
    <button class={['hear', { speaking }]} onclick={() => hear(nameOf(q.answer), info().speech)} aria-label="きく"
      ><Icon name="speaker" size={26} /></button
    >
    <b class="word kyokasho">{nameOf(q.answer)}</b>
    <span>は どれ？</span>
  {:else if q.kind === 'listen'}
    <button class={['hear', 'big', { speaking }]} onclick={() => hear(nameOf(q.answer), info().speech)}
      ><Icon name="speaker" size={40} /> きく</button
    >
    <span>きこえた ものは どれ？</span>
  {:else if q.kind === 'initial'}
    <b class="word kyokasho">{lettersOf(q.answer)[0]}</b>
    <span>で はじまる ものは どれ？</span>
  {:else if q.kind === 'blank'}
    <img src={imageUrl(q.answer)} alt="" width="200" height="140" loading="eager" />
    <div class="fill">
      <span class="letters kyokasho">
        {#each lettersOf(q.answer) as ch, i (`${i}${ch}`)}
          <span class={{ blank: i === q.blank }}>{i === q.blank ? '？' : ch}</span>
        {/each}
      </span>
      <span>？ に はいる もじは？</span>
    </div>
  {:else}
    <img src={imageUrl(q.answer)} alt="" width="280" height="200" loading="eager" />
    <span>これは なに？</span>
  {/if}
</div>

<style>
  .prompt {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 22px;
    font-size: 30px;
    font-weight: bold;
    color: var(--ink);
  }
  .picture {
    flex-direction: column;
    gap: 6px;
    padding: 14px;
  }
  .picture img {
    height: 180px;
  }
  .blank img {
    height: 140px;
  }
  .fill {
    display: grid;
    gap: 4px;
    justify-items: center;
  }
  .word {
    font-size: 56px;
    color: var(--blue);
  }
  /* 答えの手がかり（単語・頭文字・穴埋めの文字列）は 56px の青で揃える。質問文は 30px の黒 */
  .letters {
    display: flex;
    gap: 6px;
    font-size: 56px;
    color: var(--blue);
  }
  .letters .blank {
    color: var(--danger);
    border-bottom: 4px solid var(--danger);
  }
  .hear {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    background: var(--pill);
    color: var(--blue);
    display: grid;
    place-content: center;
    transition:
      transform 0.1s,
      background-color 0.2s,
      color 0.2s;
  }
  .hear.big {
    width: auto;
    height: 72px;
    padding: 0 28px;
    border-radius: 36px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 28px;
    font-weight: bold;
  }
  .hear:active {
    transform: scale(0.94);
  }
  .hear.speaking {
    background: var(--blue);
    color: #fff;
  }
</style>

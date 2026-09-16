<script lang="ts">
  import { scale } from 'svelte/transition';
  import { backOut } from 'svelte/easing';
  import WordCard from './WordCard.svelte';
  import Icon from './Icon.svelte';
  import Bouncer from './Bouncer.svelte';
  import { info, nameOf, lang } from '$lib/lang.svelte';
  import { READINGS, readingLabel, readingSpeech } from '$lib/kanji';
  import { speaker, sfx, unlock, speechOf } from '$lib/audio';
  import { TAPS } from '$lib/bouncer.svelte';
  import { TapCounter } from '$lib/taps';
  import { isCharWord, type Word } from '$lib/words';
  // 練習画面の左上: 単語カードに、単語全体を読み上げるスピーカーを重ねる（右の きく は 1 文字だけ）。
  // かんじ は単語が無く右の きく と同じになるので、代わりに読みごとの きく をカードの下に並べる
  // かくし演出: カードを 10 回続けてタップ（2 秒あくと数え直し）するとイラスト（1 文字練習は字）が画面を走る
  let { word, size = 240, onegg }: { word: Word; size?: number; onegg?: () => void } = $props();
  let speaking = $state(false);
  let cur = $state(-1); // 読んでいる読みの添字（かんじ）
  const readings = $derived(isCharWord(word) && lang.v === 'kanji' ? READINGS[word.name] : null);
  const hear = speaker((on) => (speaking = on));
  const taps = new TapCounter(TAPS, 2000);
  let egg = $state(false);
  let from = $state({ x: 0, y: 0 });
  let box = $state<HTMLDivElement>();
  function tap() {
    unlock();
    const hit = taps.tap(Date.now());
    if (egg) return;
    sfx.pon();
    if (hit) {
      const r = box?.querySelector('img, .initial')?.getBoundingClientRect();
      if (!r) return;
      from = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      egg = true;
    }
  }
</script>

<div class="wordbox" bind:this={box}>
  {#if egg}
    <WordCard {word} {size} onclick={tap} ghost />
  {:else}
    <!-- 跳び出した絵が戻ってきたとき、カードがぽんと跳ねる（最初の表示では動かない） -->
    <div in:scale={{ start: 0.6, duration: 350, easing: backOut }}>
      <WordCard {word} {size} onclick={tap} />
    </div>
  {/if}
  {#if readings}
    <div class="yomis">
      {#each readings as r, i (r)}
        <button
          class={['yomi', { speaking: speaking && cur === i }]}
          onclick={() => ((cur = i), hear(readingSpeech(r), info().speech))}
          ><Icon name="speaker" size={18} /> <span class="kyokasho">{readingLabel(r)}</span></button
        >
      {/each}
    </div>
  {:else}
    <button
      class={['wordhear', { speaking }]}
      onclick={() => hear(isCharWord(word) ? speechOf(word.name) : nameOf(word), info().speech)}
      aria-label="たんごを きく"><Icon name="speaker" size={22} /></button
    >
  {/if}
</div>
{#if egg}
  <Bouncer
    {word}
    {from}
    onend={() => {
      egg = false;
      onegg?.();
    }}
  />
{/if}

<style>
  .wordbox {
    position: relative;
  }
  .wordhear {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: var(--pill);
    color: var(--blue);
    display: grid;
    place-content: center;
    transition:
      transform 0.1s,
      background-color 0.2s,
      color 0.2s;
  }
  .yomis {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-top: 8px;
  }
  .yomi {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 20px;
    background: var(--pill);
    color: var(--blue);
    font-size: 17px;
    font-weight: bold;
    transition:
      transform 0.1s,
      background-color 0.2s,
      color 0.2s;
  }
  .wordhear:active,
  .yomi:active {
    transform: scale(0.92);
  }
  .wordhear.speaking,
  .yomi.speaking {
    background: var(--blue);
    color: #fff;
  }
</style>

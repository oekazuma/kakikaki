<script lang="ts">
  import WordCard from './WordCard.svelte';
  import Icon from './Icon.svelte';
  import Bouncer from './Bouncer.svelte';
  import { info, nameOf } from '$lib/lang.svelte';
  import { speaker, sfx, unlock } from '$lib/audio';
  import { TAPS } from '$lib/bouncer.svelte';
  import { TapCounter } from '$lib/taps';
  import type { Word } from '$lib/words';
  // 練習画面の左上: 単語カードに、単語全体を読み上げるスピーカーを重ねる（右の きく は 1 文字だけ）。
  // かくし演出: カードを 10 回続けてタップ（2 秒あくと数え直し）するとイラストが画面を走る
  let { word, size = 240, onegg }: { word: Word; size?: number; onegg?: () => void } = $props();
  let speaking = $state(false);
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
      const r = box?.querySelector('img')?.getBoundingClientRect();
      if (!r) return;
      from = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      egg = true;
    }
  }
</script>

<div class="wordbox" bind:this={box}>
  <WordCard {word} {size} onclick={tap} ghost={egg} />
  <button
    class={['wordhear', { speaking }]}
    onclick={() => hear(nameOf(word), info().speech)}
    aria-label="たんごを きく"><Icon name="speaker" size={22} /></button
  >
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
  .wordhear:active {
    transform: scale(0.92);
  }
  .wordhear.speaking {
    background: var(--blue);
    color: #fff;
  }
</style>

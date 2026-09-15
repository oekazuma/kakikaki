<script lang="ts">
  import WordCard from './WordCard.svelte';
  import Icon from './Icon.svelte';
  import Bouncer from './Bouncer.svelte';
  import { info, nameOf } from '$lib/lang.svelte';
  import { say, sfx, unlock } from '$lib/audio';
  import { TAPS } from '$lib/bouncer.svelte';
  import type { Word } from '$lib/words';
  // 練習画面の左上: 単語カードに、単語全体を読み上げるスピーカーを重ねる（右の きく は 1 文字だけ）。
  // かくし演出: カードを 10 回続けてタップ（2 秒あくと数え直し）するとイラストが画面を走る
  let { word, size = 240 }: { word: Word; size?: number } = $props();
  let speaking = $state(false);
  let taps = 0;
  let lastTap = 0;
  let egg = $state(false);
  function tap() {
    unlock();
    const now = Date.now();
    taps = now - lastTap < 2000 ? taps + 1 : 1;
    lastTap = now;
    if (egg) return;
    sfx.pon();
    if (taps >= TAPS) {
      taps = 0;
      egg = true;
    }
  }
  async function hear() {
    speaking = true;
    await say(nameOf(word), info().speech);
    speaking = false;
  }
</script>

<div class="wordbox">
  <WordCard {word} {size} onclick={tap} />
  <button class={['wordhear', { speaking }]} onclick={hear} aria-label="たんごを きく"
    ><Icon name="speaker" size={22} /></button
  >
</div>
{#if egg}
  <Bouncer {word} onend={() => (egg = false)} />
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

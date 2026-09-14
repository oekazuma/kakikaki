<script lang="ts">
  import WordCard from './WordCard.svelte';
  import Icon from './Icon.svelte';
  import { info, nameOf } from '$lib/lang.svelte';
  import { say } from '$lib/audio';
  import type { Word } from '$lib/words';
  // 練習画面の左上: 単語カードに、単語全体を読み上げるスピーカーを重ねる（右の きく は 1 文字だけ）
  let { word, size = 240 }: { word: Word; size?: number } = $props();
  let speaking = $state(false);
  async function hear() {
    speaking = true;
    await say(nameOf(word), info().speech);
    speaking = false;
  }
</script>

<div class="wordbox">
  <WordCard {word} {size} />
  <button class={['wordhear', { speaking }]} onclick={hear} aria-label="たんごを きく"
    ><Icon name="speaker" size={22} /></button
  >
</div>

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
    background: #eef1f4;
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

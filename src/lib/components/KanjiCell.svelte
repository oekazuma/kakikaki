<script lang="ts">
  import Icon from './Icon.svelte';
  import { practiceUrl } from '$lib/nav';
  import { kanjiReading, readingLabel } from '$lib/kanji';
  import { charWordId } from '$lib/words';
  import { charCleared, charGold } from '$lib/progress.svelte';
  import { unlock } from '$lib/audio';
  // 漢字 1 字のマス（字と代表の読み、クリアで星、金星で王冠）。ホームの学年ごとの一覧・よみから さがす・つづきから で共通
  let { c }: { c: string } = $props();
</script>

<a class={['card', 'cell', { done: charCleared(c) }]} href={practiceUrl(charWordId(c))} onclick={unlock}>
  <span class="ch kyokasho">{c}</span>
  <span class="yomi">{readingLabel(kanjiReading(c))}</span>
  {#if charGold(c)}<span class="s gold"><Icon name="crown" size={16} fill /></span>{:else if charCleared(c)}<span
      class="s"><Icon name="star" size={16} fill /></span
    >{/if}
</a>

<style>
  .cell {
    position: relative;
    height: 96px;
    display: grid;
    place-content: center;
    gap: 2px;
    text-decoration: none;
    color: var(--ink);
    text-align: center;
  }
  .ch {
    font-size: 34px;
    font-weight: bold;
    line-height: 1.1;
  }
  .yomi {
    font-size: 12px;
    color: var(--sub);
  }
  .done {
    background: #fff8dc;
  }
  .s {
    position: absolute;
    right: 6px;
    bottom: 6px;
    color: var(--star);
    display: grid;
  }
  .s.gold {
    color: var(--warn);
  }
</style>

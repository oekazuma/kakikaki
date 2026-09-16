<script lang="ts">
  import Icon from './Icon.svelte';
  import { practiceUrl } from '$lib/nav';
  import { KANJI, kanjiReading, readingLabel } from '$lib/kanji';
  import { charWordId } from '$lib/words';
  import { charCleared, charGold } from '$lib/progress.svelte';
  import { unlock } from '$lib/audio';
</script>

{#each KANJI as g (g.grade)}
  <h2>{g.name} <span class="cnt">{g.chars.filter(charCleared).length} / {g.chars.length}</span></h2>
  <div class="grid">
    {#each g.chars as c (c)}
      <a class={['card', 'cell', { done: charCleared(c) }]} href={practiceUrl(charWordId(c))} onclick={unlock}>
        <span class="ch kyokasho">{c}</span>
        <span class="yomi">{readingLabel(kanjiReading(c))}</span>
        {#if charGold(c)}<span class="s gold"><Icon name="crown" size={16} fill /></span>{:else if charCleared(c)}<span
            class="s"><Icon name="star" size={16} fill /></span
          >{/if}
      </a>
    {/each}
  </div>
{/each}

<style>
  h2 {
    font-size: 18px;
    color: var(--sub);
    margin: 22px 0 8px;
  }
  h2 .cnt {
    font-size: 14px;
    font-weight: normal;
    margin-left: 6px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: 8px;
  }
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

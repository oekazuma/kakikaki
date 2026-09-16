<script lang="ts">
  import Icon from './Icon.svelte';
  import { practiceUrl } from '$lib/nav';
  import { KANJI, kanjiReading, readingLabel } from '$lib/kanji';
  import { charWordId } from '$lib/words';
  import { charCleared, charGold } from '$lib/progress.svelte';
  import { unlock } from '$lib/audio';
  // 既定は学年ごと（ホーム）。/chars は読みの行ごとの並びを渡す
  // jump: 行の頭文字を右端に縦に固定して 1 タップで飛べるようにする（/chars の 440 字は縦に長い）。
  // 上に固定すると iPad のステータスバーのぼかしに重なって読めなくなる
  let { groups = KANJI, jump = false }: { groups?: { name: string; chars: string[] }[]; jump?: boolean } = $props();
</script>

{#if jump}
  <nav class="card jump" aria-label="よみの ぎょう">
    {#each groups as g (g.name)}<a href="#{g.name}">{g.name[0]}</a>{/each}
  </nav>
{/if}
{#each groups as g (g.name)}
  <h2 id={g.name}>{g.name} <span class="cnt">{g.chars.filter(charCleared).length} / {g.chars.length}</span></h2>
  <div class={['grid', { narrow: jump }]}>
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
  .jump {
    position: fixed;
    right: calc(env(safe-area-inset-right, 0px) + 10px);
    top: 50%;
    translate: 0 -50%;
    z-index: 1;
    display: grid;
    gap: 6px;
    padding: 6px;
  }
  .jump a {
    width: 44px;
    height: 44px;
    display: grid;
    place-content: center;
    border-radius: 50%;
    font-size: 22px;
    font-weight: bold;
    text-decoration: none;
    color: var(--blue);
    background: #f3f5f8;
  }
  h2 {
    scroll-margin-top: calc(var(--sat) + 8px); /* 飛んだ見出しがステータスバーの下に入らないように */
    font-size: 18px;
    color: var(--sub);
    margin: 22px 0 8px;
  }
  h2 .cnt {
    font-size: 14px;
    font-weight: normal;
    margin-left: 6px;
  }
  .grid.narrow {
    margin-right: 64px;
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

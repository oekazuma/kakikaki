<script lang="ts">
  import { practiceUrl } from '$lib/nav';
  import { fly } from 'svelte/transition';
  import BackButton from '$lib/components/BackButton.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { SEION, GROUPS, ALPHABET, toKatakana } from '$lib/chars';
  import { charCleared, charGold } from '$lib/progress.svelte';
  import { lang, info } from '$lib/lang.svelte';
</script>

<svelte:head>
  <title>もじから えらぶ | {info().title}</title>
  <meta name="description" content="練習したい文字をえらぶページ。" />
</svelte:head>

{#snippet cell(c: string)}
  {#if c}
    <a class={['card', 'cell', 'kyokasho', { done: charCleared(c) }]} href={practiceUrl(`char-${c}`)}>
      {c}
      {#if charGold(c)}<span class="s gold"><Icon name="crown" size={16} fill /></span>{:else if charCleared(c)}<span
          class="s"><Icon name="star" size={16} fill /></span
        >{/if}
    </a>
  {:else}<span class="cell empty"></span>{/if}
{/snippet}

{#snippet table(cols: string[][])}
  <div class="table" style:--n={cols.length}>
    {#each cols as col (col.join('|'))}
      <div class="col">
        {#each col as c, k (k + c)}{@render cell(c)}{/each}
      </div>
    {/each}
  </div>
{/snippet}

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1>もじから えらぶ</h1>
  </header>
  {#if lang.v !== 'en'}
    {@const k = lang.v === 'kana' ? toKatakana : (s: string) => s}
    <div class="ja">
      {@render table(SEION.map((col) => col.map(k)))}
      <div class="groups">
        {#each GROUPS as g (g.name)}
          <section class="card group">
            <h2>{g.name}</h2>
            {@render table(g.cols.map((col) => col.map(k)))}
          </section>
        {/each}
      </div>
    </div>
  {:else}
    <div class="en">
      {#each [['おおもじ', ALPHABET.slice(0, 2)], ['こもじ', ALPHABET.slice(2)]] as const as [name, rows] (name)}
        <section class="card group">
          <h2 class="ltr">{name}</h2>
          {#each rows as row (row.join(''))}
            <div class="row">
              {#each row as c (c)}{@render cell(c)}{/each}
            </div>
          {/each}
        </section>
      {/each}
    </div>
  {/if}
</main>

<style>
  main {
    padding: 16px 22px 40px;
  }
  header {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 12px;
  }
  h1 {
    margin: 0;
    font-size: 22px;
  }
  /* 五十音は右から左（あ行が右端） */
  .ja {
    direction: rtl;
    display: grid;
    gap: 18px;
  }
  .table {
    display: grid;
    grid-template-columns: repeat(var(--n), var(--cell, 96px));
    gap: 8px;
    justify-content: start;
  }
  .col {
    display: grid;
    gap: 8px;
  }
  .cell {
    direction: ltr;
    position: relative;
    width: var(--cell, 96px);
    height: var(--cell, 96px);
    display: grid;
    place-content: center;
    font-size: 30px;
    font-weight: bold;
    text-decoration: none;
    color: var(--ink);
  }
  .done {
    background: #fff8dc;
  }
  .empty {
    background: none;
    box-shadow: none;
  }
  .s {
    position: absolute;
    right: 6px;
    bottom: 6px;
    color: var(--star);
    display: grid;
  }
  .s.gold {
    color: #e08a00;
  }
  .groups {
    display: flex;
    gap: 16px;
    align-items: start;
    --cell: 78px;
  }
  .group {
    padding: 10px 14px 14px;
  }
  h2 {
    direction: ltr;
    text-align: right;
    margin: 0 0 8px;
    font-size: 15px;
    color: var(--sub);
  }
  .group .cell {
    font-size: 26px;
  }
  .en {
    display: grid;
    gap: 16px;
  }
  .ltr {
    text-align: left;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(13, 1fr);
    gap: 8px;
  }
  .row + .row {
    margin-top: 8px;
  }
  .en .cell {
    width: auto;
    height: auto;
    aspect-ratio: 1;
  }
</style>

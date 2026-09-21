<script lang="ts">
  import Icon from '../Icon.svelte';
  import Bar from '../Bar.svelte';
  import { CAT_TOTAL, TOTAL, type Stats } from '$lib/badges';
  import { CATEGORIES } from '$lib/words';
  import { quiz } from '$lib/progress.svelte';
  import { levelName, levelsOf } from '$lib/quiz';
  import { lang } from '$lib/lang.svelte';

  let { s }: { s: Stats } = $props();
  const total = $derived(TOTAL(lang.v));
  const tiles = $derived(
    (
      [
        { label: 'もじ', icon: 'pencil', have: s.chars, need: total.chars, color: 'var(--blue)' },
        { label: 'きんのほし', icon: 'star', have: s.gold, need: total.chars, color: 'var(--star)' },
        { label: 'たんご', icon: 'book', have: s.words, need: total.words, color: 'var(--teal)' },
        { label: 'おうかん', icon: 'crown', have: s.crowns, need: total.words, color: 'var(--warn)' }
      ] as const
    ).filter((t) => t.need > 0)
  );
  const pct = (h: number, n: number) => Math.floor((100 * h) / n);
</script>

<section class="tiles">
  {#each tiles as t (t.label)}
    <div class="card tile" style:--c={t.color}>
      <span class="ic"><Icon name={t.icon} size={22} /></span>
      <div class="tl">
        <span class="lb">{t.label}</span>
        <b>{t.have}<small>/ {t.need}</small></b>
      </div>
      <Bar have={t.have} need={t.need} color={t.color} />
      <span class="pct">{pct(t.have, t.need)}%</span>
    </div>
  {/each}
</section>

{#if total.words}
  <section class="card cats">
    {#each CATEGORIES as c (c)}
      <div class="cat">
        <span class="cn">{c}</span>
        <Bar have={s.cats[c]} need={CAT_TOTAL[c]} color="var(--teal)" />
        <small>{s.cats[c]} / {CAT_TOTAL[c]}</small>
      </div>
    {/each}
  </section>
{/if}

<section class="card quiz" class:one={levelsOf(lang.v).length > 3}>
  {#each [['read', 'よみクイズ'], ['write', 'かきクイズ']] as [k, name] (k)}
    <div class="qrow">
      <b>{name}</b>
      {#each levelsOf(lang.v) as lv (lv)}
        <span class="qc"><small>{levelName(lv, lang.v)}</small><b>{quiz()[`${k}${lv}`] ?? 0}</b> もん</span>
      {/each}
    </div>
  {/each}
</section>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }
  .tile {
    position: relative;
    padding: 12px 14px 12px 64px;
    display: grid;
    gap: 6px;
    border-left: 6px solid var(--c);
  }
  .ic {
    position: absolute;
    left: 14px;
    top: 14px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: grid;
    place-content: center;
    background: var(--c);
    color: #fff;
  }
  .tl {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-weight: bold;
  }
  .tl b {
    font-size: 24px;
  }
  .tl b small {
    font-size: 12px;
    margin-left: 3px;
  }
  .lb {
    color: var(--c);
  }
  .pct {
    position: absolute;
    right: 14px;
    bottom: 8px;
    font-size: 11px;
    font-weight: bold;
    color: var(--sub);
  }
  small {
    color: var(--sub);
    font-size: 11px;
  }
  .cats {
    padding: 12px 16px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px 20px;
    margin-bottom: 16px;
  }
  .cat {
    display: grid;
    grid-template-columns: 90px 1fr 50px;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: bold;
  }
  .cat small {
    text-align: right;
  }
  .quiz {
    padding: 12px 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 30px;
    margin-bottom: 16px;
  }
  /* かんじ は級が 6 つあり、よみ と かき を横に並べると語が 1 字ずつ折り返す */
  .quiz.one {
    grid-template-columns: 1fr;
  }
  .qrow {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 14px;
  }
  .qrow > b {
    flex: none;
    width: 90px;
  }
  .qc {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-size: 12px;
    white-space: nowrap;
    color: var(--sub);
  }
  .qc b {
    font-size: 18px;
    color: var(--ink);
  }
</style>

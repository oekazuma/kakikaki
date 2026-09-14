<script lang="ts">
  import Icon from '../Icon.svelte';
  import Bar from '../Bar.svelte';
  import { CAT_TOTAL, TOTAL } from '$lib/badges';
  import { CATEGORIES } from '$lib/words';
  import { stats, quiz } from '$lib/progress.svelte';
  import { LEVEL_NAME } from '$lib/quiz';
  import { lang } from '$lib/lang.svelte';

  const s = $derived(stats());
  const total = $derived(TOTAL(lang.v));
  const tiles = $derived([
    { label: 'もじ', icon: 'pencil', have: s.chars, need: total.chars, color: 'var(--blue)' },
    { label: 'きんのほし', icon: 'star', have: s.gold, need: total.chars, color: 'var(--star)' },
    { label: 'たんご', icon: 'book', have: s.words, need: total.words, color: 'var(--teal)' },
    { label: 'おうかん', icon: 'crown', have: s.crowns, need: total.words, color: '#e08a00' }
  ] as const);
  const pct = (h: number, n: number) => Math.floor((100 * h) / n);
</script>

<section class="tiles">
  {#each tiles as t (t.label)}
    <div class="card tile">
      <div class="tl">
        <span class="lb" style:color={t.color}><Icon name={t.icon} size={20} /> {t.label}</span><b
          >{pct(t.have, t.need)}%</b
        >
      </div>
      <Bar have={t.have} need={t.need} color={t.color} />
      <small>{t.have} / {t.need}</small>
    </div>
  {/each}
</section>

<section class="card cats">
  {#each CATEGORIES as c (c)}
    <div class="cat">
      <span class="cn">{c}</span>
      <Bar have={s.cats[c]} need={CAT_TOTAL[c]} color="var(--teal)" />
      <small>{s.cats[c]} / {CAT_TOTAL[c]}</small>
    </div>
  {/each}
</section>

<section class="card quiz">
  {#each [['read', 'よみクイズ'], ['write', 'かきクイズ']] as [k, name] (k)}
    <div class="qrow">
      <b>{name}</b>
      {#each [1, 2, 3] as lv (lv)}
        <span class="qc"><small>{LEVEL_NAME[lv as 1 | 2 | 3]}</small><b>{quiz()[`${k}${lv}`] ?? 0}</b> もん</span>
      {/each}
    </div>
  {/each}
</section>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }
  .tile {
    padding: 12px 14px;
    display: grid;
    gap: 6px;
  }
  .tl {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
  }
  .tl b {
    color: var(--sub);
  }
  .lb {
    display: flex;
    align-items: center;
    gap: 6px;
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
  .qrow {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 14px;
  }
  .qrow > b {
    width: 90px;
  }
  .qc {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-size: 12px;
    color: var(--sub);
  }
  .qc b {
    font-size: 18px;
    color: var(--ink);
  }
</style>

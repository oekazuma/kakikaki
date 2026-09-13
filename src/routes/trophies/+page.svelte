<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import BackButton from '$lib/components/BackButton.svelte';
  import { fly } from 'svelte/transition';
  import Bar from '$lib/components/Bar.svelte';
  import { badgesOf, CAT_TOTAL, TOTAL } from '$lib/badges';
  import { CATEGORIES } from '$lib/words';
  import { earned, stats, quiz } from '$lib/progress.svelte';
  import { LEVEL_NAME } from '$lib/quiz';
  import { lang, info } from '$lib/lang.svelte';

  const s = $derived(stats());
  const BADGES = $derived(badgesOf(lang.v));
  const total = $derived(TOTAL(lang.v));
  const got = $derived(Object.keys(earned()).length);
  const tiles = $derived([
    { label: 'もじ', icon: 'pencil', have: s.chars, need: total.chars, color: 'var(--blue)' },
    { label: 'きんのほし', icon: 'star', have: s.gold, need: total.chars, color: 'var(--star)' },
    { label: 'たんご', icon: 'book', have: s.words, need: total.words, color: 'var(--teal)' },
    { label: 'おうかん', icon: 'crown', have: s.crowns, need: total.words, color: '#e08a00' }
  ] as const);
  const pct = (h: number, n: number) => Math.floor((100 * h) / n);
</script>

<svelte:head>
  <title>めだる と きろく | {info().title}</title>
  <meta name="description" content="文字・単語・カテゴリごとの進捗率と、あつめたメダルを見るページ。" />
</svelte:head>

<main in:fly={{ x: 40, duration: 250 }}>
  <header>
    <BackButton />
    <h1><Icon name="trophy" /> めだる と きろく <small>（{info().short}）</small></h1>
    <span class="count">めだる {got} / {BADGES.length}</span>
  </header>

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

  <section class="badges">
    {#each BADGES as b (b.id)}
      {@const [have, need] = b.need(s)}
      {@const ok = !!earned()[b.id]}
      <div class={['card', 'badge', { ok }]}>
        <span class="em">{b.emoji}</span>
        <b>{b.name}</b>
        <small>{b.desc}</small>
        {#if ok}<span class="date">{earned()[b.id].replaceAll('-', '/')} ゲット！</span>{:else}<span class="rest"
            >あと {need - have}</span
          >{/if}
      </div>
    {/each}
  </section>
</main>

<style>
  main {
    padding: 16px 22px 40px;
  }
  header {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 14px;
  }
  h1 {
    margin: 0;
    font-size: 22px;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink);
  }
  h1 :global(svg) {
    color: #e08a00;
  }
  h1 small {
    font-size: 14px;
    color: var(--sub);
  }
  .count {
    font-weight: bold;
    color: var(--teal);
    background: #fff;
    padding: 8px 14px;
    border-radius: 14px;
  }
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
  .badges {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  .badge {
    padding: 12px 10px;
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 3px;
    filter: grayscale(1);
    opacity: 0.55;
  }
  .badge.ok {
    filter: none;
    opacity: 1;
    background: #fffae6;
    animation: pop 0.5s;
  }
  .em {
    font-size: 40px;
  }
  .badge b {
    font-size: 14px;
  }
  .date {
    font-size: 11px;
    color: #e08a00;
    font-weight: bold;
  }
  .rest {
    font-size: 11px;
    color: var(--sub);
  }
  @keyframes pop {
    50% {
      transform: scale(1.06);
    }
  }
</style>

<script lang="ts">
  import { resolve } from '$app/paths';
  import BackButton from '$lib/components/BackButton.svelte';
  import Calendar from '$lib/components/trophies/Calendar.svelte';
  import PersonTabs from '$lib/components/about/PersonTabs.svelte';
  import LangOverview from '$lib/components/about/LangOverview.svelte';
  import RowHeat from '$lib/components/about/RowHeat.svelte';
  import QuizBars from '$lib/components/about/QuizBars.svelte';
  import { lang, info, LANGS, type Lang } from '$lib/lang.svelte';
  import { profiles, byId } from '$lib/profiles.svelte';
  import { detailOf, daysOf, streakOf } from '$lib/progress.svelte';

  // 保護者向け: 人ごとに 3 ことば の達成率・カレンダー・行ごとのクリア・クイズ・苦手な文字。保存値を直接読む
  let pid = $state(profiles.cur);
  let sel = $state<Lang>(lang.v);
  const p = $derived(byId(pid) ?? profiles.list[0]);
  const details = $derived(LANGS.map((l) => ({ l, d: detailOf(p.id, l) })));
  const d = $derived(details.find((x) => x.l === sel)!.d);
  const days = $derived(daysOf(p.id));
  const streak = $derived(streakOf(p.id));
</script>

<svelte:head>
  <title>みんなの進み具合 | {info().title}</title>
  <meta name="description" content="人ごと・ことばごとの進み具合、クイズの正解数、苦手な文字の一覧（保護者向け）。" />
</svelte:head>

<main>
  <header>
    <BackButton href={resolve('/about')} />
    <h1>みんなの進み具合</h1>
    <PersonTabs list={profiles.list} cur={p.id} onselect={(id) => (pid = id)} />
  </header>

  <div class="top">
    {#each details as { l, d } (l)}
      <LangOverview {l} {d} on={l === sel} onselect={() => (sel = l)} />
    {/each}
    <Calendar {days} {streak} />
  </div>

  <div class="detail">
    <section class="card">
      <h2>{info(sel).short} の 行ごとのクリア</h2>
      <RowHeat l={sel} rows={d.rows} />
      <h2 class="mt">苦手な文字</h2>
      {#if d.weak.length}
        <p class="weak">
          {#each d.weak as w (w.c)}
            <span
              ><b class="kyokasho">{w.c}</b>{#if w.miss}<small>×{w.miss}</small>{/if}</span
            >
          {/each}
        </p>
        <p class="how">
          おてほんなしで 2 回以上まちがえた文字と、じぶんでかくが星 1 のままの文字。子どもの画面には出しません。
        </p>
      {:else}
        <p class="how">いまのところありません。</p>
      {/if}
    </section>
    <section class="card">
      <h2>{info(sel).short} の クイズの正解数（累計）</h2>
      <QuizBars quiz={d.quiz} />
      <p class="how">
        練習した日 {d.days} 日 · 最後に練習 {d.last?.replaceAll('-', '/') ?? '—'}
      </p>
    </section>
  </div>
</main>

<style>
  main {
    padding: 16px 22px 40px;
    display: grid;
    gap: 14px;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
  }
  h1 {
    margin: 0 8px 0 0;
    font-size: 22px;
  }
  .top {
    display: grid;
    grid-template-columns: repeat(3, 1fr) 300px;
    gap: 12px;
    align-items: stretch;
  }
  .top :global(.cal) {
    margin: 0;
  }
  .detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: start;
  }
  section {
    padding: 14px 18px;
  }
  h2 {
    margin: 0 0 8px;
    font-size: 15px;
    color: var(--blue);
  }
  .mt {
    margin-top: 14px;
  }
  .weak {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .weak span {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    padding: 2px 10px;
    border-radius: 10px;
    background: #fdecea;
    color: var(--danger-ink);
  }
  .weak b {
    font-size: 18px;
  }
  .how {
    margin: 8px 0 0;
    color: var(--sub);
    font-size: 12px;
  }
</style>

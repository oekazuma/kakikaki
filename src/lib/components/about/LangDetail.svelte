<script lang="ts">
  import Bar from '../Bar.svelte';
  import { info, type Lang } from '$lib/lang.svelte';
  import { ROWS, TOTAL } from '$lib/badges';
  import { LEVEL_NAME } from '$lib/quiz';
  import type { Detail } from '$lib/progress.svelte';
  // 1 ことば ぶんの詳細。記録が何もなければ 1 行だけ
  let { l, d }: { l: Lang; d: Detail } = $props();
  const total = $derived(TOTAL(l));
  const empty = $derived(
    d.chars + d.words + d.medals + d.days + d.weak.length + Object.values(d.quiz).reduce((a, b) => a + b, 0) === 0
  );
  const LEVELS = [1, 2, 3] as const;
</script>

<section class="lang">
  <h3>{info(l).short}</h3>
  {#if empty}
    <p class="none">まだ記録がありません</p>
  {:else}
    <div class="bars">
      <div class="line">
        <span>文字 {d.chars}/{total.chars}</span><Bar have={d.chars} need={total.chars} /><small>金の星 {d.gold}</small>
      </div>
      <div class="line">
        <span>単語 {d.words}/{total.words}</span><Bar have={d.words} need={total.words} color="var(--teal)" /><small
          >王冠 {d.crowns}</small
        >
      </div>
    </div>
    <dl class="facts">
      <div>
        <dt>メダル</dt>
        <dd>{d.medals} / {d.medalTotal}</dd>
      </div>
      <div>
        <dt>練習した日</dt>
        <dd>{d.days} 日</dd>
      </div>
      <div>
        <dt>最後に練習</dt>
        <dd>{d.last?.replaceAll('-', '/') ?? '—'}</dd>
      </div>
    </dl>
    <h4>行ごとのクリア</h4>
    <ul class="rows">
      {#each ROWS[l] as r (r.name)}
        <li class={{ done: d.rows[r.name] === r.chars.length }}>
          <span class="kyokasho">{r.name}</span><b>{d.rows[r.name]}/{r.chars.length}</b>
        </li>
      {/each}
    </ul>
    <h4>クイズの正解数（累計）</h4>
    <table>
      <thead
        ><tr
          ><th></th>{#each LEVELS as lv (lv)}<th>{LEVEL_NAME[lv]}</th>{/each}</tr
        ></thead
      >
      <tbody>
        <tr
          ><th>よみ</th>{#each LEVELS as lv (lv)}<td>{d.quiz[`read${lv}`] ?? 0}</td>{/each}</tr
        >
        <tr
          ><th>かき</th>{#each LEVELS as lv (lv)}<td>{d.quiz[`write${lv}`] ?? 0}</td>{/each}</tr
        >
      </tbody>
    </table>
    {#if d.weak.length}
      <h4>苦手な文字</h4>
      <p class="weak">
        {#each d.weak as w (w.c)}
          <span
            ><b class="kyokasho">{w.c}</b>{#if w.miss}<small>×{w.miss}</small>{/if}</span
          >
        {/each}
      </p>
      <p class="how">おてほんなしで 2 回以上まちがえた文字と、じぶんでかくが星 1 のままの文字です。</p>
    {/if}
  {/if}
</section>

<style>
  .lang {
    padding: 12px 0 0;
    border-top: 1px solid #e6e9ed;
  }
  h3 {
    margin: 0 0 6px;
    font-size: 17px;
    color: var(--blue);
  }
  h4 {
    margin: 12px 0 4px;
    font-size: 14px;
    color: var(--sub);
  }
  .none {
    margin: 0;
    color: var(--sub);
  }
  .line {
    display: grid;
    grid-template-columns: 110px 1fr 70px;
    align-items: center;
    gap: 8px;
  }
  .line + .line {
    margin-top: 4px;
  }
  .line small {
    color: var(--sub);
    text-align: right;
  }
  .facts {
    display: flex;
    gap: 18px;
    margin: 8px 0 0;
  }
  .facts div {
    display: flex;
    gap: 6px;
  }
  dt {
    color: var(--sub);
  }
  dd {
    margin: 0;
    font-weight: bold;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: 4px 10px;
    font-size: 13px;
  }
  .rows li {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 8px;
    background: var(--pill);
  }
  .rows li.done {
    background: #fff4d6;
    color: var(--warn);
  }
  table {
    border-collapse: collapse;
    font-size: 13px;
  }
  th,
  td {
    padding: 2px 14px 2px 0;
    text-align: right;
  }
  th {
    color: var(--sub);
    font-weight: bold;
    text-align: left;
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
    color: var(--sub);
    font-size: 12px;
  }
</style>

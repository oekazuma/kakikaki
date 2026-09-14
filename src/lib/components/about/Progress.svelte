<script lang="ts">
  import Avatar from '../Avatar.svelte';
  import Bar from '../Bar.svelte';
  import { LANGS, info } from '$lib/lang.svelte';
  import { profiles } from '$lib/profiles.svelte';
  import { summaryOf, weakOf } from '$lib/progress.svelte';
  import { TOTAL } from '$lib/badges';
  // 保護者向け: 全員 × 3 ことば の進み具合を、ことばを切り替えずに一覧する（記録は保存値から直接読む）
  const rows = $derived(
    profiles.list.map((p) => ({
      p,
      cells: LANGS.map((l) => ({ l, s: summaryOf(p.id, l), total: TOTAL(l), weak: weakOf(p.id, l).slice(0, 5) }))
    }))
  );
  const empty = (s: { chars: number; words: number; medals: number; days: number; quiz: number }) =>
    s.chars + s.words + s.medals + s.days + s.quiz === 0;
</script>

<section class="card">
  <h2>みんなの進み具合</h2>
  <p>ことばを切り替えずに、全員分を見られます。</p>
  <table>
    <thead>
      <tr>
        <th></th>
        {#each LANGS as l (l)}<th>{info(l).short}</th>{/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as { p, cells } (p.id)}
        <tr>
          <th class="who"><Avatar avatar={p.avatar} size={36} /><span>{p.name}</span></th>
          {#each cells as { l, s, total, weak } (l)}
            <td>
              {#if empty(s)}
                <span class="none">まだ</span>
              {:else}
                <div class="line">
                  <span>文字 {s.chars}/{total.chars}</span><Bar have={s.chars} need={total.chars} />
                </div>
                <div class="line">
                  <span>単語 {s.words}/{total.words}</span><Bar have={s.words} need={total.words} color="var(--teal)" />
                </div>
                <small>金の星 {s.gold}・メダル {s.medals}・{s.days} 日・クイズ {s.quiz} 問</small>
                {#if weak.length}<small class="weak">苦手: <span class="kyokasho">{weak.join('・')}</span></small>{/if}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    line-height: 1.4;
  }
  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: 8px 6px;
    border-top: 1px solid #e6e9ed;
  }
  thead th {
    border-top: 0;
    color: var(--sub);
    font-weight: bold;
    padding-bottom: 4px;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    font-weight: bold;
  }
  .line {
    display: grid;
    grid-template-columns: 96px 1fr;
    align-items: center;
    gap: 6px;
  }
  .line + .line {
    margin-top: 4px;
  }
  small {
    display: block;
    margin-top: 4px;
    color: var(--sub);
  }
  .none {
    color: var(--sub);
  }
  .weak {
    color: var(--danger-ink);
  }
</style>

<script lang="ts">
  import Icon from '../Icon.svelte';
  import { today } from '$lib/today';
  // 今月のカレンダー。全ことば をまたいで練習した日に印。連続した日数を上に出す（切れたことは言わない）
  let { days, streak }: { days: string[]; streak: number } = $props();
  const t = today();
  const [y, m] = t.split('-').map(Number);
  const first = new Date(y, m - 1, 1).getDay();
  const count = new Date(y, m, 0).getDate();
  // 月初までの空きマスは負の番号で区別する（各マスに固有のキーを持たせる）
  const cells = Array.from({ length: first + count }, (_, i) => (i < first ? -(i + 1) : i - first + 1));
  const key = (d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const set = $derived(new Set(days));
</script>

<section class="card cal">
  <div class="head">
    <b>{m} がつ</b>
    {#if streak > 0}<span class="streak"><Icon name="star" size={16} fill /> つづけて {streak} にち</span>{/if}
  </div>
  <div class="grid">
    {#each ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'] as w (w)}<span class="w">{w}</span>{/each}
    {#each cells as d (d)}
      {#if d < 0}<span></span>{:else}
        <span class="cell"><span class={['d', { on: set.has(key(d)), today: key(d) === t }]}>{d}</span></span>
      {/if}
    {/each}
  </div>
</section>

<style>
  .cal {
    padding: 14px 18px;
    margin-bottom: 14px;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    font-size: 16px;
  }
  .streak {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 14px;
    background: #fff3c4;
    color: var(--warn);
    font-size: 14px;
    font-weight: bold;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px 4px;
    text-align: center;
    font-size: 13px;
  }
  .w {
    color: var(--sub);
    font-size: 11px;
  }
  .cell {
    display: grid;
    place-items: center;
  }
  /* 印は固定サイズの丸。マスの幅に引きずられて楕円にならないように */
  .d {
    width: 32px;
    height: 32px;
    line-height: 32px;
    border-radius: 50%;
    color: var(--sub);
  }
  .d.on {
    background: var(--blue);
    color: #fff;
    font-weight: bold;
  }
  .d.today {
    box-shadow:
      0 0 0 2px var(--card),
      0 0 0 4px var(--blue);
  }
</style>

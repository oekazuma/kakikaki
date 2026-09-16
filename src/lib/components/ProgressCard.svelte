<script lang="ts">
  import { resolve } from '$app/paths';
  import Bar from './Bar.svelte';
  import Icon from './Icon.svelte';
  import { earned } from '$lib/progress.svelte';
  import type { Stats } from '$lib/badges';
  let { s, total, badgeCount }: { s: Stats; total: { chars: number; words: number }; badgeCount: number } = $props();
</script>

<a class="card prog" href={resolve('/trophies')}>
  <span class="tr"><Icon name="trophy" size={22} /> {Object.keys(earned()).length} / {badgeCount}</span>
  <span class="pl">もじ {s.chars}/{total.chars}<Bar have={s.chars} need={total.chars} /></span>
  {#if total.words}
    <span class="pl">たんご {s.words}/{total.words}<Bar have={s.words} need={total.words} color="var(--teal)" /></span>
  {/if}
</a>

<style>
  .prog {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    text-decoration: none;
    font-size: 13px;
    font-weight: bold;
    color: var(--ink);
  }
  .pl {
    display: grid;
    gap: 3px;
    width: 96px;
    font-size: 11px;
    color: var(--sub);
  }
  .tr {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--warn);
  }
  /* iPad Pro 12.9（1366）や名前 6 文字でも 1 行に収める。進捗バーは実績画面にもあるので省略 */
  @media (max-width: 1500px) {
    .pl {
      display: none;
    }
  }
</style>

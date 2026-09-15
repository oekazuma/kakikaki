<script lang="ts">
  import Icon from '../Icon.svelte';
  import { ROWS } from '$lib/badges';
  import type { Lang } from '$lib/lang.svelte';
  // 行ごとのクリア数。色の濃淡ではなく棒の長さと数字で示し、全部クリアした行には ✓
  let { l, rows }: { l: Lang; rows: Record<string, number> } = $props();
  const cells = $derived(
    ROWS[l].map((r) => {
      const have = rows[r.name] ?? 0;
      return { name: r.name, have, need: r.chars.length, pct: (100 * have) / r.chars.length };
    })
  );
</script>

<ul>
  {#each cells as c (c.name)}
    <li class={{ done: c.have === c.need }}>
      <span class="head">
        <span class="kyokasho">{c.name}</span>
        <small
          >{#if c.have === c.need}<Icon name="check" size={14} />{/if}{c.have}/{c.need}</small
        >
      </span>
      <span class="bar"><span class="fill" style:width="{c.pct}%"></span></span>
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
  li {
    display: grid;
    gap: 4px;
    padding: 6px 8px;
    border-radius: 8px;
    background: var(--pill);
    font-size: 14px;
    font-weight: bold;
    white-space: nowrap;
  }
  li.done {
    background: #fff4d6;
    color: var(--warn);
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
  }
  small {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    font-weight: normal;
  }
  .bar {
    display: block;
    height: 6px;
    border-radius: 3px;
    background: #fff;
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--blue);
  }
  li.done .fill {
    background: var(--warn);
  }
</style>

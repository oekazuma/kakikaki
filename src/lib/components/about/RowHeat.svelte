<script lang="ts">
  import { ROWS } from '$lib/badges';
  import type { Lang } from '$lib/lang.svelte';
  // 行ごとのクリア数を塗りの濃さで見せるマス目
  let { l, rows }: { l: Lang; rows: Record<string, number> } = $props();
  const cells = $derived(
    ROWS[l].map((r) => {
      const have = rows[r.name] ?? 0;
      return { name: r.name, have, need: r.chars.length, p: Math.round((100 * have) / r.chars.length) };
    })
  );
</script>

<ul>
  {#each cells as c (c.name)}
    <li class={{ deep: c.p >= 60 }} style:--p="{c.p}%">
      <span class="kyokasho">{c.name}</span><small>{c.have}/{c.need}</small>
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
    gap: 5px;
  }
  li {
    display: grid;
    gap: 1px;
    padding: 5px 8px;
    white-space: nowrap;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    background: color-mix(in srgb, var(--blue) var(--p), var(--pill));
    color: var(--ink);
  }
  li.deep {
    color: #fff;
  }
  small {
    font-size: 11px;
    font-weight: normal;
  }
</style>

<script lang="ts">
  import { LEVEL_NAME } from '$lib/quiz';
  // クイズの正解数（累計）を横棒で。長さはいちばん多い項目を 100% にする
  let { quiz }: { quiz: Record<string, number> } = $props();
  const KINDS = [
    ['read', 'よみ'],
    ['write', 'かき']
  ] as const;
  const LEVELS = [1, 2, 3] as const;
  const rows = $derived(
    KINDS.flatMap(([k, name]) =>
      LEVELS.map((lv) => ({ key: `${k}${lv}`, kind: k, label: `${name} ${LEVEL_NAME[lv]}`, n: quiz[`${k}${lv}`] ?? 0 }))
    )
  );
  const max = $derived(Math.max(1, ...rows.map((r) => r.n)));
</script>

<dl>
  {#each rows as r (r.key)}
    <dt>{r.label}</dt>
    <dd>
      <span class="bar"><span class={['fill', r.kind]} style:width="{(100 * r.n) / max}%"></span></span>
      <b>{r.n}</b>
    </dd>
  {/each}
</dl>

<style>
  dl {
    margin: 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 10px;
    align-items: center;
    font-size: 13px;
  }
  dt {
    color: var(--sub);
    white-space: nowrap;
  }
  dd {
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 2.5em;
    gap: 8px;
    align-items: center;
  }
  .bar {
    display: block;
    height: 12px;
    border-radius: 6px;
    background: var(--pill);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    border-radius: 6px;
    background: var(--blue);
    transition: width 0.6s ease-out;
  }
  .fill.write {
    background: var(--teal);
  }
  b {
    text-align: right;
  }
</style>

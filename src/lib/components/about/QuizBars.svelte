<script lang="ts">
  import { display } from '$lib/grade';
  import { levelName, levelsOf } from '$lib/quiz';
  import type { Lang } from '$lib/lang.svelte';
  // クイズの正解数（累計）を横棒で。長さはいちばん多い項目を 100% にする
  let { quiz, l }: { quiz: Record<string, number>; l: Lang } = $props();
  const KINDS = [
    ['read', 'よみ'],
    ['write', 'かき']
  ] as const;
  const rows = $derived(
    KINDS.flatMap(([k, name]) =>
      levelsOf(l).map((lv) => ({
        key: `${k}${lv}`,
        kind: k,
        // 保護者向けの画面は学年で変えず、級の名前は書き方を付ける前と同じ かな で出す
        label: `${name} ${display(levelName(lv, l), null)}`,
        n: quiz[`${k}${lv}`] ?? 0
      }))
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

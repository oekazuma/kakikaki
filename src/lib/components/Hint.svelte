<script lang="ts">
  import type { PracticeSession } from '$lib/practice.svelte';
  // 書き取り面の下のひとこと。なぞる では いまの画の番号を書き取り面と同じ丸で示す
  let { s, total }: { s: PracticeSession; total: number } = $props();
</script>

<p class="hint">
  {#if s.msg}
    {s.msg}
  {:else if s.mode === 'trace'}
    <span class="num">{Math.min(s.stroke + 1, total)}</span>{s.cur.hint}
  {:else if s.mode === 'test' && s.drawn}
    かけたら みぎの「できた」を おしてね
  {:else}
    {s.cur.hint}
  {/if}
</p>

<style>
  .hint {
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 22px;
    border-radius: 20px;
    background: #fff;
    color: var(--ink);
    font-size: 18px;
    min-height: 40px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  .num {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--blue);
    color: #fff;
    display: grid;
    place-content: center;
    font-size: 17px;
  }
</style>

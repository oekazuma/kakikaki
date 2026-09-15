<script lang="ts">
  import type { WriteQuiz } from '$lib/quiz-session.svelte';
  // かきクイズの文字枠。書けた文字は見せ、いまの文字は なぞる に切り替わったときだけ見せる。
  // 穴埋めは書く 1 文字だけを ？ にし、残りは最初から見せる
  let { w }: { w: WriteQuiz } = $props();
  const target = $derived(w.targets[w.k]);
</script>

<div class="slots">
  {#each w.letters as ch, n (n + ch)}
    <span class={['slot', 'card', 'kyokasho', { on: n === target, ok: w.kind !== 'blank' && n < target }]}
      >{n === target ? (w.mode === 'trace' ? ch : '?') : w.kind === 'blank' || n < target ? ch : '?'}</span
    >
  {/each}
</div>

<style>
  .slots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .slot {
    width: 46px;
    height: 52px;
    display: grid;
    place-content: center;
    font-size: 24px;
    font-weight: bold;
    color: var(--sub);
  }
  .slot.on {
    background: var(--blue);
    color: #fff;
  }
  .slot.ok {
    color: var(--ink);
    background: #fff8dc;
  }
</style>

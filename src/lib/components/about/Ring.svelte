<script lang="ts">
  // 達成率のリング。外が文字、内が単語（単語の無い ことば では外だけ）。中の数字は文字の達成率
  let { chars, words }: { chars: [number, number]; words?: [number, number] } = $props();
  const R1 = 36;
  const R2 = 24;
  const C1 = 2 * Math.PI * R1;
  const C2 = 2 * Math.PI * R2;
  const ratio = ([have, need]: [number, number]) => (need ? Math.min(1, have / need) : 0);
  const pct = $derived(Math.round(ratio(chars) * 100));
</script>

<svg width="96" height="96" viewBox="0 0 88 88" role="img" aria-label="文字 {pct}%">
  <circle cx="44" cy="44" r={R1} class="track" stroke-width="10" />
  <circle
    cx="44"
    cy="44"
    r={R1}
    class="chars"
    stroke-width="10"
    stroke-dasharray={C1}
    stroke-dashoffset={C1 * (1 - ratio(chars))}
  />
  {#if words}
    <circle cx="44" cy="44" r={R2} class="track" stroke-width="8" />
    <circle
      cx="44"
      cy="44"
      r={R2}
      class="words"
      stroke-width="8"
      stroke-dasharray={C2}
      stroke-dashoffset={C2 * (1 - ratio(words))}
    />
  {/if}
  <text x="44" y="44" class="pct">{pct}%</text>
</svg>

<style>
  circle {
    fill: none;
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: center;
    transition: stroke-dashoffset 0.6s ease-out;
  }
  .track {
    stroke: var(--pill);
  }
  .chars {
    stroke: var(--blue);
  }
  .words {
    stroke: var(--teal);
  }
  .pct {
    font-size: 15px;
    font-weight: bold;
    fill: var(--blue);
    text-anchor: middle;
    dominant-baseline: central;
  }
</style>

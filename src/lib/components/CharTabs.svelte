<script lang="ts">
  import Icon from './Icon.svelte';
  import Stars from './Stars.svelte';
  import { get, charCleared } from '$lib/progress.svelte';
  import type { PracticeSession } from '$lib/practice.svelte';
  // 単語の文字タブ（左から順に解放）と、いまの文字の星
  let { s }: { s: PracticeSession } = $props();
</script>

<div class={['tabs', { compact: s.chars.length > 6 }]}>
  {#each s.chars as ch, n (n + ch)}
    {@const lock = !s.unlocked(n)}
    <button
      class={['tab', 'card', { on: n === s.i, lock, done: charCleared(ch), shake: s.shaking === n }]}
      aria-disabled={lock}
      onclick={() => s.tapTab(n)}
      onanimationend={() => s.shaken()}
    >
      <span class="ch kyokasho">{ch}</span>
      <span class={['s', { gold: get(ch).test > 0 }]}>
        {#if lock}<Icon name="lock" size={14} />{:else if get(ch).test > 0}<Icon
            name="crown"
            size={14}
            fill
          />{:else if charCleared(ch)}<Icon name="star" size={14} fill />{/if}
      </span>
    </button>
  {/each}
</div>
<div class="charstars card">
  <div class="row"><span>なぞる</span><Stars n={2} k={get(s.c).trace} size={20} /></div>
  <div class="row"><span>じぶんで かく</span><Stars n={1} k={get(s.c).free} size={20} /></div>
  <div class="row gold"><span>おてほんなし</span><Stars n={1} k={get(s.c).test} size={20} /></div>
</div>

<style>
  .tabs {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    --tab: 62px;
    --tabh: 68px;
    --tabf: 30px;
  }
  /* 7 文字以上は小さめにして 4 列で収める */
  .tabs.compact {
    gap: 7px;
    --tab: 52px;
    --tabh: 58px;
    --tabf: 24px;
  }
  .tab {
    width: var(--tab);
    height: var(--tabh);
    display: grid;
    grid-template-rows: 1fr 16px;
    justify-items: center;
    align-items: center;
    padding: 6px 0 4px;
    font-size: var(--tabf);
    font-weight: bold;
    border: 3px solid transparent;
  }
  .tab.done {
    background: #fff8dc;
  }
  .tab.on {
    background: var(--blue);
    color: #fff;
    border-color: var(--dark);
  }
  .tab.lock {
    background: #e9ecef;
    color: #b0b7bf;
    box-shadow: none;
  }
  .tab .s {
    display: grid;
    color: var(--star);
  }
  .tab .s.gold {
    color: #e08a00;
  }
  .tab.on .s {
    color: #fff;
  }
  .tab.lock .s {
    color: #b0b7bf;
  }
  .tab.shake {
    animation: tabshake 0.4s;
  }
  @keyframes tabshake {
    20%,
    60% {
      transform: translateX(-7px);
    }
    40%,
    80% {
      transform: translateX(7px);
    }
  }
  .charstars {
    padding: 12px 18px;
    display: grid;
    gap: 8px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 15px;
    font-weight: bold;
    color: var(--sub);
  }
  .row.gold :global(.on) {
    color: #e08a00;
  }
</style>

<script lang="ts">
  import Bar from '../Bar.svelte';
  import { BADGE_GROUPS, type Badge, type Stats } from '$lib/badges';
  import { today } from '$lib/today';
  // メダルをテーマごとの段に並べる。獲得済みは色つき、未獲得は灰色で進み具合のバー、きょう取ったものは NEW
  let { s, badges, got }: { s: Stats; badges: Badge[]; got: Record<string, string> } = $props();
  const groups = $derived(
    BADGE_GROUPS.map((g) => ({ name: g, items: badges.filter((b) => b.group === g) })).filter((g) => g.items.length)
  );
  const isToday = (d: string) => d === today();
</script>

{#each groups as g (g.name)}
  {@const done = g.items.filter((b) => got[b.id]).length}
  <section class="group">
    <h2>
      {g.name}
      <span class={['cnt', { full: done === g.items.length }]}>{done} / {g.items.length}</span>
    </h2>
    <div class="badges">
      {#each g.items as b (b.id)}
        {@const [have, need] = b.need(s)}
        {@const date = got[b.id]}
        {@const ok = !!date}
        <div class={['card', 'badge', { ok, fresh: ok && isToday(date) }]}>
          {#if ok && isToday(date)}<span class="new">NEW!</span>{/if}
          {#if b.secret && !ok}
            <span class="em">❓</span>
            <b>？？？</b>
            <small>どこかに かくれているよ</small>
          {:else}
            <span class="em">{b.emoji}</span>
            <b>{b.name}</b>
            <small>{b.desc}</small>
          {/if}
          {#if ok}
            <span class="date">{date.replaceAll('-', '/')} ゲット！</span>
          {:else if !b.secret}
            <Bar {have} {need} color="var(--teal)" />
            <span class="rest">あと {Math.max(0, need - have)}</span>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/each}

<style>
  .group {
    margin-bottom: 18px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 17px;
    color: var(--ink);
    margin: 0 0 8px 4px;
  }
  .cnt {
    font-size: 13px;
    color: var(--sub);
    background: #fff;
    padding: 2px 10px;
    border-radius: 10px;
  }
  .cnt.full {
    color: #fff;
    background: var(--star);
  }
  .badges {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  .badge {
    position: relative;
    padding: 12px 10px;
    display: grid;
    justify-items: center;
    align-content: start;
    text-align: center;
    gap: 3px;
    background: #f7f8f5;
  }
  .badge :global(.bar) {
    width: 80%;
    height: 6px;
    margin-top: 4px;
  }
  .badge.ok {
    background: linear-gradient(160deg, #fffbe6, #fff1b8);
    border: 2px solid var(--star);
    animation: pop 0.5s;
  }
  .badge.ok .em {
    animation: shine 2.4s ease-in-out infinite;
  }
  .badge.fresh {
    box-shadow: 0 0 0 4px #ffe58a;
  }
  .new {
    position: absolute;
    top: -8px;
    right: -6px;
    background: var(--danger);
    color: #fff;
    font-size: 11px;
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 10px;
    transform: rotate(8deg);
  }
  .em {
    font-size: 40px;
    filter: grayscale(1);
    opacity: 0.45;
  }
  .badge.ok .em {
    filter: none;
    opacity: 1;
  }
  .badge b {
    font-size: 14px;
  }
  small {
    color: var(--sub);
    font-size: 11px;
    min-height: 2.6em;
  }
  .date {
    font-size: 11px;
    color: var(--warn);
    font-weight: bold;
  }
  .rest {
    font-size: 11px;
    color: var(--sub);
  }
  @keyframes pop {
    50% {
      transform: scale(1.06);
    }
  }
  @keyframes shine {
    0%,
    100% {
      transform: scale(1) rotate(0);
    }
    50% {
      transform: scale(1.12) rotate(-6deg);
    }
  }
</style>
